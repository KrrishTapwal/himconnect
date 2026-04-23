import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function Avatar({ name, size = 'md' }) {
  const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-11 h-11 text-sm';
  return (
    <div className={`${sz} bg-gradient-to-br from-green-600 to-green-800 rounded-full flex items-center justify-center text-white font-bold shrink-0`}>
      {initials}
    </div>
  );
}

// ── Inbox (conversation list) ─────────────────────────────────────────────────
function Inbox() {
  const { user: me } = useAuth();
  const nav = useNavigate();
  const [convos, setConvos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/messages/conversations')
      .then(({ data }) => setConvos(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <h1 className="text-xl font-bold mb-4">Messages</h1>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3 items-center p-3 animate-pulse">
              <div className="w-11 h-11 bg-gray-200 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : convos.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">💬</p>
          <p className="font-medium text-gray-600 mb-1">No messages yet</p>
          <p className="text-sm">Go to a mentor's profile and tap <strong>Message</strong> to start a conversation.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 -mx-4">
          {convos.map((c, i) => {
            const isMe = c.lastFrom?.toString() === me?._id;
            return (
              <motion.button
                key={c._id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                onClick={() => nav(`/messages/dm/${c.user._id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <Avatar name={c.user.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm text-gray-900 truncate">{c.user.name}</p>
                    <p className="text-xs text-gray-400 shrink-0">{timeAgo(c.lastAt)}</p>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {isMe ? <span className="text-gray-400">You: </span> : null}
                    {c.lastText}
                  </p>
                  <p className="text-xs text-gray-400">
                    {c.user.role === 'mentor'
                      ? [c.user.profession, c.user.company && `@ ${c.user.company}`].filter(Boolean).join(' ')
                      : c.user.college || c.user.hometownDistrict || ''}
                  </p>
                </div>
                <span className="text-gray-300 text-sm shrink-0">›</span>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Chat thread ───────────────────────────────────────────────────────────────
function ChatThread({ userId }) {
  const { user: me } = useAuth();
  const nav = useNavigate();
  const [other, setOther] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);
  const lastTimestampRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    setMessages([]);
    lastTimestampRef.current = null;
    clearInterval(pollRef.current);

    Promise.all([api.get(`/users/${userId}`), api.get(`/messages/dm/${userId}`)]).then(([u, m]) => {
      setOther(u.data);
      setMessages(m.data);
      if (m.data.length > 0) lastTimestampRef.current = m.data[m.data.length - 1].createdAt;
    }).finally(() => {
      setLoading(false);
      pollRef.current = setInterval(pollNew, 3000);
    });

    return () => clearInterval(pollRef.current);
  }, [userId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function pollNew() {
    try {
      const since = lastTimestampRef.current;
      const url = since ? `/messages/dm/${userId}?since=${encodeURIComponent(since)}` : `/messages/dm/${userId}`;
      const { data } = await api.get(url);
      if (data.length > 0) {
        setMessages(prev => {
          const ids = new Set(prev.map(m => m._id));
          const fresh = data.filter(m => !ids.has(m._id));
          return fresh.length > 0 ? [...prev, ...fresh] : prev;
        });
        lastTimestampRef.current = data[data.length - 1].createdAt;
      }
    } catch {}
  }

  async function send(e) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    const body = text.trim();
    setText('');
    try {
      const { data } = await api.post(`/messages/dm/${userId}`, { text: body });
      setMessages(prev => {
        const ids = new Set(prev.map(m => m._id));
        return ids.has(data._id) ? prev : [...prev, data];
      });
      lastTimestampRef.current = data.createdAt;
    } catch { setText(body); }
    setSending(false);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col h-[calc(100vh-4rem)]">
      {/* header */}
      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
        <button onClick={() => nav('/messages')} className="text-gray-500 hover:text-gray-800 text-lg">←</button>
        {loading ? (
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
        ) : (
          <>
            <Avatar name={other?.name} size="sm" />
            <div>
              <p className="font-semibold text-sm">{other?.name}</p>
              <p className="text-xs text-gray-500">
                {other?.role === 'mentor'
                  ? [other.profession, other.company && `@ ${other.company}`].filter(Boolean).join(' ')
                  : other?.college}
              </p>
            </div>
          </>
        )}
      </div>

      {/* messages */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-3 px-1">
        {loading ? (
          <p className="text-center text-sm text-gray-400 mt-8">Loading…</p>
        ) : messages.length === 0 ? (
          <div className="text-center mt-16 text-gray-400">
            <Avatar name={other?.name} size="md" />
            <p className="mt-3 font-medium text-gray-700">{other?.name}</p>
            <p className="text-sm mt-1">No messages yet. Say hello!</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map(msg => {
              const isMe = (msg.fromUserId?._id || msg.fromUserId) === me?._id;
              return (
                <motion.div
                  key={msg._id}
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs px-3 py-2 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-green-700 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'}`}>
                    {msg.text}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={endRef} />
      </div>

      {/* input */}
      <form onSubmit={send} className="flex gap-2 items-center">
        <input
          className="input flex-1 text-sm rounded-full px-4"
          placeholder="Type a message…"
          value={text}
          onChange={e => setText(e.target.value)}
          maxLength={1000}
        />
        <motion.button
          type="submit"
          whileTap={{ scale: 0.92 }}
          disabled={!text.trim() || sending}
          className="w-10 h-10 bg-green-700 rounded-full flex items-center justify-center text-white disabled:opacity-40 shrink-0 shadow-sm"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 translate-x-0.5">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </motion.button>
      </form>
    </div>
  );
}

// ── Router ────────────────────────────────────────────────────────────────────
export default function Messages() {
  const { userId } = useParams();
  return userId ? <ChatThread userId={userId} /> : <Inbox />;
}
