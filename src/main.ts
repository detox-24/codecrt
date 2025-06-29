import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, Routes, RouterModule } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { DashboardComponent } from './app/components/dashboard/dashboard.component';
import { SignInComponent } from './app/components/signin/signin.component';
import { SignupComponent } from './app/components/signup/signup.component';
import { EditorComponent } from './app/components/editor/editor.component';
import { MatrixRainComponent } from './app/components/matrix-rain/matrix-rain.component';
import { ProfilePageComponent } from './app/components/profile-page/profile-page.component';
import { provideMonacoEditor } from 'ngx-monaco-editor-v2';

// Auth guard using JWT verification
const authGuard = () => {
  const http = inject(HttpClient);
  console.log('authGuard: Checking JWT verification');
  return new Promise<boolean>((resolve) => {
    http.get('http://localhost:3000/api/auth/verify', { withCredentials: true })
      .subscribe({
        next: () => {
          console.log('authGuard: JWT verified');
          resolve(true);
        },
        error: (err) => {
          console.error('authGuard: JWT verification failed', err);
          window.location.href = '/signin';
          resolve(false);
        }
      });
  });
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, CommonModule, MatrixRainComponent],
  template: `
    <div class="min-h-screen bg-black relative">
      <app-matrix-rain class="matrix-container"></app-matrix-rain>
      <nav class="p-4 relative z-10">
        <div class="max-w-7xl mx-auto flex justify-between items-center">
          <a routerLink="/" class="text-2xl font-crt text-matrix-green">CodeCRT</a>
          <div class="space-x-4">
            <a *ngIf="isAuthenticated" routerLink="/" routerLinkActive="active" class="text-matrix-green font-mono hover:text-matrix-darkgreen">Dashboard</a>
            <a *ngIf="isAuthenticated" routerLink="/profile" routerLinkActive="active" class="text-matrix-green font-mono hover:text-matrix-darkgreen">Profile</a>
            <a *ngIf="!isAuthenticated" routerLink="/signup" routerLinkActive="active" class="text-matrix-green font-mono hover:text-matrix-darkgreen">Sign Up</a>
            <a *ngIf="!isAuthenticated" routerLink="/signin" routerLinkActive="active" class="text-matrix-green font-mono hover:text-matrix-darkgreen">Sign In</a>
            <a *ngIf="isAuthenticated" (click)="logout()" class="text-matrix-green font-mono hover:text-matrix-darkgreen cursor-pointer">Logout</a>
          </div>
        </div>
      </nav>
      <div class="relative z-10">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: `
    nav a.active {
      @apply underline text-matrix-darkgreen;
    }
    .matrix-container {
      opacity: 0.7 !important;
    }
  `
})
export class AppComponent {
  isAuthenticated = false;

  constructor(private http: HttpClient) {
    this.checkAuth();
  }

  checkAuth() {
    this.http.get('http://localhost:3000/api/auth/verify', { withCredentials: true })
      .subscribe({
        next: () => this.isAuthenticated = true,
        error: () => this.isAuthenticated = false
      });
  }

  logout() {
    this.http.post('http://localhost:3000/api/auth/logout', {}, { withCredentials: true })
      .subscribe({
        next: () => {
          this.isAuthenticated = false;
          window.location.href = '/signin';
        }
      });
  }
}

const routes: Routes = [
  { path: '', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'signup', component: SignupComponent },
  { path: 'signin', component: SignInComponent },
  { path: 'editor/:sessionId', component: EditorComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfilePageComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '/signin', pathMatch: 'full' }
];

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideMonacoEditor({
      baseUrl: '/assets/vs',
      defaultOptions: {
        theme: 'vs-dark',
        automaticLayout: true,
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: 14
      }
    })
  ]
}).catch(err => console.error(err));