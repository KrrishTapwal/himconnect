import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const TYPE_ICON = {
  new_mentor: '🧑‍💼',
  new_job: '💼',
  streak_alert: '🔥',
  connection_request: '🤝',
  connection_accepted: '✅',
  new_message: '💬',
  rating_received: '⭐',
  founding_member: '🏔️'
};

export default function Notifications() {
  const nav = useNavigate();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications').then(({ data }) => {
      setNotifs(data);
      // mark all read
      api.put('/notifications/read-all').catch(() => {});
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-8 text-center text-gray-400">Loading…</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <h1 className="text-xl font-bold mb-4">Notifications</h1>
      {notifs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">🔔</p>
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map(n => (
            <div key={n._id}
              className={`card flex items-start gap-3 cursor-pointer hover:border-green-200 transition-colors ${!n.read ? 'border-green-200 bg-green-50' : ''}`}
              onClick={() => { if (n.link) nav(n.link); }}>
              <span className="text-xl mt-0.5">{TYPE_ICON[n.type] || '🔔'}</span>
              <div className="flex-1">
                <p className="text-sm text-gray-900">{n.text}</p>
                <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
              </div>
              {!n.read && <div className="w-2 h-2 bg-green-700 rounded-full mt-1.5 shrink-0" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function timeAgo(date) {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
