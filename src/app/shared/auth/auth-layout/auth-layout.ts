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
  private router = inject(Router);

  isLogInPage = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.url.startsWith('/auth/login'))
    ),
    { initialValue: this.router.url.startsWith('/auth/login') }
  );
}
