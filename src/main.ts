import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

/** starte die App mit Komponente App und Einstellungen appConfig, bei Fehler zeige ihn in der Konsole */
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
