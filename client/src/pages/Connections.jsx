import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const STATUS_COLOR = {
  pending: 'badge-gray',
  accepted: 'badge-green',
  declined: 'text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-500',
  completed: 'badge-green'
};

const MEET_LABEL = { chai: '☕ Chai', career: '💼 Career', mock_interview: '🎯 Mock Interview' };

export default function Connections() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/connections').then(({ data }) => setConnections(data)).finally(() => setLoading(false));
  }, []);

  async function updateStatus(id, status) {
    try {
      const { data } = await api.put(`/connections/${id}`, { status });
      setConnections(prev => prev.map(c => c._id === id ? data : c));
    } catch {}
  }

  async function rate(id, rating) {
    try {
      const { data } = await api.put(`/connections/${id}`, { status: 'completed', rating });
      setConnections(prev => prev.map(c => c._id === id ? data : c));
    } catch {}
  }

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-8 text-center text-gray-400">Loading…</div>;

  const incoming = connections.filter(c => c.toUser?._id === user?._id && c.status === 'pending');
  const outgoing = connections.filter(c => c.fromUser?._id === user?._id);
  const accepted = connections.filter(c => c.status === 'accepted');

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <h1 className="text-xl font-bold mb-4">My Connections</h1>

      {incoming.length > 0 && (
        <div className="mb-4">
          <h2 className="font-semibold text-sm text-orange-500 mb-2">Requests for you ({incoming.length})</h2>
          <div className="space-y-2">
            {incoming.map(c => (
              <div key={c._id} className="card">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{c.fromUser?.name}</p>
                    <p className="text-xs text-gray-500">{MEET_LABEL[c.meetType]}</p>
                    {c.message && <p className="text-xs text-gray-600 mt-1 italic">"{c.message}"</p>}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button className="btn-primary text-xs px-2.5 py-1" onClick={() => updateStatus(c._id, 'accepted')}>Accept</button>
                    <button className="btn-secondary text-xs px-2.5 py-1" onClick={() => updateStatus(c._id, 'declined')}>Decline</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {accepted.length > 0 && (
        <div className="mb-4">
          <h2 className="font-semibold text-sm text-green-700 mb-2">Active meets ({accepted.length})</h2>
          <div className="space-y-2">
            {accepted.map(c => {
              const other = c.fromUser?._id === user?._id ? c.toUser : c.fromUser;
              return (
                <div key={c._id} className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{other?.name}</p>
                      <p className="text-xs text-gray-500">{MEET_LABEL[c.meetType]} · Accepted</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button className="btn-secondary text-xs px-2.5 py-1" onClick={() => nav(`/messages/dm/${other?._id}`)}>Chat</button>
                      <button className="btn-orange text-xs px-2.5 py-1" onClick={() => {
                        const r = prompt('Rate this session (1-5):');
                        if (r && Number(r) >= 1 && Number(r) <= 5) rate(c._id, Number(r));
                      }}>Rate & Complete</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {outgoing.length > 0 && (
        <div>
          <h2 className="font-semibold text-sm text-gray-500 mb-2">Sent requests</h2>
          <div className="space-y-2">
            {outgoing.map(c => (
              <div key={c._id} className="card flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{c.toUser?.name}</p>
                  <p className="text-xs text-gray-500">{MEET_LABEL[c.meetType]}</p>
                </div>
                <span className={STATUS_COLOR[c.status] || 'badge-gray'}>{c.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {connections.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">🤝</p>
          <p>No connections yet. Browse mentors to get started!</p>
        </div>
      )}
    </div>
  );
}
