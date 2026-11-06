import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.scss',
})
export class AuthLayout {
  /** router = Angular Router */
  private router = inject(Router);

  /** isLogInPage = Signal, ob gerade die Login-Seite offen ist */
  isLogInPage = toSignal(
    /** höre auf alle Router-Ereignisse */
    this.router.events.pipe(
      /** behalte nur Ereignisse, wenn (Navigation ist fertig) */
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      /** wandle um in: true, wenn (URL beginnt mit /auth/login), sonst false */
      map(() => this.router.url.startsWith('/auth/login'))
    ),
    /** Startwert: true, wenn (aktuelle URL beginnt mit /auth/login), sonst false */
    { initialValue: this.router.url.startsWith('/auth/login') }
  );
}
