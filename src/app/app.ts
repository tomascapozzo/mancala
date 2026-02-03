import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MancalaService } from './core/mancala-engine/mancala.service';
import { GameComponent } from "./features/game/game.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  standalone: true
})
export class App {
   constructor(private mancala: MancalaService) {
    // Expose for console testing
    (window as any).game = mancala;
  };
}
