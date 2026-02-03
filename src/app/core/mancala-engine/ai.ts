import { BoardState } from "./board.model";
import { getValidMoves } from "./mancala.logic";

export function getRandomMove(board: BoardState): number | null {
  const moves = getValidMoves(board);

  if (moves.length === 0) return null;

  const index = Math.floor(Math.random() * moves.length);
  return moves[index];
}
