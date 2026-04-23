import { useEffect, useState } from 'react';

const CONFETTI_COLORS = ['#0D7C4D', '#F97316', '#facc15', '#60a5fa', '#f472b6'];

function Confetti() {
  const [pieces] = useState(() =>
    Array.from({ length: 36 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 1.2,
      duration: 1.8 + Math.random() * 1.2,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 6 + Math.random() * 8,
      rotate: Math.random() * 360
    }))
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pieces.map(p => (
        <div
          key={p.id}
          className="absolute top-0 confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            transform: `rotate(${p.rotate}deg)`,
            animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards`
          }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(420px) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function FoundingCelebration({ memberNumber, onContinue }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{ background: 'rgba(0,0,0,0.65)' }}>
      <div className="relative bg-white rounded-3xl w-full max-w-sm p-8 text-center shadow-2xl overflow-hidden">
        <Confetti />

        {/* mountain badge */}
        <div className="relative z-10">
          <div className="w-20 h-20 bg-green-700 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg">
            🏔️
          </div>

          <div className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-600 text-xs font-semibold px-3 py-1 rounded-full mb-3">
            Founding Member #{memberNumber}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-2">
            Welcome to HimConnect!
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            You're one of the <strong className="text-green-700">first 1000</strong> people on this platform.
            That's a big deal — HP students needed this.
          </p>

          {/* points card */}
          <div className="bg-gradient-to-r from-green-700 to-green-600 rounded-2xl p-4 mb-6 text-white">
            <p className="text-3xl font-bold">100</p>
            <p className="text-sm opacity-90 mt-0.5">HimConnect Points awarded</p>
            <p className="text-xs opacity-70 mt-2">More ways to earn & use points coming soon</p>
          </div>

          {/* perks list */}
          <ul className="text-left space-y-2 mb-6">
            {[
              { icon: '🏔️', text: 'Founding Member badge on your profile' },
              { icon: '🪙', text: '100 points — locked in forever' },
              { icon: '💰', text: '₹1/month pricing when payments launch' },
              { icon: '❤️', text: 'Part of HP\'s first student network' }
            ].map(item => (
              <li key={item.text} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-base shrink-0">{item.icon}</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>

          <button
            className="btn-primary w-full text-base py-3"
            onClick={onContinue}>
            Let's go! Set up my profile →
          </button>
        </div>
      </div>
    </div>
  );
}
