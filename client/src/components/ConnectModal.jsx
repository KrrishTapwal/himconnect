import { useState } from 'react';
import api from '../utils/api';

const MEET_TYPES = [
  { key: 'chai', label: '☕ Chai (15 min)', desc: 'Casual intro chat' },
  { key: 'career', label: '💼 Career (30 min)', desc: 'Career guidance & advice' },
  { key: 'mock_interview', label: '🎯 Mock Interview (60 min)', desc: 'Practice interview' }
];

export default function ConnectModal({ mentor, onClose }) {
  const [meetType, setMeetType] = useState('chai');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const defaultMsg = {
    chai: `Hi ${mentor.name}! I'm from HP too. Would love a 15-min chat to learn from your experience.`,
    career: `Hi ${mentor.name}! I'd love a 30-min career guidance session. Your journey in ${mentor.fieldOfInterest} is inspiring!`,
    mock_interview: `Hi ${mentor.name}! Can we do a mock interview? I'm preparing for ${mentor.fieldOfInterest} roles.`
  };

  async function send() {
    setLoading(true);
    try {
      await api.post('/connections', {
        toUser: mentor._id,
        meetType,
        message: message || defaultMsg[meetType]
      });
      setSent(true);
    } catch {}
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5 shadow-xl">
        {sent ? (
          <div className="text-center py-6">
            <p className="text-4xl mb-2">🎉</p>
            <p className="font-semibold text-lg">Request sent!</p>
            <p className="text-sm text-gray-500 mt-1">{mentor.name} will get notified.</p>
            <button className="btn-primary mt-4 w-full" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Request a meet with {mentor.name}</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl">×</button>
            </div>

            <div className="space-y-2 mb-4">
              {MEET_TYPES.map(mt => (
                <button key={mt.key} onClick={() => { setMeetType(mt.key); setMessage(''); }}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-colors ${meetType === mt.key ? 'border-green-700 bg-green-50' : 'border-gray-200'}`}>
                  <p className="font-medium text-sm">{mt.label}</p>
                  <p className="text-xs text-gray-500">{mt.desc}</p>
                </button>
              ))}
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 block mb-1">Message (optional)</label>
              <textarea className="input resize-none" rows={3} maxLength={300}
                placeholder={defaultMsg[meetType]}
                value={message} onChange={e => setMessage(e.target.value)} />
            </div>

            <button className="btn-primary w-full" onClick={send} disabled={loading}>
              {loading ? 'Sending…' : 'Send Request'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
