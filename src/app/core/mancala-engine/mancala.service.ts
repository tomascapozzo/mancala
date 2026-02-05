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
  isRemoteMove = false;
  remoteMoveQueue: number[] = [];
  onBoardChanged?: (board: BoardState, movePit: number) => void;




  constructor(private sound: SoundService) {
    this.reset();
  }

  setMode(mode: 'pvp' | 'ai') {
    this.mode = mode;
  }

setBoard(board: BoardState) {
  console.log('[ENGINE] setBoard called');
  this.board = JSON.parse(JSON.stringify(board));
  console.log('[ENGINE] setBoard new value', this.board);
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
  console.log('[ENGINE] finishMove, isRemote:', this.isRemoteMove);

  this.board = applyMove(originalBoard, startPit);
  this.isAnimating = false;

  console.log('[ENGINE] new board', this.board);

  // Only trigger onBoardChanged for LOCAL moves, not remote replays
  if (this.onBoardChanged && !this.isRemoteMove) {
    console.log('[ENGINE] calling onBoardChanged with pit', startPit);
    this.onBoardChanged(this.board, startPit);
  }

  // If this was a remote move, check if there are queued moves
  if (this.isRemoteMove) {
    this.isRemoteMove = false;
    this.processRemoteMoveQueue();
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
  console.log('[ENGINE] playMove', pitIndex);

  if (this.isAnimating) {
    console.log('BLOCKED: animating');
    return;
  }

  if (isGameOver(this.board)) {
    console.log('BLOCKED: game over');
    return;
  }

  if (!isValidMove(this.board, pitIndex)) {
    console.log('BLOCKED: invalid move');
    return;
  }

  const originalBoard = cloneBoard(this.board);
  const path = getDistributionPath(originalBoard, pitIndex);

  console.log('[ENGINE] path', path);

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
  console.log('[ENGINE] playRemoteMove pit:', startPit, 'isAnimating:', this.isAnimating);

  // If already animating, queue this move
  if (this.isAnimating) {
    console.log('[ENGINE] Animation in progress, queueing pit', startPit);
    this.remoteMoveQueue.push(startPit);
    return;
  }

  this.executeRemoteMove(startPit);
}

private processRemoteMoveQueue() {
  if (this.remoteMoveQueue.length === 0) {
    console.log('[ENGINE] Remote move queue empty');
    return;
  }

  const nextPit = this.remoteMoveQueue.shift()!;
  console.log('[ENGINE] Processing queued move:', nextPit, 'remaining:', this.remoteMoveQueue.length);

  // Small delay to ensure board state is stable
  setTimeout(() => {
    this.executeRemoteMove(nextPit);
  }, 50);
}

private executeRemoteMove(startPit: number) {
  console.log('[ENGINE] executeRemoteMove - setting flag for pit', startPit);
  this.isRemoteMove = true;

  const original = cloneBoard(this.board);
  const path = getDistributionPath(original, startPit);

  this.animateMove(original, startPit, path);
}

}


