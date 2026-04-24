import { useState } from 'react';
import api from '../utils/api';

const TYPES = [
  { key: 'tip', label: '💡 Tip' },
  { key: 'question', label: '❓ Question' },
  { key: 'job_crack', label: '💼 Job Win' },
  { key: 'exam_crack', label: '🎓 Exam Win' },
  { key: 'story', label: '📖 Story' }
];

export default function CreatePostModal({ onClose, onCreated }) {
  const [type, setType] = useState('tip');
  const [form, setForm] = useState({ title: '', body: '', imageUrl: '', youtubeLink: '', examName: '', rank: '', collegeCracked: '', companyName: '', role: '', salary: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    if (!form.title) { setError('Title is required'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/posts', { type, ...form });
      onCreated(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Share something</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl">×</button>
        </div>

        {error && <p className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded">{error}</p>}

        {/* type picker */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {TYPES.map(t => (
            <button key={t.key} onClick={() => setType(t.key)}
              className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full border transition-colors ${type === t.key ? 'bg-green-700 text-white border-green-700' : 'border-gray-200 text-gray-600'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Title</label>
            <input className="input" maxLength={150} placeholder="Catchy title..." value={form.title} onChange={e => set('title', e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Body <span className="text-gray-400 font-normal">(optional · {form.body.length}/500)</span>
            </label>
            <textarea className="input resize-none" rows={4} maxLength={500}
              placeholder="Share your experience, tip or question..." value={form.body} onChange={e => set('body', e.target.value)} />
          </div>

          {type === 'exam_crack' && (
            <div className="grid grid-cols-3 gap-2">
              <input className="input col-span-3" placeholder="Exam name" value={form.examName} onChange={e => set('examName', e.target.value)} />
              <input className="input" placeholder="Rank / score" value={form.rank} onChange={e => set('rank', e.target.value)} />
              <input className="input col-span-2" placeholder="College cracked" value={form.collegeCracked} onChange={e => set('collegeCracked', e.target.value)} />
            </div>
          )}

          {type === 'job_crack' && (
            <div className="grid grid-cols-3 gap-2">
              <input className="input col-span-2" placeholder="Company" value={form.companyName} onChange={e => set('companyName', e.target.value)} />
              <input className="input" placeholder="Salary" value={form.salary} onChange={e => set('salary', e.target.value)} />
              <input className="input col-span-3" placeholder="Role" value={form.role} onChange={e => set('role', e.target.value)} />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Photo link (optional)</label>
            <input className="input" type="url" placeholder="https://i.imgur.com/... or any image URL"
              value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)} />
            <p className="text-xs text-gray-400 mt-1">Paste a direct image link (ends with .jpg / .png / .webp etc.)</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">YouTube link (optional)</label>
            <input className="input" type="url" placeholder="https://youtube.com/..." value={form.youtubeLink} onChange={e => set('youtubeLink', e.target.value)} />
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Posting…' : 'Post'}
          </button>
        </form>
      </div>
    </div>
  );
}
