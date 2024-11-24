type Player = "X" | "O";

type Board = (Player | null)[];

interface GameState {
  board: Board;
  currentPlayer: Player;
  winner: Player | "draw" | null;
}

interface Room {
  id: string;
  players: Player[];
  gameState: GameState;
}
