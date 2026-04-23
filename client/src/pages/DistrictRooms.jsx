import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { getSocket } from '../hooks/useSocket';

const ROOMS = ['All HP', 'Shimla', 'Mandi', 'Kangra', 'Kullu', 'Hamirpur', 'Solan', 'Bilaspur', 'Chamba', 'Lahaul-Spiti', 'Sirmaur', 'Una', 'Kinnaur'];

export default function DistrictRooms() {
  const { user } = useAuth();
  const [activeRoom, setActiveRoom] = useState('All HP');
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const endRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      socket.emit('joinRoom', activeRoom);
      socket.on('newMessage', (msg) => {
        if (msg.roomId === activeRoom) setMessages(prev => [...prev, msg]);
      });
    }
    loadHistory();
    return () => {
      const s = getSocket();
      if (s) { s.emit('leaveRoom', activeRoom); s.off('newMessage'); }
    };
  }, [activeRoom]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadHistory() {
    setLoading(true);
    try {
      const { data } = await api.get(`/messages/${activeRoom}`);
      setMessages(data);
    } catch {}
    setLoading(false);
  }

  async function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const socket = getSocket();
    if (socket) {
      socket.emit('roomMessage', { roomId: activeRoom, text });
    } else {
      try {
        const { data } = await api.post(`/messages/${activeRoom}`, { text });
        setMessages(prev => [...prev, data]);
      } catch {}
    }
    setText('');
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col h-[calc(100vh-4rem)]">
      <h1 className="text-xl font-bold mb-3">District Rooms</h1>

      {/* room selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
        {ROOMS.map(r => (
          <button key={r} onClick={() => setActiveRoom(r)}
            className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full border transition-colors ${activeRoom === r ? 'bg-green-700 text-white border-green-700' : 'border-gray-200 text-gray-600'}`}>
            {r}
          </button>
        ))}
      </div>

      {/* messages */}
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

      {/* input */}
      <form onSubmit={send} className="flex gap-2">
        <input className="input flex-1 text-sm" placeholder={`Message #${activeRoom}…`}
          value={text} onChange={e => setText(e.target.value)} maxLength={500} />
        <button type="submit" className="btn-primary px-4" disabled={!text.trim()}>Send</button>
      </form>
    </div>
  );
}
