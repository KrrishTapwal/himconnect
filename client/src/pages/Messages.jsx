import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { getSocket } from '../hooks/useSocket';

export default function Messages() {
  const { userId } = useParams();
  const { user: me } = useAuth();
  const nav = useNavigate();
  const [other, setOther] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const endRef = useRef(null);

  useEffect(() => {
    if (!userId) return;
    const socket = getSocket();
    if (socket) {
      socket.emit('joinDM', userId);
      socket.on('newDM', (msg) => {
        const from = msg.fromUserId?._id || msg.fromUserId;
        if (from === userId || from === me?._id) {
          setMessages(prev => [...prev, msg]);
        }
      });
    }
    Promise.all([api.get(`/users/${userId}`), api.get(`/messages/dm/${userId}`)]).then(([u, m]) => {
      setOther(u.data);
      setMessages(m.data);
    }).finally(() => setLoading(false));

    return () => { const s = getSocket(); if (s) s.off('newDM'); };
  }, [userId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const socket = getSocket();
    if (socket) {
      socket.emit('directMessage', { toUserId: userId, text });
    } else {
      try {
        const { data } = await api.post(`/messages/dm/${userId}`, { text });
        setMessages(prev => [...prev, data]);
      } catch {}
    }
    setText('');
  }

  if (!userId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-4">
        <h1 className="text-xl font-bold mb-4">Messages</h1>
        <p className="text-gray-400 text-sm text-center mt-12">
          Go to a mentor's profile and tap <strong>Message</strong> to start a conversation, or join a District Room.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col h-[calc(100vh-4rem)]">
      {/* header */}
      <div className="flex items-center gap-3 mb-3">
        <button onClick={() => nav(-1)} className="text-gray-500 hover:text-gray-800">←</button>
        {loading ? (
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
        ) : (
          <div>
            <p className="font-semibold">{other?.name}</p>
            <p className="text-xs text-gray-500">{other?.role === 'mentor' ? `${other.profession || ''} ${other.company ? `@ ${other.company}` : ''}`.trim() : other?.college}</p>
          </div>
        )}
      </div>

      {/* messages */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-3">
        {loading ? <p className="text-center text-sm text-gray-400 mt-8">Loading…</p> :
          messages.length === 0 ? (
            <p className="text-center text-sm text-gray-400 mt-12">No messages yet. Say hello!</p>
          ) : messages.map(msg => {
            const isMe = (msg.fromUserId?._id || msg.fromUserId) === me?._id;
            return (
              <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-3 py-2 rounded-xl text-sm ${isMe ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-900'}`}>
                  {msg.text}
                </div>
              </div>
            );
          })
        }
        <div ref={endRef} />
      </div>

      {/* input */}
      <form onSubmit={send} className="flex gap-2">
        <input className="input flex-1 text-sm" placeholder="Type a message…"
          value={text} onChange={e => setText(e.target.value)} maxLength={1000} />
        <button type="submit" className="btn-primary px-4" disabled={!text.trim()}>Send</button>
      </form>
    </div>
  );
}
