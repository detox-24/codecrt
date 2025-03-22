import { Component, OnInit } from '@angular/core';
import * as monaco from 'monaco-editor';
import * as io from 'socket.io-client';

// Fix Monaco worker issue manually
(self as any).MonacoEnvironment = {
  getWorkerUrl: function (moduleId: string, label: string) {
    if (label === 'json') return 'node_modules/monaco-editor/esm/vs/language/json/json.worker.js';
    if (label === 'css') return 'node_modules/monaco-editor/esm/vs/language/css/css.worker.js';
    if (label === 'html') return 'node_modules/monaco-editor/esm/vs/language/html/html.worker.js';
    if (label === 'typescript' || label === 'javascript') return 'node_modules/monaco-editor/esm/vs/language/typescript/ts.worker.js';
    return 'node_modules/monaco-editor/esm/vs/editor/editor.worker.js';
  },
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  socket: any;
  editor: any;
  sessionId = 'session123';
  lastCode = '// CodeCRT - Start coding here\n';
  timeout: any;

  ngOnInit() {
    this.socket = io.default('http://localhost:3000', { query: { sessionId: this.sessionId } });
    this.socket.on('connect', () => console.log('Connected to server'));

    // Initialize editor
    this.editor = monaco.editor.create(document.getElementById('editor')!, {
      value: this.lastCode,
      language: 'javascript',
      theme: 'retro-clean',
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: 14,
    });

    monaco.editor.defineTheme('retro-clean', {
      base: 'vs-dark',
      inherit: true,
      rules: [{ token: '', foreground: '66FF99' }],
      colors: { 'editor.background': '#1E1E1E' },
    });

    this.editor.onDidChangeModelContent(() => {
      const code = this.editor.getValue();
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        if (code !== this.lastCode) {
          console.log('Sending code:', code);
          this.socket.emit('codeChange', { code, sessionId: this.sessionId });
          this.lastCode = code;
        }
      }, 300); // Debounce 300ms
    });

    this.socket.on('codeUpdate', (data: { code: string; sender: string }) => {
      console.log('Received codeUpdate:', data);
      if (data.sender !== this.socket.id && data.code !== this.lastCode) {
        const position = this.editor.getPosition(); // Save cursor
        this.editor.setValue(data.code); // Simple setValue for now
        this.editor.setPosition(position); // Restore cursor
        this.lastCode = data.code;
      }
    });
  }
}