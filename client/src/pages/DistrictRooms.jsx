import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const ROOMS = ['All HP', 'Shimla', 'Mandi', 'Kangra', 'Kullu', 'Hamirpur', 'Solan', 'Bilaspur', 'Chamba', 'Lahaul-Spiti', 'Sirmaur', 'Una', 'Kinnaur'];

export default function DistrictRooms() {
  const { user } = useAuth();
  const [activeRoom, setActiveRoom] = useState('All HP');
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
    loadHistory();
    return () => clearInterval(pollRef.current);
  }, [activeRoom]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadHistory() {
    setLoading(true);
    try {
      const { data } = await api.get(`/messages/${encodeURIComponent(activeRoom)}`);
      setMessages(data);
      if (data.length > 0) lastTimestampRef.current = data[data.length - 1].createdAt;
    } catch {}
    setLoading(false);
    clearInterval(pollRef.current);
    pollRef.current = setInterval(pollNew, 3000);
  }

  async function pollNew() {
    try {
      const since = lastTimestampRef.current;
      const url = since
        ? `/messages/${encodeURIComponent(activeRoom)}?since=${encodeURIComponent(since)}`
        : `/messages/${encodeURIComponent(activeRoom)}`;
      const { data } = await api.get(url);
      if (data.length > 0) {
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m._id));
          const fresh = data.filter(m => !existingIds.has(m._id));
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
      const { data } = await api.post(`/messages/${encodeURIComponent(activeRoom)}`, { text: body });
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m._id));
        return existingIds.has(data._id) ? prev : [...prev, data];
      });
      lastTimestampRef.current = data.createdAt;
    } catch {
      setText(body);
    }
    setSending(false);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col h-[calc(100vh-4rem)]">
      <h1 className="text-xl font-bold mb-3">District Rooms</h1>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
        {ROOMS.map(r => (
          <button key={r} onClick={() => setActiveRoom(r)}
            className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full border transition-colors ${activeRoom === r ? 'bg-green-700 text-white border-green-700' : 'border-gray-200 text-gray-600'}`}>
            {r}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 mb-3">
        {loading ? (
          <p className="text-center text-gray-400 text-sm mt-8">Loading…</p>
        ) : messages.length === 0 ? (
          <div className="text-center mt-12 text-gray-400">
            <p className="text-3xl mb-2">🏔️</p>
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.fromUserId?._id === user?._id || msg.fromUserId === user?._id;
            return (
              <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-3 py-2 rounded-xl text-sm ${isMe ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-900'}`}>
                  {!isMe && (
                    <p className="text-xs font-semibold mb-0.5 text-green-700">
                      {msg.fromUserId?.name} · {msg.fromUserId?.hometownDistrict}
                    </p>
                  )}
                  <p>{msg.text}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="flex gap-2">
        <input className="input flex-1 text-sm" placeholder={`Message #${activeRoom}…`}
          value={text} onChange={e => setText(e.target.value)} maxLength={500} />
        <button type="submit" className="btn-primary px-4" disabled={!text.trim() || sending}>
          {sending ? '…' : 'Send'}
        </button>
      </form>
    </div>
  );
}
