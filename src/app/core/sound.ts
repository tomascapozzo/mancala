import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SoundService {

  private drop = new Audio('/sounds/moveChess.mp3');
  private capture = new Audio('/sounds/captureChess.mp3');
  private gameover = new Audio('/sounds/gameover.wav');

  playDrop() {
    this.drop.currentTime = 0;
    this.drop.play();
  }

  playCapture() {
    this.capture.currentTime = 0;
    this.capture.play();
  }

  playGameOver() {
    this.gameover.currentTime = 0;
    this.gameover.play();
  }
}

