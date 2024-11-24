import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { deepClone, getSymbolForPlayer } from "./utils";
import { initiateStatics } from "./statics";

const initialState: GameState = {
  board: Array(9).fill(null),
  currentPlayer: "X",
  winner: null,
};

let rooms: Map<string, Room> = new Map();
let resetRoom: Map<string, { requestedBy: string }> = new Map();
let players = new Map<string, { symbol: Player; ws: any; roomId: string }>();

const PORT = Bun.env.VITE_BACK_PORT || Bun.env.PORT || 3000;

const app = new Elysia().use(cors());
initiateStatics(app);
app.ws("/game", {
  body: t.Union([
    t.Object({
      type: t.Literal("join"),
    }),
    t.Object({
      type: t.Literal("move"),
      roomId: t.String(),
      index: t.Number(),
    }),
    t.Object({
      type: t.Literal("reset"),
      roomId: t.String(),
    }),
    t.Object({
      type: t.Literal("reset-confirmation"),
      roomId: t.String(),
      wanna: t.Boolean(),
    }),
  ]),
  message: (ws, message) => {
    if (typeof message !== "object" || !message) return;

    if (message.type === "join") {
      joinRoom(ws);
      return;
    }

    if (message.type === "move") {
      const { roomId, index } = message;
      const room = rooms.get(roomId);
      if (room && typeof index === "number" && index >= 0 && index < 9) {
        makeMove(room, index, ws.id);
      }
      return;
    }

    if (message.type === "reset") {
      const { roomId } = message;
      const opponent = getPlayersInfosByRoomId(roomId).find(
        (p) => p.ws.id != ws.id
      );
      if (!opponent) return;

      opponent.ws.send(JSON.stringify({ type: "wanna-reset", roomId }));
      resetRoom.set(roomId, { requestedBy: ws.id });
      return;
    }

    if (message.type === "reset-confirmation") {
      const { roomId } = message;
      const player = players.get(ws.id);
      const request = resetRoom.get(roomId);

      if (!player || !request || player.roomId != roomId) return;

      const room = rooms.get(roomId);
      if (!room) return;

      if (message.wanna) {
        resetGame(room);
        resetRoom.delete(roomId);
        return;
      }

      players
        .get(request.requestedBy)!
        .ws.send(JSON.stringify({ type: "game-reset-rejected" }));
    }
  },
  close: (ws) => {
    leaveRoom(ws);
  },
});

app.listen(PORT, (server) => {
  console.log(`Server is running on ${server.url}`);
});

function joinRoom(ws: any) {
  let room: Room | undefined;

  for (const [id, r] of rooms) {
    if (r.players.length < 2) {
      room = r;
      break;
    }
  }

  if (!room) {
    const id = generateRoomId();
    room = {
      id,
      players: [],
      gameState: deepClone(initialState),
    };
    rooms.set(id, room);
  }
  const playerSymbol = getSymbolForPlayer(room);
  players.set(ws.id, { roomId: room.id, symbol: playerSymbol, ws });

  room.players.push(playerSymbol);
  room.gameState.currentPlayer ||= room.players.at(0)!;

  ws.send(
    JSON.stringify({
      type: "roomJoined",
      roomId: room.id,
    })
  );

  if (room.players.length === 2) {
    broadcastToRoom(room, { type: "gameStart" });
    broadcastRoomState(room);
  }

  for (const player of getPlayersInfosByRoomId(room.id)) {
    player.ws.send(
      JSON.stringify({ type: "user-info", symbol: player.symbol })
    );
  }
}

function leaveRoom(ws: any) {
  const player = players.get(ws.id);
  if (!player) return;
  players.delete(ws.id);
  for (const [id, room] of rooms) {
    if (id == player.roomId) {
      room.players = room.players.filter((p) => p != player.symbol);
      if (room.players.length === 0) {
        rooms.delete(id);
      } else {
        broadcastToRoom(room, { type: "opponentLeft" });
        resetGame(room);
      }
      break;
    }
  }
}

function makeMove(room: Room, index: number, playerId: string) {
  const { gameState } = room;
  const player = players.get(playerId);
  if (!player) return;
  if (player.roomId != room.id || player.symbol != gameState.currentPlayer) {
    return;
  }

  if (!gameState.board[index] && !gameState.winner) {
    gameState.board[index] = gameState.currentPlayer;
    gameState.currentPlayer = room.players.find(
      (player) => player != gameState.currentPlayer
    )!;
    checkWinner(room);
    broadcastRoomState(room);
  }
}

function resetGame(room: Room) {
  room.gameState.board = deepClone(initialState.board);
  room.gameState.winner = null;
  room.gameState.currentPlayer = room.players.at(0)!;
  rooms.set(room.id, room);
  broadcastRoomState(room);
}

function broadcastToRoom(room: Room, message: any) {
  for (const player of getPlayersInfosByRoomId(room.id)) {
    player.ws.send(JSON.stringify(message));
  }
}

function broadcastRoomState(room: Room) {
  broadcastToRoom(room, { type: "state", state: room.gameState });
}

function checkWinner(room: Room) {
  const { gameState } = room;
  const winPatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // Rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // Columns
    [0, 4, 8],
    [2, 4, 6], // Diagonals
  ];

  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (
      gameState.board[a] &&
      gameState.board[a] === gameState.board[b] &&
      gameState.board[a] === gameState.board[c]
    ) {
      gameState.winner = gameState.board[a];
      return;
    }
  }

  if (!gameState.board.includes(null)) {
    gameState.winner = "draw";
  }
}

function generateRoomId() {
  return Math.random().toString(36).substr(2, 6);
}

function getPlayersInfosByRoomId(roomId: string) {
  return Array.from(players.values()).filter(
    (player) => player.roomId == roomId
  );
}
