export type Player = 0 | 1;

export interface BoardState {
  pits: number[];
  currentPlayer: Player;
}
