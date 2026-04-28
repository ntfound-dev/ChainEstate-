'use client'

import { useEffect, useRef } from 'react'

export function EncryptedRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const chars = '0123456789ABCDEF'
    const fontSize = 13
    const cols = Math.floor(canvas.width / fontSize)
    const drops: number[] = Array(cols).fill(0).map(() => Math.random() * -50)

    let animId: number
    const draw = () => {
      ctx.fillStyle = 'rgba(8, 8, 16, 0.04)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = '#c9a84c'
      ctx.font = `${fontSize}px "DM Mono", monospace`

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)]
        ctx.fillText(char, i * fontSize, drops[i] * fontSize)
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }
      animId = requestAnimationFrame(draw)
    }

    animId = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} id="encrypted-rain" aria-hidden="true" />
}
