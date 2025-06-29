import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { environment } from '../../environments/environment';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class CollaborationService {
  private doc: Y.Doc | null = null;
  private provider: WebsocketProvider | null = null;
  private binding: MonacoBinding | null = null;
  private _activeUsers = new BehaviorSubject<any[]>([]);
  activeUsers$ = this._activeUsers.asObservable();
  private userId: string = uuidv4();
  private username: string = '';
  private userColor: string = '';

  initCollaboration(sessionId: string, editor: any, username: string): void {
    // Initialize Yjs document
    this.doc = new Y.Doc();
    
    // Create websocket provider
    // The WebsocketProvider will construct a URL like:
    // ws://localhost:3000/yjs/[sessionId]
    this.provider = new WebsocketProvider(
      'ws://localhost:3000', 
      'yjs/' + sessionId,  // This creates the path /yjs/[sessionId]
      this.doc
    );

    // Set username and color
    this.username = username;
    this.userColor = this.getRandomColor();
    
    // Set user awareness
    this.provider.awareness.setLocalStateField('user', {
      id: this.userId,
      name: this.username,
      color: this.userColor
    });

    // Setup awareness for user presence
    this.provider.awareness.on('change', () => {
      const users: any[] = [];
      this.provider?.awareness.getStates().forEach((state: any, clientId: number) => {
        if (state.user) {
          users.push({
            clientId,
            ...state.user
          });
        }
      });
      this._activeUsers.next(users);
    });

    // Setup text binding
    const yText = this.doc.getText('monaco');
    this.binding = new MonacoBinding(
      yText,
      editor.getModel(),
      new Set([editor]),
      this.provider.awareness
    );
  }

  disconnect(): void {
    this.binding?.destroy();
    this.provider?.disconnect();
    this.doc?.destroy();
    this.binding = null;
    this.provider = null;
    this.doc = null;
  }

  private getRandomColor(): string {
    const colors = [
      '#FF5733', '#33FF57', '#3357FF', '#FF33F5',
      '#F5FF33', '#33FFF5', '#FF3333', '#33FF33'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}