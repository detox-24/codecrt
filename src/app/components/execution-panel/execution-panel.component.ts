import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExecutionResult } from '../../models/session.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-execution-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex flex-col">
      <div class="crt-screen flex flex-col h-full">
        <div class="flex items-center justify-between mb-3 border-b border-matrix-darkgreen pb-2">
          <h3 class="text-xl">Execution Console</h3>
          <div class="flex space-x-2">
            <button class="px-2 py-1 text-sm" (click)="executeCode()">Run Code</button>
            <button class="px-2 py-1 text-sm" (click)="clearOutput()">Clear</button>
          </div>
        </div>
        
        <div class="mb-3">
          <label class="block mb-1 text-sm">Input (stdin)</label>
          <textarea 
            [(ngModel)]="stdin" 
            placeholder="Enter input here..."
            class="w-full h-16 bg-black border border-matrix-darkgreen text-matrix-green p-2 font-mono resize-none"
          ></textarea>
        </div>
        
        <div class="flex-1 overflow-auto">
          <pre *ngIf="loading" class="animate-flicker">Executing code...</pre>
          
          <div *ngIf="!loading && result" class="space-y-2">
            <div *ngIf="result.status && result.status.id !== 3" class="border border-red-500 p-2 rounded-sm">
              <div class="text-red-500">Status: {{ result.status.description }}</div>
            </div>
            
            <div *ngIf="result.stdout" class="space-y-1">
              <div class="text-matrix-green text-sm">Output:</div>
              <pre class="whitespace-pre-wrap break-words">{{ result.stdout }}</pre>
            </div>
            
            <div *ngIf="result.stderr" class="space-y-1">
              <div class="text-red-400 text-sm">Error:</div>
              <pre class="whitespace-pre-wrap break-words text-red-400">{{ result.stderr }}</pre>
            </div>
            
            <div *ngIf="result.time || result.memory" class="text-sm opacity-70 pt-2 border-t border-matrix-darkgreen">
              <div *ngIf="result.time">Execution time: {{ result.time }}s</div>
              <div *ngIf="result.memory">Memory used: {{ formatMemory(result.memory) }}</div>
            </div>
          </div>
          
          <pre *ngIf="!loading && error" class="text-red-400 whitespace-pre-wrap">{{ error }}</pre>
          
          <div *ngIf="!loading && !result && !error" class="opacity-60">
            Code execution results will appear here.
          </div>
        </div>
      </div>
    </div>
  `
})
export class ExecutionPanelComponent {
  @Input() executeCallback: ((stdin: string) => void) | null = null;
  
  stdin: string = '';
  result: ExecutionResult | null = null;
  error: string | null = null;
  loading: boolean = false;
  
  executeCode(): void {
    if (this.executeCallback) {
      this.loading = true;
      this.executeCallback(this.stdin);
    }
  }
  
  clearOutput(): void {
    this.result = null;
    this.error = null;
  }
  
  setResult(result: ExecutionResult): void {
    this.result = result;
    this.error = null;
    this.loading = false;
  }
  
  setError(error: string): void {
    this.error = error;
    this.result = null;
    this.loading = false;
  }
  
  formatMemory(memory: string): string {
    const mem = parseInt(memory);
    if (isNaN(mem)) return memory;
    
    if (mem < 1024) return `${mem} KB`;
    return `${(mem / 1024).toFixed(2)} MB`;
  }
}