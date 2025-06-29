import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-matrix-rain',
  standalone: true,
  template: `
    <canvas #matrixCanvas class="matrix-container"></canvas>
  `
})
export class MatrixRainComponent implements OnInit, OnDestroy {
  @ViewChild('matrixCanvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private columns: number[] = [];
  private animationId: number = 0;

  ngOnInit() {
    this.setupCanvas();
    this.initRain();
    this.startAnimation();
    window.addEventListener('resize', this.handleResize);
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.handleResize);
    cancelAnimationFrame(this.animationId);
  }

  private handleResize = () => {
    this.setupCanvas();
    this.initRain();
  };

  private setupCanvas() {
    const canvas = this.canvas.nativeElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    this.ctx = canvas.getContext('2d')!;
  }

  private initRain() {
    this.columns = Array(Math.floor(this.canvas.nativeElement.width)).fill(0);
  }

  private startAnimation() {
    this.draw();
  }

  private draw() {
    // Semi-transparent black to create trail effect
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    this.ctx.fillRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);

    // Set the color and font
    this.ctx.fillStyle = '#00FF41';
    this.ctx.font = '20px monospace';

    // For each column
    for (let i = 0; i < this.columns.length; i++) {
      // Get a random character
      const char = String.fromCharCode(Math.floor(Math.random() * 128));

      // Calculate x position (based on column) and y position (based on current value)
      const x = i * 15;
      const y = this.columns[i] * 15;

      // Draw the character
      this.ctx.fillText(char, x, y);

      // Reset to top or move down
      if (y > this.canvas.nativeElement.height && Math.random() > 0.975) {
        this.columns[i] = 0;
      } else {
        this.columns[i]++;
      }
    }

    // Request next frame
    this.animationId = requestAnimationFrame(() => this.draw());
  }
}