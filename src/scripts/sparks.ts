// Radiating pixel-spark burst on a dedicated overlay canvas — used by the
// hero mascot and the About page's country pals. Returns burst() to fire one
// and destroy() to tear down (call on re-entry; the <main> slot is swapped on
// every client-router navigation, and the resize listener lives on window).
interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  color: string;
}

export interface SparkField {
  burst: (x: number, y: number, boost?: number) => void;
  destroy: () => void;
}

export function createSparkField(canvas: HTMLCanvasElement): SparkField {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { burst: () => {}, destroy: () => {} };

  let sparks: Spark[] = [];
  let rafId: number | null = null;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width || window.innerWidth));
    const h = Math.max(1, Math.round(rect.height || window.innerHeight));
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  const rootStyle = getComputedStyle(document.documentElement);
  const colors = [
    rootStyle.getPropertyValue("--color-red").trim() || "#e8433a",
    rootStyle.getPropertyValue("--color-green").trim() || "#3ed68c",
    rootStyle.getPropertyValue("--color-blue").trim() || "#55aaff",
  ];

  function tick() {
    ctx!.clearRect(0, 0, canvas.width, canvas.height);
    sparks = sparks.filter((s) => s.age < s.life);
    for (const s of sparks) {
      s.vy += 0.06;
      s.vx *= 0.96;
      s.vy *= 0.96;
      s.x += s.vx;
      s.y += s.vy;
      s.age += 1;
      ctx!.globalAlpha = Math.max(0, 1 - s.age / s.life);
      ctx!.fillStyle = s.color;
      const half = s.size / 2;
      ctx!.fillRect(Math.round(s.x - half), Math.round(s.y - half), s.size, s.size);
    }
    ctx!.globalAlpha = 1;
    rafId = sparks.length > 0 ? requestAnimationFrame(tick) : null;
  }

  return {
    burst(x, y, boost = 1.8) {
      const count = Math.round((10 + Math.floor(Math.random() * 6)) * boost);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const speed = 1.4 + Math.random() * 2.4;
        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          age: 0,
          life: (22 + Math.random() * 12) * boost,
          size: 2 + Math.round(Math.random() * 2),
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
      if (!rafId) rafId = requestAnimationFrame(tick);
    },
    destroy() {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      sparks = [];
    },
  };
}
