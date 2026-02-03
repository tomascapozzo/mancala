import { Injectable } from '@angular/core';
import { BoardState, Player } from './board.model';
import {
  createInitialBoard,
  applyMove,
  isGameOver,
  getWinner,
  getBestMove,
  pitName,
  isValidMove,
} from './mancala.logic';
import { getRandomMove } from './ai';


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
  animating = false;
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
    if (isGameOver(this.board)) return;

    const playerBefore = this.board.currentPlayer;

    const result = applyMove(this.board, pitIndex);

    const extraTurn = result.currentPlayer === playerBefore;

    // Log move
    this.moveHistory.push({
      player: playerBefore,
      pit: pitIndex,
      extraTurn: extraTurn,
    });

    this.board = result;

    // If AI turn, make AI move
    if (this.mode === 'ai' && this.board.currentPlayer === this.AIPlayer) {
      this.playAiTurn();
    }
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
