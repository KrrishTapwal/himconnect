import { useState } from 'react';
import api from '../utils/api';

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function JobCard({ job, currentUserId, onInterestToggle }) {
  const [interested, setInterested] = useState(job.interestedUsers?.includes(currentUserId));
  const [count, setCount] = useState(job.interestedUsers?.length || 0);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (loading || !currentUserId) return;
    setLoading(true);
    try {
      const { data } = await api.post(`/jobs/${job._id}/interested`);
      setInterested(data.interested);
      setCount(data.count);
      onInterestToggle?.(job._id, data.interested, data.count);
    } catch {}
    setLoading(false);
  }

  const poster = job.postedBy;
  const deadline = job.deadline ? new Date(job.deadline) : null;
  const isExpired = deadline && deadline < new Date();

  return (
    <div className={`card ${isExpired ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm">{job.role}</h3>
            {job.referralAvailable && <span className="badge-orange">🔗 Referral</span>}
            {isExpired && <span className="badge-gray">Expired</span>}
          </div>
          <p className="text-sm text-gray-700">{job.company}</p>
          <p className="text-xs text-gray-500">
            {[job.location && `📍 ${job.location}`, job.salary && `💰 ${job.salary}`].filter(Boolean).join(' · ')}
          </p>
          {job.description && <p className="text-xs text-gray-600 mt-1">{job.description}</p>}
        </div>
      </div>

      {/* skills */}
      {job.skillsRequired?.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mt-2">
          {job.skillsRequired.map(s => <span key={s} className="badge-gray">{s}</span>)}
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-500">
            Posted by <span className="text-green-700 font-medium">{poster?.name}</span>
            {poster?.hometownDistrict && ` · ${poster.hometownDistrict}`}
          </p>
          <p className="text-xs text-gray-400">{timeAgo(job.createdAt)}{deadline && ` · Deadline: ${deadline.toLocaleDateString()}`}</p>
        </div>
        <button
          onClick={toggle}
          disabled={loading || isExpired || !currentUserId}
          className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${interested ? 'bg-green-50 text-green-700 border border-green-700' : 'btn-primary'}`}>
          {interested ? `✓ Interested (${count})` : `I'm Interested (${count})`}
        </button>
      </div>
    </div>
  );
}
