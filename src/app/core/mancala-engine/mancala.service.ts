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
  getCaptureInfo,
} from './mancala.logic';
import { SoundService } from '../sound';


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
  onBoardChanged?: (board: BoardState) => void;




  constructor(private sound: SoundService) {
    this.reset();
  }

  setMode(mode: 'pvp' | 'ai') {
    this.mode = mode;
  }

setBoard(board: BoardState) {
  console.log('[ENGINE] setBoard called:', board);
  this.board = cloneBoard(board);
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

finishMove(originalBoard: BoardState, startPit: number) {
  this.board = applyMove(originalBoard, startPit);
  this.isAnimating = false;

  // 🔥 ADD THIS CALLBACK HOOK
  if (this.onBoardChanged) {
    this.onBoardChanged(this.board);
  }

  if (
    this.mode === 'ai' &&
    this.board.currentPlayer === this.AIPlayer
  ) {
    setTimeout(() => this.playAiTurn(), 400);
  }
}


animateCapture(
  fromPit: number,
  storePit: number,
  originalBoard: BoardState,
  startPit: number
) {

  this.sound.playCapture();
  const stones = this.board.pits[fromPit];
  this.board.pits[fromPit] = 0;

  let moved = 0;

  const moveOne = () => {

    if (moved >= stones) {
      this.finishMove(originalBoard, startPit);
      return;
    }

    this.board.pits[storePit]++;
    moved++;

    setTimeout(moveOne, 80);
  };

  moveOne();
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

      const lastPit = path[path.length - 1];
      if (
    lastPit === (originalBoard.currentPlayer === 0 ? 6 : 13)
  ) {
    this.sound.playCapture();
  }

  const capture = getCaptureInfo(originalBoard, startPit);

  if (capture) {
    this.animateCapture(
      capture.from,
      capture.to,
      originalBoard,
      startPit
    );
  } else {
    this.finishMove(originalBoard, startPit);
  }

  return;
}


    const pit = path[i];
this.board.pits[pit]++;

// Only play drop sound if NOT final stone into store
const isLast = i === path.length - 1;
const ownStore =
  originalBoard.currentPlayer === 0 ? 6 : 13;

if (!(isLast && pit === ownStore)) {
  this.sound.playDrop();
}

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

  playRemoteMove(startPit: number) {
  if (this.isAnimating) return;

  const original = cloneBoard(this.board);
  const path = getDistributionPath(original, startPit);

  this.animateMove(original, startPit, path);
}

}


