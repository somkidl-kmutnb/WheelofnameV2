/**
 * High Performance Canvas Wheel Engine
 */
import { sound } from './audio.js';

// Classroom-friendly bright and vibrant color palette
const SECTOR_COLORS = [
  '#2563eb', // Vibrant Blue
  '#059669', // Emerald
  '#d97706', // Amber
  '#dc2626', // Red
  '#7c3aed', // Purple
  '#0891b2', // Cyan
  '#db2777', // Pink
  '#ea580c', // Orange
  '#4f46e5', // Indigo
  '#16a34a', // Green
  '#0284c7', // Sky Blue
  '#9333ea'  // Violet
];

export class WheelEngine {
  constructor(canvasId, pointerId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.pointerEl = document.getElementById(pointerId);

    this.names = [];
    this.currentRotation = 0; // Current angle in radians
    this.isSpinning = false;
    this.spinDuration = 6000; // ms

    this.lastTickSliceIndex = -1;
    this.onSpinStart = null;
    this.onSpinComplete = null;

    this.initCanvasSize();
    window.addEventListener('resize', () => {
      this.initCanvasSize();
      this.draw();
    });
  }

  initCanvasSize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const size = Math.max(rect.width || 560, 320);
    const dpr = window.devicePixelRatio || 1;

    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;

    this.centerX = this.canvas.width / 2;
    this.centerY = this.canvas.height / 2;
    this.radius = (this.canvas.width / 2) - (12 * dpr);
    this.dpr = dpr;
  }

  setNames(namesList) {
    this.names = namesList.filter(n => n && n.trim().length > 0);
    this.draw();
  }

  draw() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const dpr = this.dpr || 1;
    const total = this.names.length;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (total === 0) {
      // Draw empty placeholder wheel
      this.drawEmptyWheel();
      return;
    }

    const sliceAngle = (Math.PI * 2) / total;

    ctx.save();
    ctx.translate(this.centerX, this.centerY);
    ctx.rotate(this.currentRotation);

    // Draw slices
    for (let i = 0; i < total; i++) {
      const startAngle = i * sliceAngle;
      const endAngle = startAngle + sliceAngle;
      const color = SECTOR_COLORS[i % SECTOR_COLORS.length];

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, this.radius, startAngle, endAngle);
      ctx.closePath();

      // Slice background
      ctx.fillStyle = color;
      ctx.fill();

      // Outer rim subtle stroke
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5 * dpr;
      ctx.stroke();

      // Sector separator pin at endAngle
      const pinX = Math.cos(endAngle) * (this.radius - 8 * dpr);
      const pinY = Math.sin(endAngle) * (this.radius - 8 * dpr);
      ctx.beginPath();
      ctx.arc(pinX, pinY, 4.5 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1 * dpr;
      ctx.stroke();

      // Draw Name Text
      this.drawSliceText(this.names[i], startAngle, sliceAngle, total);
    }

    ctx.restore();

    // Draw Outer Rim Shadow & Highlight
    this.drawOuterBezel();

    // Draw Center Decorative Hub
    this.drawCenterHub();
  }

  drawSliceText(text, startAngle, sliceAngle, total) {
    const ctx = this.ctx;
    const dpr = this.dpr || 1;

    ctx.save();
    // Rotate to middle of slice
    ctx.rotate(startAngle + sliceAngle / 2);

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    // Dynamic Font Sizing for Kanit (bold & clear)
    let fontSize = 24 * dpr;
    if (total > 50) fontSize = 11 * dpr;
    else if (total > 30) fontSize = 13 * dpr;
    else if (total > 20) fontSize = 16 * dpr;
    else if (total > 12) fontSize = 19 * dpr;
    else if (total <= 6) fontSize = 28 * dpr;

    ctx.font = `bold ${fontSize}px 'Kanit', sans-serif`;

    // Maximum text width within the slice radius
    const maxTextWidth = this.radius * 0.72;
    let displayText = text;

    // Check width and truncate with ellipsis if too long
    if (ctx.measureText(displayText).width > maxTextWidth) {
      while (displayText.length > 2 && ctx.measureText(displayText + '…').width > maxTextWidth) {
        displayText = displayText.slice(0, -1);
      }
      displayText += '…';
    }

    // Text Shadow for High Contrast on bright colors
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 4 * dpr;
    ctx.shadowOffsetX = 1 * dpr;
    ctx.shadowOffsetY = 1 * dpr;

    ctx.fillStyle = '#ffffff';
    ctx.fillText(displayText, this.radius - 22 * dpr, 0);

    ctx.restore();
  }

  drawOuterBezel() {
    const ctx = this.ctx;
    const dpr = this.dpr || 1;

    ctx.save();
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6 * dpr;
    ctx.stroke();
    ctx.restore();
  }

  drawCenterHub() {
    const ctx = this.ctx;
    const dpr = this.dpr || 1;
    const hubRadius = 50 * dpr;

    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    // Hub Outer Ring
    ctx.beginPath();
    ctx.arc(0, 0, hubRadius, 0, Math.PI * 2);
    const grad = ctx.createLinearGradient(-hubRadius, -hubRadius, hubRadius, hubRadius);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.5, '#e0f2fe');
    grad.addColorStop(1, '#bae6fd');
    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(37, 99, 235, 0.3)';
    ctx.shadowBlur = 12 * dpr;
    ctx.fill();

    ctx.lineWidth = 4 * dpr;
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();

    ctx.restore();
  }

  drawEmptyWheel() {
    const ctx = this.ctx;
    const dpr = this.dpr || 1;

    ctx.save();
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#e2e8f0';
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 4 * dpr;
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = `600 ${22 * dpr}px 'Kanit', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('กรุณาเพิ่มรายชื่อนักเรียน', this.centerX, this.centerY);
    ctx.restore();
  }

  // Pointer needle angle is at right side (0 radians)
  // Get index of slice currently pointed to
  getCurrentWinningIndex() {
    const total = this.names.length;
    if (total === 0) return -1;

    const sliceAngle = (Math.PI * 2) / total;
    // The pointer is situated at angle 0 (3 o'clock / Right side)
    // Wheel rotated by currentRotation, so point on wheel under pointer is:
    let angleUnderPointer = (0 - this.currentRotation) % (Math.PI * 2);
    if (angleUnderPointer < 0) {
      angleUnderPointer += Math.PI * 2;
    }

    const index = Math.floor(angleUnderPointer / sliceAngle) % total;
    return index;
  }

  // Start spinning with realistic deceleration physics
  spin(customDurationMs = null) {
    if (this.isSpinning || this.names.length === 0) return;

    this.isSpinning = true;
    const duration = customDurationMs || this.spinDuration;

    if (this.onSpinStart) this.onSpinStart();

    // Random landing target: between 5 to 10 full revolutions + random offset
    const totalRounds = 5 + Math.floor(Math.random() * 5);
    const randomOffset = Math.random() * Math.PI * 2;
    const targetDeltaRotation = (totalRounds * Math.PI * 2) + randomOffset;

    const startRotation = this.currentRotation;
    const targetRotation = startRotation + targetDeltaRotation;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Smooth custom cubic ease-out: 1 - Math.pow(1 - progress, 3.8)
      const ease = 1 - Math.pow(1 - progress, 3.8);
      this.currentRotation = startRotation + (targetDeltaRotation * ease);

      // Check pointer needle tick sound & bounce
      const currentIndex = this.getCurrentWinningIndex();
      if (currentIndex !== this.lastTickSliceIndex) {
        this.lastTickSliceIndex = currentIndex;
        const velocityRatio = 1 - progress; // Higher at start
        sound.playTick(velocityRatio);
        this.animatePointerBounce();
      }

      this.draw();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isSpinning = false;
        const winnerIndex = this.getCurrentWinningIndex();
        const winnerName = this.names[winnerIndex];

        if (this.onSpinComplete) {
          this.onSpinComplete(winnerName, winnerIndex);
        }
      }
    };

    requestAnimationFrame(animate);
  }

  animatePointerBounce() {
    if (!this.pointerEl) return;
    this.pointerEl.style.transform = 'translateY(-50%) rotate(-18deg)';
    setTimeout(() => {
      if (this.pointerEl) {
        this.pointerEl.style.transform = 'translateY(-50%) rotate(0deg)';
      }
    }, 45);
  }
}
