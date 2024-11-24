export function getSymbolForPlayer(room: Room): Player {
  if (room.players.length === 0 || room.gameState.currentPlayer == "O") {
    return "X";
  }

  return "O";
}

export function deepClone<T = undefined>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
