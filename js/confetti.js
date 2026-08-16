/**
 * High-performance Confetti Particle System using Canvas
 */
class ConfettiEngine {
  constructor(canvasId = 'confetti-canvas') {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.particles = [];
    this.animationId = null;
    this.colors = [
      '#38bdf8', '#2563eb', '#06b6d4', '#10b981', 
      '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899', '#facc15'
    ];

    if (this.canvas) {
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth * window.devicePixelRatio;
    this.canvas.height = window.innerHeight * window.devicePixelRatio;
    if (this.ctx) {
      this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
  }

  fire(durationMs = 3500) {
    if (!this.canvas || !this.ctx) return;
    this.resize();
    this.particles = [];

    const numParticles = Math.min(window.innerWidth > 768 ? 160 : 90, 200);

    // Left cannon
    for (let i = 0; i < numParticles / 2; i++) {
      this.particles.push(this.createParticle(0.1, 0.9, 60, -80));
    }
    // Right cannon
    for (let i = 0; i < numParticles / 2; i++) {
      this.particles.push(this.createParticle(0.9, 0.9, 120, -80));
    }
    // Center burst
    for (let i = 0; i < 40; i++) {
      this.particles.push(this.createParticle(0.5, 0.6, 90, -90, 15));
    }

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    const startTime = performance.now();
    const loop = (currentTime) => {
      const elapsed = currentTime - startTime;
      this.render();

      if (this.particles.length > 0 && elapsed < durationMs) {
        this.animationId = requestAnimationFrame(loop);
      } else {
        this.clear();
      }
    };

    this.animationId = requestAnimationFrame(loop);
  }

  createParticle(originXRatio, originYRatio, angleBase, angleSpread, speedSpread = 22) {
    const angle = (angleBase + (Math.random() - 0.5) * angleSpread) * (Math.PI / 180);
    const speed = 12 + Math.random() * speedSpread;
    return {
      x: window.innerWidth * originXRatio,
      y: window.innerHeight * originYRatio,
      vx: Math.cos(angle) * speed,
      vy: -Math.sin(angle) * speed,
      size: 8 + Math.random() * 8,
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      opacity: 1,
      shape: Math.random() > 0.4 ? 'rect' : 'circle',
      drag: 0.96,
      gravity: 0.42
    };
  }

  render() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= p.drag;
      p.vy = p.vy * p.drag + p.gravity;
      p.rotation += p.rotationSpeed;
      p.opacity -= 0.007;

      if (p.y > window.innerHeight + 50 || p.opacity <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.globalAlpha = Math.max(p.opacity, 0);
      this.ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        this.ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size / 2.5, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    }
  }

  clear() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.particles = [];
    if (this.ctx) {
      this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }
}

export const confetti = new ConfettiEngine();
