import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const NAV = [
  { to: '/', label: 'Feed', icon: '🏠' },
  { to: '/mentors', label: 'Mentors', icon: '🧑‍💼' },
  { to: '/jobs', label: 'Jobs', icon: '💼' },
  { to: '/rooms', label: 'Rooms', icon: '🏔️' },
  { to: '/connections', label: 'Meets', icon: '🤝' }
];

export default function Navbar() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    api.get('/notifications').then(({ data }) => {
      setUnread(data.filter(n => !n.read).length);
    }).catch(() => {});
  }, [user]);

  return (
    <>
      {/* top bar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 h-12 flex items-center justify-between px-4">
        <span className="font-bold text-green-700 text-base">HimConnect</span>
        <div className="flex items-center gap-3">
          <button className="relative" onClick={() => nav('/notifications')}>
            <span className="text-lg">🔔</span>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          <button onClick={() => nav(`/profile`)} className="w-8 h-8 bg-green-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
          </button>
        </div>
      </header>

      {/* bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex">
        {NAV.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs transition-colors ${isActive ? 'text-green-700 font-semibold' : 'text-gray-400'}`
            }>
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
