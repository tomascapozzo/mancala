import { Injectable } from '@angular/core';
import { BoardState, Player } from './board.model';
import {
  createInitialBoard,
  applyMove,
  isGameOver,
  getWinner,
  getBestMove,
  isValidMove,
  cloneBoard,
  getDistributionPath,
} from './mancala.logic';


@Injectable({
  providedIn: 'root',
})
export class MancalaService {
  private mode: 'pvp' | 'ai' = 'pvp';
  private AIPlayer: Player = 1;

  aiEnabled = true;
  private board!: BoardState;
  private aiDepth = 4;
  moveHistory: {
    player: number;
    pit: number;
    extraTurn: boolean;
  }[] = [];
  isAnimating = false;
  animationDrops: number[] = [];



  constructor() {
    this.reset();
  }

  setMode(mode: 'pvp' | 'ai') {
    this.mode = mode;
  }

  setAiDepth(depth: number) {
    this.aiDepth = depth;
  }

 private playAiTurn() {

  if (isGameOver(this.board)) return;
  if (this.board.currentPlayer !== this.AIPlayer) return;

  const aiMove = getBestMove(
    this.board,
    this.AIPlayer,
    this.aiDepth
  );

  if (aiMove === null) return;

  setTimeout(() => {
    this.playMove(aiMove);
  }, 1500);
}

animateMove(
  originalBoard: BoardState,
  startPit: number,
  path: number[]
) {

  this.isAnimating = true;

  // Visual board copy
  let tempBoard = cloneBoard(originalBoard);
  tempBoard.pits[startPit] = 0;
  this.board = tempBoard;

  let i = 0;

  const dropNext = () => {

    if (i >= path.length) {

      // 🔥 Apply rules using ORIGINAL board
      this.board = applyMove(originalBoard, startPit);
      this.isAnimating = false;

      if (
        this.mode === 'ai' &&
        this.board.currentPlayer === this.AIPlayer
      ) {
        setTimeout(() => this.playAiTurn(), 400);
      }

      return;
    }

    const pit = path[i];
    this.board.pits[pit]++;

    i++;
    setTimeout(dropNext, 120);
  };

  dropNext();
}


  /** Returns current board */
  getBoard(): BoardState {
    return this.board;
  }

  /** Reset to initial state */
  reset(): void {
  this.board = createInitialBoard();
  this.moveHistory = [];
}

  /** Play a pit index */
playMove(pitIndex: number): void {

  if (this.isAnimating) return;
  if (isGameOver(this.board)) return;
  if (!isValidMove(this.board, pitIndex)) return;

  const originalBoard = cloneBoard(this.board);
  const path = getDistributionPath(originalBoard, pitIndex);

  this.animateMove(originalBoard, pitIndex, path);
}





  isValidMove(i: number) {
    return isValidMove(this.board, i);
  }

  isGameOver() {
    return isGameOver(this.board);
  }

  getWinner() {
    return getWinner(this.board);
  }

  isAiMode() {
    return this.mode === 'ai';
  }

  getHistory() {
    return this.moveHistory;
  }
}
