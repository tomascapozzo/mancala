import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl:  'home.component.html',
  styleUrls: ["home.component.css"]})
export class HomeComponent {
  showRules = false;
  showHowTo = false;

  constructor(private router: Router) {}

startPvp() {
  this.router.navigate(['/game'], {
    queryParams: { mode: 'pvp' }
  });
}

startAi() {
  this.router.navigate(['/game'], {
    queryParams: { mode: 'ai' }
  });
}

startOnline() {
  this.router.navigate(['/lobby']);
}




  toggleRules() {
    this.showRules = !this.showRules;
    if (this.showRules) this.showHowTo = false;
  }

  toggleHowTo() {
    this.showHowTo = !this.showHowTo;
    if (this.showHowTo) this.showRules = false;
  }
}
