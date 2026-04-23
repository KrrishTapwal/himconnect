import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const DISTRICTS = ['Shimla', 'Mandi', 'Kangra', 'Kullu', 'Hamirpur', 'Solan', 'Bilaspur', 'Chamba', 'Lahaul-Spiti', 'Sirmaur', 'Una', 'Kinnaur'];
const FIELDS = ['CSE', 'Mechanical', 'Civil', 'Electrical', 'Medical', 'UPSC', 'JEE prep', 'NEET prep', 'MBA', 'Law', 'Arts', 'Other'];
const OPEN_TO = ['Mentorship', 'Referrals', 'Chai', 'MockInterview'];

export default function Settings() {
  const { user, logout, refreshUser } = useAuth();
  const nav = useNavigate();

  const [form, setForm] = useState({
    name: user?.name || '',
    hometownDistrict: user?.hometownDistrict || '',
    currentCity: user?.currentCity || '',
    college: user?.college || '',
    graduationYear: user?.graduationYear || '',
    profession: user?.profession || '',
    company: user?.company || '',
    fieldOfInterest: user?.fieldOfInterest || '',
    skills: user?.skills?.join(', ') || '',
    openTo: user?.openTo || [],
    bio: user?.bio || '',
    linkedinUrl: user?.linkedinUrl || '',
    meetLink: user?.meetLink || ''
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }
  function toggleOpenTo(opt) {
    setForm(f => ({
      ...f,
      openTo: f.openTo.includes(opt) ? f.openTo.filter(x => x !== opt) : [...f.openTo, opt]
    }));
  }

  async function save(e) {
    e.preventDefault();
    if (form.bio.length > 100) { setError('Bio must be 100 chars or less'); return; }
    setSaving(true); setError(''); setSaved(false);
    try {
      await api.put('/users/me', {
        ...form,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        graduationYear: form.graduationYear ? Number(form.graduationYear) : undefined
      });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    logout();
    nav('/login');
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <h1 className="text-xl font-bold mb-4">Settings</h1>
      {error && <p className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded">{error}</p>}
      {saved && <p className="text-green-700 text-sm mb-3 bg-green-50 p-2 rounded">Saved!</p>}

      <form onSubmit={save} className="space-y-4">
        <Section title="Basic info">
          <Field label="Full name">
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} />
          </Field>
          <Field label={`Bio (${form.bio.length}/100)`}>
            <textarea className="input resize-none" rows={2} maxLength={100}
              value={form.bio} onChange={e => set('bio', e.target.value)} />
          </Field>
        </Section>

        <Section title="Location">
          <Field label="Hometown district">
            <select className="input" value={form.hometownDistrict} onChange={e => set('hometownDistrict', e.target.value)}>
              <option value="">Select</option>
              {DISTRICTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Current city">
            <input className="input" value={form.currentCity} onChange={e => set('currentCity', e.target.value)} />
          </Field>
        </Section>

        <Section title="Education & Career">
          <Field label="College">
            <input className="input" value={form.college} onChange={e => set('college', e.target.value)} />
          </Field>
          <Field label="Graduation year">
            <input className="input" type="number" min={2015} max={2030} value={form.graduationYear} onChange={e => set('graduationYear', e.target.value)} />
          </Field>
          {user?.role === 'mentor' && (
            <>
              <Field label="Profession">
                <input className="input" value={form.profession} onChange={e => set('profession', e.target.value)} />
              </Field>
              <Field label="Company">
                <input className="input" value={form.company} onChange={e => set('company', e.target.value)} />
              </Field>
            </>
          )}
          <Field label="Field of interest">
            <select className="input" value={form.fieldOfInterest} onChange={e => set('fieldOfInterest', e.target.value)}>
              <option value="">Select</option>
              {FIELDS.map(f => <option key={f}>{f}</option>)}
            </select>
          </Field>
          <Field label="Skills (comma-separated)">
            <input className="input" placeholder="React, DSA, Python" value={form.skills} onChange={e => set('skills', e.target.value)} />
          </Field>
        </Section>

        <Section title="Availability">
          <div className="flex flex-wrap gap-2">
            {OPEN_TO.map(opt => (
              <button key={opt} type="button" onClick={() => toggleOpenTo(opt)}
                className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${form.openTo.includes(opt) ? 'bg-green-700 text-white border-green-700' : 'border-gray-300 text-gray-600'}`}>
                {opt === 'MockInterview' ? 'Mock Interview' : opt}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Links">
          <Field label="LinkedIn URL">
            <input className="input" type="url" value={form.linkedinUrl} onChange={e => set('linkedinUrl', e.target.value)} />
          </Field>
          {user?.role === 'mentor' && (
            <Field label="Zoom/Meet link">
              <input className="input" type="url" value={form.meetLink} onChange={e => set('meetLink', e.target.value)} />
            </Field>
          )}
        </Section>

        <button type="submit" className="btn-primary w-full" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <button onClick={handleLogout} className="w-full py-2 text-red-500 text-sm font-medium hover:bg-red-50 rounded-lg transition-colors">
          Sign out
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="card">
      <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
      {children}
    </div>
  );
}
