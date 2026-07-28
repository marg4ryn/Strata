import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Header } from './layout/header/header.component';
import { Footer } from './layout/footer/footer.component';
import { NotificationPanel } from './features/notifications/feature/notification-panel.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, NotificationPanel],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
