import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Session } from '../models/session.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private apiUrl = `${environment.apiUrl}/api/session`;
  
  constructor(private http: HttpClient) {}
  
  createSession(session: Partial<Session>): Observable<Session> {
    return this.http.post<Session>(this.apiUrl, session);
  }
  
  getSession(sessionId: string): Observable<Session> {
    return this.http.get<Session>(`${this.apiUrl}/${sessionId}`);
  }
  
  joinSession(sessionId: string, user: { name: string }): Observable<Session> {
    return this.http.post<Session>(`${this.apiUrl}/${sessionId}/join`, user);
  }
  
  leaveSession(sessionId: string, userId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${sessionId}/leave`, { userId });
  }
}