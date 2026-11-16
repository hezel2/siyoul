import { useEffect, useRef } from 'react';

interface GoldParticlesCanvasProps {
  mode?: 'ambient' | 'converge';
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  twinklePhase: number;
}

export function GoldParticlesCanvas({
  mode = 'ambient',
  className = '',
}: GoldParticlesCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let animationFrameId = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const count = mode === 'converge' ? 42 : 34;
    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * (width || 1200),
      y: Math.random() * (height || 800),
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.2 - 0.08,
      radius: Math.random() * 1.6 + 0.6,
      alpha: Math.random() * 0.45 + 0.15,
      twinklePhase: Math.random() * Math.PI * 2,
    }));

    const drawStatic = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(226, 202, 145, ${p.alpha * 0.6})`;
        ctx.fill();
      }
    };

    if (reducedMotion) {
      drawStatic();
      return () => {
        window.removeEventListener('resize', resize);
      };
    }

    let tick = 0;
    const render = () => {
      tick += 0.015;
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;

      for (const p of particles) {
        if (mode === 'converge') {
          const dx = cx - p.x;
          const dy = cy - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 18) {
            const angle = Math.random() * Math.PI * 2;
            const spawnR = Math.max(width, height) * 0.48;
            p.x = cx + Math.cos(angle) * spawnR;
            p.y = cy + Math.sin(angle) * spawnR;
          } else {
            p.x += (dx / dist) * 0.65 - dy * 0.0022;
            p.y += (dy / dist) * 0.65 + dx * 0.0022;
          }
        } else {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
          if (p.y < -10) p.y = height + 10;
          if (p.y > height + 10) p.y = -10;
        }

        const twinkle = 0.65 + 0.35 * Math.sin(tick + p.twinklePhase);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(226, 202, 145, ${p.alpha * twinkle})`;
        ctx.fill();
      }

      animationFrameId = window.requestAnimationFrame(render);
    };

    animationFrameId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [mode]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
