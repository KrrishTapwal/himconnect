import { NavLink, useNavigate, useLocation } from 'react-router-dom';
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

function InboxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export default function Navbar() {
  const { user } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [bellUnread, setBellUnread] = useState(0);
  const [msgUnread, setMsgUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // clear msg badge when on messages page
  useEffect(() => {
    if (location.pathname.startsWith('/messages')) {
      setMsgUnread(0);
      api.put('/notifications/read-messages').catch(() => {});
    }
  }, [location.pathname]);

  async function fetchCounts() {
    try {
      const { data } = await api.get('/notifications');
      const unread = data.filter(n => !n.read);
      setBellUnread(unread.filter(n => n.type !== 'new_message').length);
      setMsgUnread(unread.filter(n => n.type === 'new_message').length);
    } catch {}
  }

  return (
    <>
      {/* top bar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 h-12 flex items-center justify-between px-4">
        <span className="font-bold text-base shiny-text">HimConnect</span>
        <div className="flex items-center gap-3">

          {/* inbox / DMs */}
          <button className="relative text-gray-500 hover:text-green-700 transition-colors" onClick={() => nav('/messages')}>
            <InboxIcon />
            {msgUnread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-green-700 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full font-bold">
                {msgUnread > 9 ? '9+' : msgUnread}
              </span>
            )}
          </button>

          {/* notifications bell */}
          <button className="relative" onClick={() => nav('/notifications')}>
            <span className="text-lg">🔔</span>
            {bellUnread > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                {bellUnread > 9 ? '9+' : bellUnread}
              </span>
            )}
          </button>

          {/* admin panel shortcut — only visible to admin */}
          {user?.role === 'admin' && (
            <button onClick={() => nav('/admin')} title="Admin Panel"
              className="w-8 h-8 bg-green-700 rounded-full flex items-center justify-center text-white shadow-sm hover:bg-green-800 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </button>
          )}

          {/* avatar */}
          <button onClick={() => nav('/profile')} className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-800 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
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
