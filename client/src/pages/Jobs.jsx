import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import JobCard from '../components/JobCard';
import CreateJobModal from '../components/CreateJobModal';

export default function Jobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [referralOnly, setReferralOnly] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadJobs();
  }, [referralOnly]);

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
          <p className="text-sm text-gray-500">Posted by HP seniors with referrals</p>
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
