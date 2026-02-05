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
    private game: MancalaService
  ) {}

  async createGame() {
    const hostId = crypto.randomUUID();

const result = await this.online.createGame(
  this.game.getBoard(),
  hostId
);


    const id = result.data.id;

this.router.navigate(['/game'], {
  queryParams: {
    gameId: id,
    playerId: hostId
  }
});
}

  joinGame() {
    if (!this.joinCode) return;

    this.router.navigate(['/game'], {
      queryParams: { gameId: this.joinCode }
    });
  }

}
