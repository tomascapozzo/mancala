import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { OnlineGameService } from '../../services/online-game.service';
import { MancalaService } from '../../core/mancala-engine/mancala.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-lobby',
  imports: [CommonModule, FormsModule],
  templateUrl: './lobby.html',
  styleUrl: './lobby.css',
})
export class LobbyPageComponent {
  joinCode = '';

  constructor(
    private router: Router,
    private online: OnlineGameService,
    private game: MancalaService,
  ) {}

  goHome() {
    this.router.navigate(['/home']);
  }

  async createGame() {
  const hostId = crypto.randomUUID();

  this.router.navigate(['/game'], {
    queryParams: {
      mode: 'online',
      playerId: hostId
    }
  });
}


joinGame() {
  if (!this.joinCode) return;

  const guestId = crypto.randomUUID();

  this.router.navigate(['/game'], {
    queryParams: {
      mode: 'online',
      gameId: this.joinCode,
      playerId: guestId
    }
  });
}


}
