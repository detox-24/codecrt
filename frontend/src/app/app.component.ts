import { Component, OnInit } from '@angular/core';
import * as monaco from 'monaco-editor';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { io } from 'socket.io-client';

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
  editor: any;
  sessionId = 'session123';
  output = '';
  socket: any;
  selectedLanguage = 'javascript';

  ngOnInit() {
    const ydoc = new Y.Doc();
    const wsProvider = new WebsocketProvider(
      'ws://localhost:3000/yjs', // Yjs CRDT sync path
      this.sessionId,
      ydoc
    );
    const ytext = ydoc.getText('code');

    this.editor = monaco.editor.create(document.getElementById('editor')!, {
      value: '// CodeCRT - Start coding here\nconsole.log("Hello, World!");',
      language: this.selectedLanguage,
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

    const binding = new MonacoBinding(ytext, this.editor.getModel(), new Set([this.editor]));

    wsProvider.on('status', (event: any) => {
      console.log('Yjs WebSocket status:', event.status);
    });

    this.socket = io('http://localhost:3000'); // Default path for run results
    this.socket.on('connect', () => console.log('Socket.io connected'));
    this.socket.on('runResult', (data: { output: string }) => {
      this.output = data.output;
      console.log('Run result:', data.output);
    });
  }

  runCode() {
    const code = this.editor.getValue();
    fetch('http://localhost:3000/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language: this.selectedLanguage }),
    })
      .then(res => res.json())
      .then(data => this.output = data.output || data.error)
      .catch(err => this.output = 'Error: ' + err.message);
  }

  changeLanguage(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedLanguage = target.value;
    monaco.editor.setModelLanguage(this.editor.getModel(), this.selectedLanguage);
  }
}