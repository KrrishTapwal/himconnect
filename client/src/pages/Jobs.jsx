import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import JobCard from '../components/JobCard';
import CreateJobModal from '../components/CreateJobModal';

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
            {job.jobType && <span className="badge badge-gray shrink-0">{job.jobType}</span>}
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
  const [communityJobs, setCommunityJobs] = useState([]);
  const [indeedJobs, setIndeedJobs]       = useState([]);
  const [loading, setLoading]             = useState(true);
  const [referralOnly, setReferralOnly]   = useState(false);
  const [showCreate, setShowCreate]       = useState(false);

  useEffect(() => { loadAll(); }, [referralOnly]);

  async function loadAll() {
    setLoading(true);
    try {
      const params = {};
      if (referralOnly) params.referral = 'true';
      const [communityRes, indeedRes] = await Promise.allSettled([
        api.get('/jobs', { params }),
        api.get('/jobs/external', { params: { limit: 30 } }),
      ]);
      if (communityRes.status === 'fulfilled') setCommunityJobs(communityRes.value.data.jobs || []);
      if (indeedRes.status   === 'fulfilled') setIndeedJobs(indeedRes.value.data.jobs || []);
    } catch {}
    setLoading(false);
  }

  function onJobCreated(job) {
    setCommunityJobs(prev => [job, ...prev]);
    setShowCreate(false);
  }

  function onInterestToggle(jobId) {
    setCommunityJobs(prev => prev.map(j => {
      if (j._id !== jobId) return j;
      const already = (j.interestedUsers || []).includes(user._id);
      return {
        ...j,
        interestedUsers: already
          ? (j.interestedUsers || []).filter(id => id !== user._id)
          : [...(j.interestedUsers || []), user._id],
      };
    }));
  }

  // Merge: community jobs first, then Indeed jobs (filtered by referralOnly already from API)
  const visibleIndeed = referralOnly ? [] : indeedJobs;

  const totalCount = communityJobs.length + visibleIndeed.length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      {/* header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">Jobs Board</h1>
          <p className="text-sm text-gray-500">Community referrals + live listings</p>
        </div>
        {user?.role === 'mentor' && (
          <button className="btn-primary text-sm" onClick={() => setShowCreate(true)}>+ Post Job</button>
        )}
      </div>

      {/* filter */}
      <label className="flex items-center gap-2 mb-4 cursor-pointer">
        <input type="checkbox" checked={referralOnly} onChange={e => setReferralOnly(e.target.checked)}
          className="w-4 h-4 accent-green-700" />
        <span className="text-sm text-gray-700 font-medium">Referral available only</span>
      </label>

      {/* list */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <SkeletonCard key={i} />)}</div>
      ) : totalCount === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">💼</p>
          <p>No jobs posted yet. HP mentors, post yours!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {communityJobs.map(job => (
            <JobCard key={job._id} job={job} currentUserId={user?._id} onInterestToggle={onInterestToggle} />
          ))}
          {visibleIndeed.map(job => (
            <IndeedJobCard key={job._id} job={job} />
          ))}
        </div>
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
