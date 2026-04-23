import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import MentorCard from '../components/MentorCard';

const DISTRICTS = ['', 'Shimla', 'Mandi', 'Kangra', 'Kullu', 'Hamirpur', 'Solan', 'Bilaspur', 'Chamba', 'Lahaul-Spiti', 'Sirmaur', 'Una', 'Kinnaur'];
const FIELDS = ['', 'CSE', 'Mechanical', 'Civil', 'Electrical', 'Medical', 'UPSC', 'JEE prep', 'NEET prep', 'MBA', 'Law', 'Arts', 'Other'];

export default function Mentors() {
  const nav = useNavigate();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ field: '', district: '' });

  useEffect(() => {
    loadMentors();
  }, [filters]);

  async function loadMentors() {
    setLoading(true);
    try {
      const params = { role: 'mentor', limit: 30 };
      if (filters.field) params.field = filters.field;
      if (filters.district) params.district = filters.district;
      const { data } = await api.get('/users', { params });
      setMentors(data.users);
    } catch {}
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <h1 className="text-xl font-bold mb-1">Find Mentors</h1>
      <p className="text-sm text-gray-500 mb-4">HP seniors who've been there, done that</p>

      {/* filters */}
      <div className="flex gap-2 mb-4">
        <select className="input text-sm flex-1" value={filters.field} onChange={e => setFilters(f => ({ ...f, field: e.target.value }))}>
          <option value="">All fields</option>
          {FIELDS.filter(Boolean).map(f => <option key={f}>{f}</option>)}
        </select>
        <select className="input text-sm flex-1" value={filters.district} onChange={e => setFilters(f => ({ ...f, district: e.target.value }))}>
          <option value="">All districts</option>
          {DISTRICTS.filter(Boolean).map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="grid gap-3">{[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}</div>
      ) : mentors.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">🔍</p>
          <p>No mentors found for this filter</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {mentors.map(m => (
            <MentorCard key={m._id} mentor={m} onClick={() => nav(`/profile/${m._id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="flex gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-gray-200 rounded w-1/3" />
          <div className="h-3 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    </div>
  );
}
