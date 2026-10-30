'use client'
import { useEffect, useRef } from 'react'

const PALETTES = {
  stock:  ['#10B981', '#059669', '#34D399', '#6EE7B7'],
  money:  ['#F59E0B', '#D97706', '#FBBF24'],
  carbon: ['#84CC16', '#65A30D', '#A3E635'],
}

const WAVES = [
  { amp: 0.075, freq: 1.2, speed: 0.13, phase: 0,   color: '#10B981', yRatio: 0.27 },
  { amp: 0.055, freq: 0.9, speed: 0.09, phase: 2.1, color: '#F59E0B', yRatio: 0.47 },
  { amp: 0.042, freq: 1.5, speed: 0.17, phase: 4.0, color: '#84CC16', yRatio: 0.66 },
]

interface Particle {
  x: number; y: number; vx: number; vy: number
  r: number; color: string; alpha: number; phase: number; phaseSpeed: number
}

interface Candle {
  x: number; bodyY: number; bodyH: number
  wickTop: number; wickBot: number
  w: number; isGreen: boolean
  alpha: number; phase: number; phaseSpeed: number
}

export default function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let raf: number
    let W = 0, H = 0
    const parent = canvas.parentElement!

    let particles: Particle[] = []
    let candles: Candle[] = []
    let t = 0

    function mkParticle(): Particle {
      const b = Math.random()
      const pal = b < 0.40 ? PALETTES.stock : b < 0.68 ? PALETTES.money : PALETTES.carbon
      return {
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.6 + 0.8,
        color: pal[Math.floor(Math.random() * pal.length)],
        alpha: Math.random() * 0.38 + 0.14,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: Math.random() * 0.022 + 0.007,
      }
    }

    function initAll() {
      const n = Math.min(65, Math.floor(W * H / 12500))
      particles = Array.from({ length: n }, mkParticle)

      candles = []
      for (let i = 0; i < 5; i++) {
        const cx = (i / 4) * W * 0.88 + W * 0.06
        const baseY = H * (0.15 + Math.random() * 0.55)
        const count = 6 + Math.floor(Math.random() * 5)
        for (let b = 0; b < count; b++) {
          const w = 5 + Math.random() * 3
          const bodyH = 8 + Math.random() * 26
          const bodyY = baseY + (Math.random() - 0.5) * 55
          candles.push({
            x: cx + (b - count / 2) * (w + 3),
            bodyY, bodyH,
            wickTop: bodyY - bodyH * 0.5 - Math.random() * 9,
            wickBot: bodyY + bodyH * 0.5 + Math.random() * 9,
            w,
            isGreen: Math.random() > 0.44,
            alpha: 0.05 + Math.random() * 0.085,
            phase: Math.random() * Math.PI * 2,
            phaseSpeed: Math.random() * 0.012 + 0.004,
          })
        }
      }
    }

    function resize() {
      W = canvas.width = parent.offsetWidth
      H = canvas.height = parent.offsetHeight
      initAll()
    }

    function drawGrid() {
      ctx.save()
      ctx.strokeStyle = 'rgba(16,185,129,0.042)'
      ctx.lineWidth = 1
      for (let i = 1; i < 15; i++) {
        ctx.beginPath(); ctx.moveTo(i * W / 15, 0); ctx.lineTo(i * W / 15, H); ctx.stroke()
      }
      for (let j = 1; j < 9; j++) {
        ctx.beginPath(); ctx.moveTo(0, j * H / 9); ctx.lineTo(W, j * H / 9); ctx.stroke()
      }
      ctx.restore()
    }

    function drawWaves() {
      WAVES.forEach(w => {
        ctx.save()
        ctx.beginPath()
        const baseY = H * w.yRatio
        for (let x = 0; x <= W; x += 2) {
          const n = x / W
          const y = baseY
            + Math.sin(t * w.speed * 3 + n * Math.PI * 4 * w.freq + w.phase) * H * w.amp
            + Math.sin(t * w.speed * 1.7 + n * Math.PI * 2.5 * w.freq + w.phase + 1) * H * w.amp * 0.35
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.strokeStyle = w.color + '2A'
        ctx.lineWidth = 1.5
        ctx.stroke()
        ctx.strokeStyle = w.color + '0D'
        ctx.lineWidth = 6
        ctx.stroke()
        ctx.restore()
      })
    }

    function drawCandles() {
      candles.forEach(c => {
        c.phase += c.phaseSpeed
        const a = c.alpha * (0.55 + 0.45 * Math.sin(c.phase))
        const col = c.isGreen ? '#10B981' : '#EF4444'
        ctx.save()
        ctx.globalAlpha = a
        ctx.strokeStyle = col; ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(c.x, c.wickTop); ctx.lineTo(c.x, c.wickBot); ctx.stroke()
        ctx.fillStyle = col
        ctx.fillRect(c.x - c.w / 2, c.bodyY - c.bodyH / 2, c.w, Math.max(c.bodyH, 1.5))
        ctx.restore()
      })
    }

    function drawParticlesAndLines() {
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.phase += p.phaseSpeed
        if (p.x < -4) p.x = W + 4; else if (p.x > W + 4) p.x = -4
        if (p.y < -4) p.y = H + 4; else if (p.y > H + 4) p.y = -4
        const a = p.alpha * (0.7 + 0.3 * Math.sin(p.phase))
        ctx.save()
        ctx.shadowColor = p.color; ctx.shadowBlur = 9; ctx.globalAlpha = a
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.color; ctx.fill()
        ctx.restore()
      })

      const D = 115
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const d2 = dx * dx + dy * dy
          if (d2 < D * D) {
            const d = Math.sqrt(d2)
            ctx.save()
            ctx.globalAlpha = (1 - d / D) * 0.09
            ctx.strokeStyle = '#10B981'; ctx.lineWidth = 0.5
            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke()
            ctx.restore()
          }
        }
      }
    }

    function tick() {
      t += 1 / 60
      ctx.clearRect(0, 0, W, H)
      drawGrid()
      drawWaves()
      drawCandles()
      drawParticlesAndLines()
      raf = requestAnimationFrame(tick)
    }

    resize()

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!prefersReduced) {
      tick()
    } else {
      tick()
      cancelAnimationFrame(raf!)
    }

    const ro = new ResizeObserver(resize)
    ro.observe(parent)

    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
    />
  )
}
