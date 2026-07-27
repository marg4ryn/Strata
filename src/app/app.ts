import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Header } from './layout/header/header.component';
import { Footer } from './layout/footer/footer.component';
import { NotificationsPanel } from './features/notifications/feature/notifications-panel.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, NotificationsPanel],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
