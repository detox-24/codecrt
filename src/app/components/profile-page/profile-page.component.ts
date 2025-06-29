import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { MatrixRainComponent } from '../matrix-rain/matrix-rain.component';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule, MatrixRainComponent],
  template: `
    <div class="flex flex-col items-center justify-center min-h-screen p-4">
      <app-matrix-rain class="matrix-container"></app-matrix-rain>
      <div class="w-full max-w-md relative z-10">
        <div class="crt-screen">
          <h2 class="text-2xl font-crt text-matrix-green mb-4">Profile</h2>
          <form [formGroup]="profileForm" (ngSubmit)="updateProfile()" class="space-y-4">
            <div>
              <label for="firstName" class="block mb-1 text-matrix-green font-mono">First Name</label>
              <input 
                id="firstName" 
                type="text" 
                formControlName="firstName"
                placeholder="Enter first name"
                class="w-full">
              <div class="text-red-500 text-sm mt-1 font-mono" *ngIf="profileForm.get('firstName')?.touched && profileForm.get('firstName')?.errors?.['required']">
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
              <div class="text-red-500 text-sm mt-1 font-mono" *ngIf="profileForm.get('lastName')?.touched && profileForm.get('lastName')?.errors?.['required']">
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
              <div class="text-red-500 text-sm mt-1 font-mono" *ngIf="profileForm.get('email')?.touched && profileForm.get('email')?.errors?.['required']">
                Email is required
              </div>
              <div class="text-red-500 text-sm mt-1 font-mono" *ngIf="profileForm.get('email')?.touched && profileForm.get('email')?.errors?.['email']">
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
              <div class="text-red-500 text-sm mt-1 font-mono" *ngIf="profileForm.get('birthDate')?.touched && profileForm.get('birthDate')?.errors?.['required']">
                Birth date is required
              </div>
            </div>

            <div class="text-red-500 text-sm font-mono" *ngIf="submitError">
              {{ submitError }}
            </div>

            <button 
              type="submit" 
              [disabled]="!profileForm.valid || isSubmitting"
              class="w-full">
              {{ isSubmitting ? 'Updating...' : 'Update Profile' }}
            </button>
          </form>
          <button 
            (click)="deleteProfile()" 
            class="w-full mt-4 bg-red-900 hover:bg-red-700 text-matrix-green border border-red-500"
            [disabled]="isSubmitting">
            Delete Profile
          </button>
        </div>
      </div>
    </div>
  `
})
export class ProfilePageComponent implements OnInit {
  profileForm: FormGroup;
  isSubmitting = false;
  submitError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      birthDate: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.http.get('http://localhost:3000/api/user', { withCredentials: true })
      .subscribe({
        next: (response: any) => {
          this.profileForm.patchValue({
            firstName: response.firstName,
            lastName: response.lastName,
            email: response.email,
            birthDate: new Date(response.birthDate).toISOString().split('T')[0]
          });
        },
        error: (error) => {
          this.submitError = error.error.message || 'Failed to load profile';
        }
      });
  }

  updateProfile(): void {
    if (this.profileForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.submitError = null;
      this.http.put('http://localhost:3000/api/user', this.profileForm.value, { withCredentials: true })
        .subscribe({
          next: () => {
            alert('Profile updated successfully!');
            this.isSubmitting = false;
          },
          error: (error) => {
            this.submitError = error.error.message || 'Failed to update profile';
            this.isSubmitting = false;
          }
        });
    }
  }

  deleteProfile(): void {
    if (confirm('Are you sure you want to delete your profile? This action cannot be undone.')) {
      this.isSubmitting = true;
      this.submitError = null;
      this.http.delete('http://localhost:3000/api/user', { withCredentials: true })
        .subscribe({
          next: () => {
            this.router.navigate(['/signin']);
          },
          error: (error) => {
            this.submitError = error.error.message || 'Failed to delete profile';
            this.isSubmitting = false;
          }
        });
    }
  }
}