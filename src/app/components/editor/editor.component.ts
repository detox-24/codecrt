import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { editor } from 'monaco-editor';
import { UserListComponent } from '../user-list/user-list.component';
import { ExecutionPanelComponent } from '../execution-panel/execution-panel.component';
import { CollaborationService } from '../../services/collaboration.service';
import { CodeExecutionService } from '../../services/code-execution.service';
import { SessionService } from '../../services/session.service';
import { SUPPORTED_LANGUAGES } from '../../models/session.model';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    MonacoEditorModule,
    UserListComponent,
    ExecutionPanelComponent
  ],
  template: `
    <div class="flex flex-col h-screen">
      <!-- Header -->
      <div class="bg-black border-b border-matrix-darkgreen p-3 flex justify-between items-center">
        <div class="flex items-center">
          <h1 class="text-2xl font-crt mr-4">
            <span class="animate-flicker">></span> CodeCRT
          </h1>
          <span *ngIf="sessionTitle" class="text-matrix-green opacity-80">{{ sessionTitle }}</span>
        </div>
        
        <div class="flex items-center space-x-4">
          <div class="flex items-center">
            <label for="language" class="mr-2">Language:</label>
            <select 
              id="language" 
              [(ngModel)]="selectedLanguage" 
              (change)="onLanguageChange()"
              class="bg-black border border-matrix-green text-matrix-green px-2 py-1 rounded-sm"
            >
              <option *ngFor="let lang of languages" [value]="lang.value">{{ lang.name }}</option>
            </select>
          </div>
          
          <div>
            <span class="mr-2">Session ID:</span>
            <code class="bg-matrix-darkgreen px-2 py-1 rounded-sm">{{ sessionId }}</code>
          </div>
          
          <button (click)="exitSession()" class="px-3 py-1">Exit</button>
        </div>
      </div>
      
      <!-- Main content -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Editor pane - 70% width -->
        <div class="flex-1 p-3 overflow-hidden">
          <div class="h-full border border-matrix-darkgreen rounded-sm overflow-hidden">
            <ngx-monaco-editor
              *ngIf="editorOptions"
              [options]="editorOptions"
              [(ngModel)]="code"
              (onInit)="onEditorInit($event)"
              class="h-full w-full"
            ></ngx-monaco-editor>
          </div>
        </div>
        
        <!-- Right panel - 30% width -->
        <div class="w-1/3 p-3 space-y-3 overflow-hidden">
          <!-- Users list -->
          <div class="h-1/4">
            <app-user-list [users]="activeUsers"></app-user-list>
          </div>
          
          <!-- Execution console -->
          <div class="h-3/4">
            <app-execution-panel 
              #executionPanel
              [executeCallback]="executeCode.bind(this)"
            ></app-execution-panel>
          </div>
        </div>
      </div>
    </div>
  `
})
export class EditorComponent implements OnInit, OnDestroy {
  @ViewChild('executionPanel') executionPanel!: ExecutionPanelComponent;
  
  sessionId: string = '';
  sessionTitle: string = '';
  code: string = '// Start coding here';
  selectedLanguage: string = 'python';
  languages = SUPPORTED_LANGUAGES;
  activeUsers: any[] = [];
  
  editorInstance: editor.IStandaloneCodeEditor | null = null;
  editorOptions: editor.IStandaloneEditorConstructionOptions = {
    theme: 'vs-dark',
    language: 'python',
    minimap: { enabled: false },
    automaticLayout: true,
    fontSize: 14,
    fontFamily: 'IBM Plex Mono, monospace',
    scrollBeyondLastLine: false,
    lineNumbers: 'on',
    glyphMargin: true,
    folding: true,
    contextmenu: true,
    renderLineHighlight: 'all',
    cursorStyle: 'line',
    cursorBlinking: 'phase',
    cursorWidth: 2
  };
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sessionService: SessionService,
    private collabService: CollaborationService,
    private codeExecutionService: CodeExecutionService
  ) {}
  
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.sessionId = params.get('sessionId') || '';
      this.loadSession();
    });
    
    this.collabService.activeUsers$.subscribe(users => {
      this.activeUsers = users;
    });
    
    // Default code templates for different languages
    this.setDefaultCode();
  }
  
  ngOnDestroy(): void {
    this.collabService.disconnect();
  }
  
  onEditorInit(editor: editor.IStandaloneCodeEditor): void {
    this.editorInstance = editor;
    
    const username = localStorage.getItem('username') || 'Anonymous';
    this.collabService.initCollaboration(this.sessionId, editor, username);
  }
  
  loadSession(): void {
    this.sessionService.getSession(this.sessionId).subscribe(
      session => {
        this.sessionTitle = session.title;
        if (session.language) {
          this.selectedLanguage = session.language;
          this.updateEditorLanguage();
        }
      },
      error => {
        console.error('Error loading session:', error);
      }
    );
  }
  
  onLanguageChange(): void {
    this.updateEditorLanguage();
    this.setDefaultCode();
  }
  
  updateEditorLanguage(): void {
    const language = this.languages.find(l => l.value === this.selectedLanguage);
    if (language && this.editorInstance) {
      const model = this.editorInstance.getModel();
      if (model) {
        editor.setModelLanguage(model, language.monacoLanguage);
      }
    }
  }
  
  executeCode(stdin: string): void {
    if (!this.editorInstance) return;
    
    const code = this.editorInstance.getValue();
    const language = this.languages.find(l => l.value === this.selectedLanguage);
    
    if (!language) {
      this.executionPanel.setError('Language not supported');
      return;
    }
    
    this.codeExecutionService.executeCode({
      sourceCode: code,
      languageId: language.id,
      stdin
    }).subscribe(
      result => {
        this.executionPanel.setResult(result);
      },
      error => {
        this.executionPanel.setError('Error executing code: ' + error.message);
      }
    );
  }
  
  exitSession(): void {
    this.collabService.disconnect();
    this.router.navigate(['/']);
  }
  
  private setDefaultCode(): void {
    // Only set default code if the editor is empty
    if (this.code && this.code !== '// Start coding here') {
      return;
    }
    
    switch (this.selectedLanguage) {
      case 'python':
        this.code = '# Python Example\n\ndef greet(name):\n    return f"Hello, {name}!"\n\nname = input()\nprint(greet(name))';
        break;
      case 'javascript':
        this.code = '// JavaScript Example\n\nfunction greet(name) {\n    return `Hello, ${name}!`;\n}\n\nconst name = "World";\nconsole.log(greet(name));';
        break;
      case 'cpp':
        this.code = '// C++ Example\n\n#include <iostream>\n#include <string>\n\nint main() {\n    std::string name;\n    std::cin >> name;\n    std::cout << "Hello, " << name << "!\\n";\n    return 0;\n}';
        break;
      default:
        this.code = '// Start coding here';
    }
  }
}