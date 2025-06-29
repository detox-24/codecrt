import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="crt-screen p-3 h-full">
      <h3 class="text-xl mb-3 border-b border-matrix-darkgreen pb-2 text-matrix-green font-crt">Users Online</h3>
      
      <div class="space-y-2">
        <div *ngFor="let user of users" class="user-presence flex items-center">
          <div [style.background-color]="user.color" class="user-avatar w-3 h-3 rounded-full mr-2"></div>
          <span class="text-matrix-green font-mono">{{ user.name }}</span>
        </div>
        
        <div *ngIf="users.length === 0" class="text-matrix-green opacity-60 font-mono">
          No users connected
        </div>
      </div>
    </div>
  `,
  styles: `
    .user-presence {
      line-height: 1.5;
    }
  `
})
export class UserListComponent {
  @Input() users: any[] = [];
}