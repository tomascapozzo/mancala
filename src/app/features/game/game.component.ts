import { Component, OnInit } from '@angular/core';
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
export class GameComponent implements OnInit {
  aiDepth: number = 4;
  gameId!: string;
  subscription: any;
  playerId = crypto.randomUUID();
  playerSide!: 0 | 1;
  waitingForOpponent = false;

  constructor(
    public game: MancalaService,
    private route: ActivatedRoute,
    private onlineGame: OnlineGameService,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(async (params) => {
      const mode = params['mode'] === 'ai' ? 'ai' : 'pvp';
      this.game.setMode(mode);

      if (params['gameId']) {
        this.gameId = params['gameId'];
        await this.joinGame(this.gameId);
      } else {
        await this.createAndHostGame();
      }
    });

    this.game.onBoardChanged = (board) => {
      if (this.gameId) {
        this.onlineGame.updateGame(this.gameId, board);
      }
    };
  }

  get board(): BoardState {
    return this.game.getBoard();
  }

async play(index: number) {
  if (!this.canPlayPit(index)) return;

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
    this.waitingForOpponent = true;

    const result = await this.onlineGame.createGame(
  this.game.getBoard(),
  this.playerId
);

    this.playerSide = 0;

    this.gameId = result.data.id;
    console.log(this.gameId);

    // SUBSCRIBE IMMEDIATELY
    this.subscribeToGame();
  }

  async joinGame(id: string) {
    this.waitingForOpponent = false;

    console.log('[JOIN] Joining game:', id);

    this.gameId = id;

    // Subscribe first
    this.subscribeToGame();

    // Register as guest
    await this.onlineGame.assignGuest(id, this.playerId);
    this.playerSide = 1;

    // Fetch game
    const result = await this.onlineGame.getGame(id);

    console.log('[JOIN] Server state:', result.data.board_state);

    this.game.setBoard(result.data.board_state);
  }

  subscribeToGame() {
    this.subscription = this.onlineGame.listenToGame(this.gameId, (serverGame: any) => {
      console.log('[REALTIME] Incoming update');

      // Waiting room logic
      if (!serverGame.guest_id) {
        this.waitingForOpponent = true;
        return;
      }

      this.waitingForOpponent = false;

      const incoming = serverGame.board_state;
      const local = this.game.getBoard();

      // Ignore own updates
      if (serverGame.last_player_id === this.playerId) {
        return;
      }

      const move = detectMove(local, incoming);

      if (move !== null) {
        console.log('[REMOTE MOVE]', move);
        this.game.playRemoteMove(move);
      } else {
        // Fallback (initial sync)
        this.game.setBoard(incoming);
      }
    });
  }

  canPlayPit(index: number): boolean {
    if (this.game.getBoard().currentPlayer !== this.playerSide) return false;

    if (this.playerSide === 0) return index >= 0 && index <= 5;

    return index >= 7 && index <= 12;
  }
}
