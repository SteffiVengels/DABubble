import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';

import { routes } from './app.routes';

/** appConfig = Grundeinstellungen der App (welche Angular-Funktionen aktiv sind) */
export const appConfig: ApplicationConfig = {
  providers: [
    /** fange Fehler im Browser global ab und zeige sie in der Konsole */
    provideBrowserGlobalErrorListeners(),
    /** Änderungserkennung ohne Zone.js (Angular reagiert auf Signals) */
    provideZonelessChangeDetection(),
    /** Router mit unseren routes, Seitenwechsel mit View-Transition-Animation */
    provideRouter(routes, withViewTransitions())
  ]
};
