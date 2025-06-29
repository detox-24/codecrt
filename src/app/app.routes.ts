import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { EditorComponent } from './components/editor/editor.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'editor/:sessionId', component: EditorComponent },
  { path: '**', redirectTo: '' },
  
];