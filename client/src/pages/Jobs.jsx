import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import JobCard from '../components/JobCard';
import CreateJobModal from '../components/CreateJobModal';

const INDEED_CATS = [
  { key: 'all', label: '🌐 All' },
  { key: 'tech', label: '💻 Tech' },
  { key: 'local', label: '📍 Chandigarh Belt' },
  { key: 'remote', label: '🏠 Remote' },
  { key: 'govt', label: '🏛️ Govt' },
  { key: 'finance', label: '💰 Finance' },
];

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function IndeedJobCard({ job }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="card border-l-4 border-l-blue-500"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm text-gray-900 truncate">{job.title}</h3>
            <span className="badge bg-blue-50 text-blue-600 text-xs shrink-0">Indeed</span>
            {job.jobType && <span className="badge-gray shrink-0">{job.jobType}</span>}
          </div>
          <p className="text-sm text-gray-700 font-medium mt-0.5">{job.company}</p>
          <p className="text-xs text-gray-500">
            {[job.location && `📍 ${job.location}`, job.salary && `💰 ${job.salary}`].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-400">{job.postedAt ? timeAgo(job.postedAt) : 'Recently posted'}</p>
        <motion.a
          href={job.applyUrl}
          target="_blank"
          rel="noreferrer"
          whileTap={{ scale: 0.96 }}
          className="btn-primary text-xs px-4 py-1.5"
        >
          Apply on Indeed →
        </motion.a>
      </div>
    </motion.div>
  );
}

export default function Jobs() {
  const { user } = useAuth();
  const [tab, setTab] = useState('community');
  const [jobs, setJobs] = useState([]);
  const [indeedJobs, setIndeedJobs] = useState([]);
  const [indeedCat, setIndeedCat] = useState('all');
  const [loading, setLoading] = useState(true);
  const [referralOnly, setReferralOnly] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (tab === 'community') loadJobs();
    else loadIndeedJobs();
  }, [tab, referralOnly, indeedCat]);

  async function loadJobs() {
    setLoading(true);
    try {
      const params = {};
      if (referralOnly) params.referral = 'true';
      const { data } = await api.get('/jobs', { params });
      setJobs(data.jobs);
    } catch {}
    setLoading(false);
  }

  async function loadIndeedJobs() {
    setLoading(true);
    try {
      const params = { limit: 30 };
      if (indeedCat !== 'all') params.category = indeedCat;
      const { data } = await api.get('/jobs/external', { params });
      setIndeedJobs(data.jobs);
    } catch {}
    setLoading(false);
  }

  function onJobCreated(job) {
    setJobs(prev => [job, ...prev]);
    setShowCreate(false);
  }

  function onInterestToggle(jobId, interested, count) {
    setJobs(prev => prev.map(j => j._id === jobId
      ? { ...j, interestedUsers: interested ? [...(j.interestedUsers || []), user._id] : (j.interestedUsers || []).filter(id => id !== user._id) }
      : j
    ));
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">Jobs Board</h1>
          <p className="text-sm text-gray-500">Community referrals + live Indeed listings</p>
        </div>
        {user?.role === 'mentor' && tab === 'community' && (
          <button className="btn-primary text-sm" onClick={() => setShowCreate(true)}>+ Post Job</button>
        )}
      </div>

      {/* main tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('community')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${tab === 'community' ? 'bg-green-700 text-white border-green-700' : 'border-gray-200 text-gray-600'}`}
        >
          🤝 Community Jobs
        </button>
        <button
          onClick={() => setTab('indeed')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${tab === 'indeed' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600'}`}
        >
          🔍 Indeed Listings
        </button>
      </div>

      {tab === 'community' && (
        <>
          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input type="checkbox" checked={referralOnly} onChange={e => setReferralOnly(e.target.checked)}
              className="w-4 h-4 accent-green-700" />
            <span className="text-sm text-gray-700 font-medium">Referral available only</span>
          </label>

          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <SkeletonCard key={i} />)}</div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-2">💼</p>
              <p>No jobs posted yet. HP mentors, post yours!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map(job => (
                <JobCard key={job._id} job={job} currentUserId={user?._id} onInterestToggle={onInterestToggle} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'indeed' && (
        <>
          {/* category filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            {INDEED_CATS.map(c => (
              <button key={c.key} onClick={() => setIndeedCat(c.key)}
                className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full border transition-colors ${indeedCat === c.key ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600'}`}>
                {c.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <SkeletonCard key={i} />)}</div>
          ) : indeedJobs.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-2">🔍</p>
              <p className="font-medium mb-1">No Indeed jobs yet</p>
              <p className="text-sm">Jobs sync daily at 6 AM. Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {indeedJobs.map(job => (
                <IndeedJobCard key={job._id} job={job} />
              ))}
            </div>
          )}
          <p className="text-xs text-center text-gray-400 mt-4">Jobs sourced from Indeed · Updated daily · Auto-removed after 30 days</p>
        </>
      )}

      {showCreate && <CreateJobModal onClose={() => setShowCreate(false)} onCreated={onJobCreated} />}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-2/3" />
    </div>
  );
}
