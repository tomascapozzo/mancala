import { Component, OnInit, OnDestroy } from '@angular/core';
import { MancalaService } from '../../core/mancala-engine/mancala.service';
import { BoardState } from '../../core/mancala-engine/board.model';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OnlineGameService } from '../../services/online-game.service';
import { detectMove } from '../../core/mancala-engine/mancala.logic';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css'],
  imports: [CommonModule, RouterModule, FormsModule],
  standalone: true,
})
export class GameComponent implements OnInit, OnDestroy {
  aiDepth: number = 4;
  gameId!: string;
  subscription: any;
  playerId!: string;
  playerSide!: 0 | 1;
  waitingForOpponent = false;
  copyFeedback: string = '';

  constructor(
    public game: MancalaService,
    private route: ActivatedRoute,
    private onlineGame: OnlineGameService,
  ) {}

  ngOnInit() {
  this.game.reset();

  this.route.queryParams.subscribe(async (params) => {
    const mode = params['mode'];
    this.playerId = params['playerId'];

    // AI
    if (mode === 'ai') {
      this.game.setMode('ai');
      this.playerSide = 0;
      return;
    }

    // ONLINE
    if (mode === 'online') {
      if (params['gameId']) {
        // 👉 GUEST
        await this.joinGame(params['gameId']);
      } else {
        // 👉 HOST
        await this.createAndHostGame();
      }
      return;
    }

    // LOCAL PVP
    this.playerSide = 0;
    this.waitingForOpponent = false;
  });

  this.game.onBoardChanged = (board, movePit) => {
    if (this.gameId) {
      console.log('[GAME] Local move complete, syncing to DB:', movePit);
      this.onlineGame.updateGame(
        this.gameId,
        board,
        this.playerId,
        movePit
      );
    }
  };
}


  get board(): BoardState {
    return this.game.getBoard();
  }

  async play(index: number) {
  console.log('[CLICK]', index);

  if (!this.canPlayPit(index)) {
    console.log('[BLOCKED]');
    return;
  }

  console.log('[PLAY ACCEPTED]');
  this.game.playMove(index);
}


  reset() {
    this.game.reset();
  }

  isGameOver(): boolean {
    return this.game.isGameOver();
  }

  get history() {
    return this.game.getHistory();
  }

  getTurnPairs() {
    const pairs: { a?: number; b?: number }[] = [];

    for (let i = 0; i < this.history.length; i += 2) {
      pairs.push({
        a: this.history[i]?.pit,
        b: this.history[i + 1]?.pit,
      });
    }

    return pairs;
  }

  async createAndHostGame() {
  console.log('[HOST]', this.playerId);

  this.playerSide = 0;
  this.waitingForOpponent = true;

  const result = await this.onlineGame.createGame(
    this.game.getBoard(),
    this.playerId
  );

  this.gameId = result.data.id;

  this.subscribeToGame();
}


 async joinGame(id: string) {
  console.log('[GUEST]', this.playerId);

  this.playerSide = 1;
  this.waitingForOpponent = false;
  this.gameId = id;

  this.subscribeToGame();

  await this.onlineGame.assignGuest(id, this.playerId);

  const result = await this.onlineGame.getGame(id);
  this.game.setBoard(result.data.board_state);
}


 subscribeToGame() {
  console.log(`[SUBSCRIBE] Player ${this.playerSide} subscribing to game ${this.gameId}`);

  this.subscription = this.onlineGame.listenToGame(
    this.gameId,
    (serverGame: any) => {

      console.log('[REALTIME EVENT] Received:', serverGame);
      console.log('[REALTIME] last_move_player:', serverGame.last_move_player, 'my playerId:', this.playerId);

      // Update waiting status
      if (!serverGame.guest_id) {
        this.waitingForOpponent = true;
      } else {
        this.waitingForOpponent = false;
      }

      // Ignore if no actual move was made (e.g., guest joining, status updates)
      if (!serverGame.last_move_player) {
        console.log('[REALTIME] Ignoring - no move data (probably guest join or status update)');
        return;
      }

      // Ignore updates from our own moves
      if (serverGame.last_move_player === this.playerId) {
        console.log('[REALTIME] Ignoring - this was our own move');
        return;
      }

      // Opponent made a move - animate it!
      if (serverGame.last_move_pit !== null && serverGame.last_move_pit !== undefined) {
        console.log('[REALTIME] ✓ Opponent played pit', serverGame.last_move_pit, '- replaying with animation');
        this.game.playRemoteMove(serverGame.last_move_pit);
      } else {
        console.log('[REALTIME] ✓ Applying board state (no animation)');
        this.game.setBoard(serverGame.board_state);
      }
    }
  );
}


 canPlayPit(index: number): boolean {
  console.log(
    '[CAN PLAY CHECK]',
    'side:', this.playerSide,
    'current:', this.game.getBoard().currentPlayer,
    'pit:', index
  );

  if (this.gameId) {
    if (this.game.getBoard().currentPlayer !== this.playerSide)
      return false;

    if (this.playerSide === 0)
      return index >= 0 && index <= 5;

    return index >= 7 && index <= 12;
  }

  return this.game.isValidMove(index);
}

  copyGameId() {
    if (!this.gameId) return;

    navigator.clipboard.writeText(this.gameId).then(
      () => {
        this.copyFeedback = '✓ Copied!';
        setTimeout(() => {
          this.copyFeedback = '';
        }, 2000);
      },
      (err) => {
        console.error('Failed to copy:', err);
        this.copyFeedback = 'Failed to copy';
        setTimeout(() => {
          this.copyFeedback = '';
        }, 2000);
      }
    );
  }

  ngOnDestroy() {
    if (this.subscription) {
      console.log('[CLEANUP] Unsubscribing from realtime channel');
      this.subscription.unsubscribe();
    }
  }

}
