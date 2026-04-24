import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const DISTRICTS = ['Shimla', 'Mandi', 'Kangra', 'Kullu', 'Hamirpur', 'Solan', 'Bilaspur', 'Chamba', 'Lahaul-Spiti', 'Sirmaur', 'Una', 'Kinnaur'];
const FIELDS = [
  'Class 10 Boards', 'Class 12 (PCM)', 'Class 12 (PCB)', 'Class 12 (Commerce)', 'Class 12 (Arts)',
  'JEE prep', 'NEET prep', 'CSE', 'Mechanical', 'Civil', 'Electrical', 'Medical',
  'UPSC', 'MBA', 'Law', 'Arts', 'Other'
];
const OPEN_TO = ['Mentorship', 'Referrals', 'Chai', 'MockInterview'];

const STEPS = ['Role', 'Background', 'Interests', 'Profile'];

export default function Onboarding() {
  const { user, refreshUser } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    role: user?.role || 'student',
    hometownDistrict: '',
    currentCity: '',
    college: '',
    graduationYear: '',
    profession: '',
    company: '',
    fieldOfInterest: '',
    skills: '',
    openTo: [],
    bio: '',
    linkedinUrl: '',
    meetLink: ''
  });
  const [customField, setCustomField] = useState('');

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  function toggleOpenTo(opt) {
    setForm(f => ({
      ...f,
      openTo: f.openTo.includes(opt) ? f.openTo.filter(x => x !== opt) : [...f.openTo, opt]
    }));
  }

  async function finish() {
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        fieldOfInterest: form.fieldOfInterest === 'Other' ? (customField.trim() || 'Other') : form.fieldOfInterest,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        graduationYear: form.graduationYear ? Number(form.graduationYear) : undefined,
        onboardingComplete: true
      };
      await api.put('/users/me', payload);
      await refreshUser();
      nav('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-green-700">Welcome to HimConnect!</h1>
          <p className="text-gray-500 text-sm mt-1">Let's set up your profile (takes 2 min)</p>
        </div>

        {/* progress */}
        <div className="flex gap-1 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className={`flex-1 h-1.5 rounded-full ${i <= step ? 'bg-green-700' : 'bg-gray-200'}`} />
          ))}
        </div>

        <div className="card">
          {error && <p className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded">{error}</p>}

          {/* Step 0: Role */}
          {step === 0 && (
            <div>
              <h2 className="font-semibold text-lg mb-4">I am a…</h2>
              <div className="grid grid-cols-2 gap-3">
                {['student', 'mentor'].map(r => (
                  <button key={r} onClick={() => set('role', r)}
                    className={`p-4 rounded-xl border-2 font-medium capitalize transition-colors ${form.role === r ? 'border-green-700 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'}`}>
                    {r === 'student' ? '🎓 Student / Learner' : '🧑‍💼 Mentor / Senior'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                {form.role === 'student'
                  ? 'School student, college student, exam aspirant, job seeker — anyone learning or growing'
                  : 'Already placed, cracked an exam, or have experience — willing to give back to HP community'}
              </p>
            </div>
          )}

          {/* Step 1: Background */}
          {step === 1 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-lg mb-1">Your background</h2>
              <p className="text-xs text-gray-400 mb-2">All fields are optional — fill what applies to you</p>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Hometown district in HP</label>
                <select className="input" value={form.hometownDistrict} onChange={e => set('hometownDistrict', e.target.value)}>
                  <option value="">Select district (optional)</option>
                  {DISTRICTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Current city <span className="text-gray-400 font-normal">(optional)</span></label>
                <input className="input" placeholder="e.g. Shimla, Chandigarh, Delhi…" value={form.currentCity} onChange={e => set('currentCity', e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">School / College / Institution <span className="text-gray-400 font-normal">(optional)</span></label>
                <input className="input" placeholder="e.g. GSSS Shimla, NIT Hamirpur, IIT Delhi…" value={form.college} onChange={e => set('college', e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Passing / Graduation year <span className="text-gray-400 font-normal">(optional)</span></label>
                <input className="input" type="number" placeholder="e.g. 2025, 2027…" min={2020} max={2035} value={form.graduationYear} onChange={e => set('graduationYear', e.target.value)} />
              </div>
              {form.role === 'mentor' && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Profession / Role <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input className="input" placeholder="e.g. SDE-2, IAS Officer, Doctor" value={form.profession} onChange={e => set('profession', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Company / Organisation <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input className="input" placeholder="e.g. Google, AIIMS Delhi, Self-employed" value={form.company} onChange={e => set('company', e.target.value)} />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 2: Interests */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg mb-2">Your field & interests</h2>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Field of interest</label>
                <select className="input" value={form.fieldOfInterest} onChange={e => { set('fieldOfInterest', e.target.value); setCustomField(''); }}>
                  <option value="">Select field</option>
                  {FIELDS.map(f => <option key={f}>{f}</option>)}
                </select>
                {form.fieldOfInterest === 'Other' && (
                  <input className="input mt-2" placeholder="Type your field (e.g. BCA, Hotel Management, Nursing…)"
                    value={customField} onChange={e => setCustomField(e.target.value)} autoFocus />
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Skills (comma-separated)</label>
                <input className="input" placeholder="e.g. React, DSA, Python" value={form.skills} onChange={e => set('skills', e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Open to (select all that apply)</label>
                <div className="flex flex-wrap gap-2">
                  {OPEN_TO.map(opt => (
                    <button key={opt} type="button" onClick={() => toggleOpenTo(opt)}
                      className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${form.openTo.includes(opt) ? 'bg-green-700 text-white border-green-700' : 'border-gray-300 text-gray-600'}`}>
                      {opt === 'MockInterview' ? 'Mock Interview' : opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Profile */}
          {step === 3 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-lg mb-2">Your profile</h2>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Bio <span className="text-gray-400">({form.bio.length}/100)</span>
                </label>
                <textarea className="input resize-none" rows={2} maxLength={100} placeholder="e.g. HP boy @ Google. Happy to help CSE folks!"
                  value={form.bio} onChange={e => set('bio', e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">LinkedIn URL (optional)</label>
                <input className="input" type="url" placeholder="https://linkedin.com/in/yourname"
                  value={form.linkedinUrl} onChange={e => set('linkedinUrl', e.target.value)} />
              </div>
              {form.role === 'mentor' && (
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Zoom/Meet link (optional)</label>
                  <input className="input" type="url" placeholder="https://meet.google.com/xxx"
                    value={form.meetLink} onChange={e => set('meetLink', e.target.value)} />
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between mt-6">
            <button className="btn-secondary" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>
              Back
            </button>
            {step < STEPS.length - 1 ? (
              <button className="btn-primary" onClick={() => setStep(s => s + 1)}>Next</button>
            ) : (
              <button className="btn-primary" onClick={finish} disabled={saving}>
                {saving ? 'Saving…' : 'Finish & Enter'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
