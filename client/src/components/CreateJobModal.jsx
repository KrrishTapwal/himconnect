import { useState } from 'react';
import api from '../utils/api';

export default function CreateJobModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ role: '', company: '', location: '', salary: '', skillsRequired: '', referralAvailable: false, deadline: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    setError('');

    // Validate role & company length
    if (form.role.trim().length < 3) return setError('Role must be at least 3 characters.');
    if (form.company.trim().length < 2) return setError('Company name must be at least 2 characters.');

    // Salary: must be a reasonable string (not a huge raw number)
    if (form.salary && /^\d+$/.test(form.salary.trim()) && Number(form.salary) > 10000000) {
      return setError('Please enter salary as a readable value like "60,000/month" or "8 LPA".');
    }

    // Deadline must be a future date
    if (form.deadline) {
      const dl = new Date(form.deadline);
      if (isNaN(dl.getTime()) || dl < new Date()) {
        return setError('Deadline must be a future date.');
      }
    }

    // Description minimum if provided
    if (form.description && form.description.trim().length > 0 && form.description.trim().length < 10) {
      return setError('Description is too short — add at least a sentence, or leave it blank.');
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        role: form.role.trim(),
        company: form.company.trim(),
        skillsRequired: form.skillsRequired.split(',').map(s => s.trim()).filter(Boolean),
        deadline: form.deadline || undefined
      };
      const { data } = await api.post('/jobs', payload);
      onCreated(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Post a job</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl">×</button>
        </div>

        {error && <p className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded">{error}</p>}

        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 block mb-1">Role / Position *</label>
              <input className="input" placeholder="e.g. SDE Intern" value={form.role} onChange={e => set('role', e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Company *</label>
              <input className="input" placeholder="e.g. Flipkart" value={form.company} onChange={e => set('company', e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Location</label>
              <input className="input" placeholder="Bangalore" value={form.location} onChange={e => set('location', e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Salary / Stipend</label>
              <input className="input" placeholder="e.g. 60k/month" value={form.salary} onChange={e => set('salary', e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Deadline</label>
              <input className="input" type="date" value={form.deadline} min={new Date().toISOString().split('T')[0]} onChange={e => set('deadline', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Skills required (comma-separated)</label>
            <input className="input" placeholder="React, Node.js, DSA" value={form.skillsRequired} onChange={e => set('skillsRequired', e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Description (optional)</label>
            <textarea className="input resize-none" rows={2} maxLength={500}
              placeholder="Any extra info about the role..." value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-green-700"
              checked={form.referralAvailable} onChange={e => set('referralAvailable', e.target.checked)} />
            <span className="text-sm font-medium text-gray-700">I can provide a referral for this role</span>
          </label>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Posting…' : 'Post Job'}
          </button>
        </form>
      </div>
    </div>
  );
}
