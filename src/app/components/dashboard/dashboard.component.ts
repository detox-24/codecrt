import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionService } from '../../services/session.service';
import { SUPPORTED_LANGUAGES } from '../../models/session.model';
import { MatrixRainComponent } from '../matrix-rain/matrix-rain.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatrixRainComponent],
  template: `
    <div class="flex flex-col items-center justify-center min-h-screen p-4">
      <app-matrix-rain class="matrix-container"></app-matrix-rain>
      <div class="w-full max-w-md relative z-10">
        <div class="crt-screen text-center mb-8">
          <h1 class="text-5xl font-crt tracking-wide text-matrix-green mb-2">
            <span class="animate-flicker">></span> CodeCRT
          </h1>
        </div>
        
        <div class="crt-screen mb-6">
          <h2 class="text-2xl font-crt text-matrix-green mb-4">Create Session</h2>
          <form [formGroup]="createForm" (ngSubmit)="createSession()" class="space-y-4">
            <div>
              <label for="title" class="block mb-1 text-matrix-green font-mono">Session Title</label>
              <input 
                id="title" 
                formControlName="title" 
                placeholder="My Coding Session" 
                class="w-full bg-black border border-matrix-green text-matrix-green px-2 py-1 rounded-sm"
              >
              <div *ngIf="createForm.get('title')?.invalid && createForm.get('title')?.touched" class="text-red-500 text-sm mt-1 font-mono">
                Session title is required
              </div>
            </div>
            
            <div>
              <label for="language" class="block mb-1 text-matrix-green font-mono">Language</label>
              <select 
                id="language" 
                formControlName="language" 
                class="w-full bg-black border border-matrix-green text-matrix-green px-2 py-1 rounded-sm"
              >
                <option *ngFor="let lang of languages" [value]="lang.value">{{ lang.name }}</option>
              </select>
            </div>
            
            <div *ngIf="error" class="text-red-500 text-sm font-mono">{{ error }}</div>
            
            <button 
              type="submit" 
              [disabled]="createForm.invalid || isCreating" 
              class="w-full bg-matrix-green text-black font-mono py-2 rounded-sm hover:bg-matrix-darkgreen disabled:opacity-50"
            >
              {{ isCreating ? 'Creating...' : 'Create Session' }}
            </button>
          </form>
        </div>
        
        <div class="crt-screen">
          <h2 class="text-2xl font-crt text-matrix-green mb-4">Join Session</h2>
          <form [formGroup]="joinForm" (ngSubmit)="joinSession()" class="space-y-4">
            <div>
              <label for="sessionId" class="block mb-1 text-matrix-green font-mono">Session ID</label>
              <input 
                id="sessionId" 
                formControlName="sessionId" 
                placeholder="Enter session ID" 
                class="w-full bg-black border border-matrix-green text-matrix-green px-2 py-1 rounded-sm"
              >
              <div *ngIf="joinForm.get('sessionId')?.invalid && joinForm.get('sessionId')?.touched" class="text-red-500 text-sm mt-1 font-mono">
                Session ID is required
              </div>
            </div>
            
            <div *ngIf="error" class="text-red-500 text-sm font-mono">{{ error }}</div>
            
            <button 
              type="submit" 
              [disabled]="joinForm.invalid || isJoining" 
              class="w-full bg-matrix-green text-black font-mono py-2 rounded-sm hover:bg-matrix-darkgreen disabled:opacity-50"
            >
              {{ isJoining ? 'Joining...' : 'Join Session' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  createForm!: FormGroup;
  joinForm!: FormGroup;
  languages = SUPPORTED_LANGUAGES;
  isCreating: boolean = false;
  isJoining: boolean = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private sessionService: SessionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('DashboardComponent: Initializing');
    this.createForm = this.fb.group({
      title: ['', [Validators.required]],
      language: [this.languages[0].value, [Validators.required]]
    });

    this.joinForm = this.fb.group({
      sessionId: ['', [Validators.required]]
    });
  }

  createSession(): void {
    if (this.createForm.valid) {
      this.isCreating = true;
      this.error = null;
      const { title, language } = this.createForm.value;

      console.log('DashboardComponent: Creating session', { title, language });
      this.sessionService.createSession({ title, language }).subscribe({
        next: (createdSession) => {
          console.log('DashboardComponent: Session created', createdSession);
          this.router.navigate(['/editor', createdSession._id]);
          this.isCreating = false;
        },
        error: (err: any) => {
          console.error('DashboardComponent: Error creating session', {
            status: err.status,
            message: err.message,
            response: err.error
          });
          this.error = err.error?.message || 'Failed to create session';
          this.isCreating = false;
        }
      });
    }
  }

  joinSession(): void {
    if (this.joinForm.valid) {
      this.isJoining = true;
      this.error = null;
      const { sessionId } = this.joinForm.value;

      console.log('DashboardComponent: Joining session', sessionId);
      this.sessionService.getSession(sessionId).subscribe({
        next: (session) => {
          console.log('DashboardComponent: Session found', session);
          this.router.navigate(['/editor', sessionId]);
          this.isJoining = false;
        },
        error: (err: any) => {
          console.error('DashboardComponent: Error joining session', {
            status: err.status,
            message: err.message,
            response: err.error
          });
          this.error = err.error?.message || 'Invalid session ID';
          this.isJoining = false;
        }
      });
    }
  }
}