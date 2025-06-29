import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { MatrixRainComponent } from '../matrix-rain/matrix-rain.component';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule, MatrixRainComponent],
  template: `
    <div class="flex flex-col items-center justify-center min-h-screen p-4">
      <app-matrix-rain class="matrix-container"></app-matrix-rain>
      <div class="w-full max-w-md relative z-10">
        <div class="crt-screen">
          <h2 class="text-2xl font-crt text-matrix-green mb-4">Sign Up</h2>
          <form [formGroup]="signupForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <div>
              <label for="firstName" class="block mb-1 text-matrix-green font-mono">First Name</label>
              <input 
                id="firstName" 
                type="text" 
                formControlName="firstName"
                placeholder="Enter first name"
                class="w-full">
              <div class="text-red-500 text-sm mt-1 font-mono" *ngIf="signupForm.get('firstName')?.touched && signupForm.get('firstName')?.errors?.['required']">
                First name is required
              </div>
            </div>

            <div>
              <label for="lastName" class="block mb-1 text-matrix-green font-mono">Last Name</label>
              <input 
                id="lastName" 
                type="text" 
                formControlName="lastName"
                placeholder="Enter last name"
                class="w-full">
              <div class="text-red-500 text-sm mt-1 font-mono" *ngIf="signupForm.get('lastName')?.touched && signupForm.get('lastName')?.errors?.['required']">
                Last name is required
              </div>
            </div>

            <div>
              <label for="email" class="block mb-1 text-matrix-green font-mono">Email</label>
              <input 
                id="email" 
                type="email" 
                formControlName="email"
                placeholder="Enter email"
                class="w-full">
              <div class="text-red-500 text-sm mt-1 font-mono" *ngIf="signupForm.get('email')?.touched && signupForm.get('email')?.errors?.['required']">
                Email is required
              </div>
              <div class="text-red-500 text-sm mt-1 font-mono" *ngIf="signupForm.get('email')?.touched && signupForm.get('email')?.errors?.['email']">
                Please enter a valid email
              </div>
            </div>

            <div>
              <label for="birthDate" class="block mb-1 text-matrix-green font-mono">Birth Date</label>
              <input 
                id="birthDate" 
                type="date" 
                formControlName="birthDate"
                class="w-full">
              <div class="text-red-500 text-sm mt-1 font-mono" *ngIf="signupForm.get('birthDate')?.touched && signupForm.get('birthDate')?.errors?.['required']">
                Birth date is required
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
              <div class="text-red-500 text-sm mt-1 font-mono" *ngIf="signupForm.get('password')?.touched && signupForm.get('password')?.errors?.['required']">
                Password is required
              </div>
              <div class="text-red-500 text-sm mt-1 font-mono" *ngIf="signupForm.get('password')?.touched && signupForm.get('password')?.errors?.['minlength']">
                Password must be at least 6 characters
              </div>
            </div>

            <div>
              <label for="confirmPassword" class="block mb-1 text-matrix-green font-mono">Confirm Password</label>
              <input 
                id="confirmPassword" 
                type="password" 
                formControlName="confirmPassword"
                placeholder="Confirm password"
                class="w-full">
              <div class="text-red-500 text-sm mt-1 font-mono" *ngIf="signupForm.get('confirmPassword')?.touched && signupForm.get('confirmPassword')?.errors?.['required']">
                Please confirm your password
              </div>
              <div class="text-red-500 text-sm mt-1 font-mono" *ngIf="signupForm.get('confirmPassword')?.touched && signupForm.errors?.['passwordMismatch']">
                Passwords do not match
              </div>
            </div>

            <div class="text-red-500 text-sm font-mono" *ngIf="submitError">
              {{ submitError }}
            </div>

            <button 
              type="submit" 
              [disabled]="!signupForm.valid || isSubmitting"
              class="w-full">
              {{ isSubmitting ? 'Signing Up...' : 'Sign Up' }}
            </button>
          </form>
          <p class="text-matrix-green text-center mt-4 font-mono">
            Already have an account? <a routerLink="/signin" class="underline hover:text-matrix-darkgreen">Sign In</a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class SignupComponent {
  signupForm: FormGroup;
  isSubmitting = false;
  submitError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      birthDate: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { 'passwordMismatch': true };
  }

  onSubmit() {
    if (this.signupForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.submitError = null;

      const formData = {
        ...this.signupForm.value,
        confirmPassword: undefined
      };

      this.http.post('http://localhost:3000/api/signup', formData, { withCredentials: true })
        .subscribe({
          next: () => {
            alert('Registration successful! Please sign in.');
            this.signupForm.reset();
            this.router.navigate(['/signin']);
          },
          error: (error) => {
            this.submitError = error.error.message || 'An error occurred during registration';
            this.isSubmitting = false;
          },
          complete: () => {
            this.isSubmitting = false;
          }
        });
    }
  }
}