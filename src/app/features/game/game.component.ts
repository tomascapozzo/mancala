import { Component, OnInit } from '@angular/core';
import { MancalaService } from '../../core/mancala-engine/mancala.service';
import { BoardState } from '../../core/mancala-engine/board.model';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css'],
  imports: [CommonModule, RouterModule, FormsModule],
  standalone: true
})
export class GameComponent implements OnInit {
aiDepth: number = 4;

  constructor(
  public game: MancalaService,
  private route: ActivatedRoute
) {}

ngOnInit() {
  this.route.queryParams.subscribe(params => {
    const mode = params['mode'] === 'ai' ? 'ai' : 'pvp';
    this.game.setMode(mode);
    this.game.reset();
  });
}

  get board(): BoardState {
    return this.game.getBoard();
  }

  play(index: number) {
    this.game.playMove(index);
  }

  reset() {
    this.game.reset();
  }

  isGameOver(): boolean {
    return this.game.isGameOver();
  }

  get history(){
    return this.game.getHistory();
  }

  getTurnPairs() {
  const pairs: { a?: number; b?: number }[] = [];

  for (let i = 0; i < this.history.length; i += 2) {
    pairs.push({
      a: this.history[i]?.pit,
      b: this.history[i + 1]?.pit
    });
  }

  return pairs;
}

}
