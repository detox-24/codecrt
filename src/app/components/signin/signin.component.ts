import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { MatrixRainComponent } from '../matrix-rain/matrix-rain.component';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule, MatrixRainComponent],
  template: `
    <div class="flex flex-col items-center justify-center min-h-screen p-4">
      <app-matrix-rain class="matrix-container"></app-matrix-rain>
      <div class="w-full max-w-md relative z-10">
        <div class="crt-screen">
          <h2 class="text-2xl font-crt text-matrix-green mb-4">Sign In</h2>
          <form [formGroup]="signinForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <div>
              <label for="email" class="block mb-1 text-matrix-green font-mono">Email</label>
              <input 
                id="email" 
                type="email" 
                formControlName="email"
                placeholder="Enter email"
                class="w-full">
              <div class="text-red-500 text-sm mt-1 font-mono" *ngIf="signinForm.get('email')?.touched && signinForm.get('email')?.errors?.['required']">
                Email is required
              </div>
              <div class="text-red-500 text-sm mt-1 font-mono" *ngIf="signinForm.get('email')?.touched && signinForm.get('email')?.errors?.['email']">
                Please enter a valid email
              </div>
            </div>

            <div>
              <label for="password" class="block mb-1 text-matrix-green font-mono">Password</label>
              <input 
                id="password" 
                type="password" 
                formControlName="password"
                placeholder="Enter password"
                class="w-full">
              <div class="text-red-500 text-sm mt-1 font-mono" *ngIf="signinForm.get('password')?.touched && signinForm.get('password')?.errors?.['required']">
                Password is required
              </div>
            </div>

            <div class="text-red-500 text-sm font-mono" *ngIf="submitError">
              {{ submitError }}
            </div>

            <button 
              type="submit" 
              [disabled]="!signinForm.valid || isSubmitting"
              class="w-full">
              {{ isSubmitting ? 'Signing In...' : 'Sign In' }}
            </button>
          </form>
          <p class="text-matrix-green text-center mt-4 font-mono">
            Don't have an account? <a routerLink="/signup" class="underline hover:text-matrix-darkgreen">Sign Up</a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class SignInComponent {
  signinForm: FormGroup;
  isSubmitting = false;
  submitError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.signinForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.signinForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.submitError = null;

      this.http.post('http://localhost:3000/api/signin', this.signinForm.value, { withCredentials: true })
        .subscribe({
          next: () => {
            this.router.navigate(['/']);
          },
          error: (error) => {
            this.submitError = error.error.message || 'Invalid email or password';
            this.isSubmitting = false;
          },
          complete: () => {
            this.isSubmitting = false;
          }
        });
    }
  }
}