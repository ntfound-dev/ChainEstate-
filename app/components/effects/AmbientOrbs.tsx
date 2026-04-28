'use client'

export function AmbientOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* Gold orb - bottom left */}
      <div
        className="absolute rounded-full"
        style={{
          width: '600px',
          height: '600px',
          bottom: '-200px',
          left: '-150px',
          background: 'radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)',
          animation: 'orbFloat 8s ease-in-out infinite',
        }}
      />
      {/* Teal orb - top right */}
      <div
        className="absolute rounded-full"
        style={{
          width: '500px',
          height: '500px',
          top: '-100px',
          right: '-100px',
          background: 'radial-gradient(circle, rgba(0,229,160,0.07) 0%, transparent 70%)',
          animation: 'orbFloat2 10s ease-in-out infinite',
        }}
      />
    </div>
  )
}
