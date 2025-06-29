import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ExecutionResult } from '../models/session.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CodeExecutionService {
  private apiUrl = `${environment.apiUrl}/api/execute`;
  
  constructor(private http: HttpClient) {}
  
  executeCode(data: {
    sourceCode: string;
    languageId: number;
    stdin?: string;
  }): Observable<ExecutionResult> {
    return this.http.post<ExecutionResult>(this.apiUrl, data, { withCredentials: true });
  }
}