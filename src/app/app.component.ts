import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatrixRainComponent } from './components/matrix-rain/matrix-rain.component';
import { NGX_MONACO_EDITOR_CONFIG, NgxMonacoEditorConfig } from 'ngx-monaco-editor-v2';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatrixRainComponent],
  providers: [
    {
      provide: NGX_MONACO_EDITOR_CONFIG,
      useValue: {
        baseUrl: 'assets/vs', // Match the output path from angular.json
        defaultOptions: { scrollBeyondLastLine: false },
        onMonacoLoad: () => { console.log('Monaco loaded successfully'); }
      } as NgxMonacoEditorConfig
    }
  ],
  template: `
    <app-matrix-rain></app-matrix-rain>
    <div class="relative z-10 min-h-screen w-full">
      <router-outlet></router-outlet>
    </div>
  `,
})
export class AppComponent {
  name = 'CodeCRT';
}