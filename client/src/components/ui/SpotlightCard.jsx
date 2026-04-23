import { useRef, useState } from 'react';

export default function SpotlightCard({ children, className = '', spotlightColor = 'rgba(34,197,94,0.13)' }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0, opacity: 0 });

  function onMove(e) {
    const rect = ref.current.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top, opacity: 1 });
  }

  function onLeave() {
    setPos(p => ({ ...p, opacity: 0 }));
  }

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-xl transition-opacity duration-300"
        style={{
          opacity: pos.opacity,
          background: `radial-gradient(350px circle at ${pos.x}px ${pos.y}px, ${spotlightColor}, transparent 70%)`,
        }}
      />
      {children}
    </div>
  );
}
