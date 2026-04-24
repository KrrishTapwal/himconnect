import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import JobCard from '../components/JobCard';
import CreateJobModal from '../components/CreateJobModal';

const DATE_FILTERS = [
  { key: 'any',  label: 'Any time' },
  { key: '1',    label: 'Today' },
  { key: '3',    label: 'Last 3 days' },
  { key: '7',    label: 'Last 7 days' },
  { key: '14',   label: 'Last 14 days' },
  { key: '30',   label: 'Last 30 days' },
];

const TYPE_FILTERS = [
  { key: 'any',        label: 'All types' },
  { key: 'full-time',  label: 'Full-time' },
  { key: 'part-time',  label: 'Part-time' },
  { key: 'remote',     label: 'Remote' },
  { key: 'contract',   label: 'Contract' },
  { key: 'internship', label: 'Internship' },
];

const SOURCE_FILTERS = [
  { key: 'any',       label: 'All sources' },
  { key: 'community', label: '🤝 Community' },
  { key: 'indeed',    label: '💻 Tech / Remote' },
];

const SOURCE_ICON = {
  'Remotive':     '🌐',
  'Arbeitnow':    '🏢',
  'The Muse':     '✨',
  'Adzuna India': '🇮🇳',
  'Remote OK':    '🟢',
  'Jobicy':       '💼',
};

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
      className="card border-l-4 border-l-blue-400"
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm text-gray-900 truncate">{job.title}</h3>
            <span className="badge bg-blue-50 text-blue-600 shrink-0">{SOURCE_ICON[job.source] || '💻'} {job.source || 'Tech'}</span>
            {job.jobType && <span className="badge badge-gray shrink-0 capitalize">{job.jobType}</span>}
          </div>
          <p className="text-sm text-gray-700 font-medium mt-0.5">{job.company}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {[job.location && `📍 ${job.location}`, job.salary && `💰 ${job.salary}`].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-400">{job.postedAt ? timeAgo(job.postedAt) : 'Recently posted'}</p>
        <motion.a
          href={job.applyUrl} target="_blank" rel="noreferrer" whileTap={{ scale: 0.96 }}
          className="btn-primary text-xs px-4 py-1.5"
        >
          Apply Now →
        </motion.a>
      </div>
    </motion.div>
  );
}

export default function Jobs() {
  const { user } = useAuth();
  const [allJobs, setAllJobs]         = useState([]);   // normalized merged list
  const [loading, setLoading]         = useState(true);
  const [showCreate, setShowCreate]   = useState(false);

  // filters
  const [dateFilter,   setDateFilter]   = useState('any');
  const [typeFilter,   setTypeFilter]   = useState('any');
  const [sourceFilter, setSourceFilter] = useState('any');
  const [referralOnly, setReferralOnly] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const [communityRes, indeedRes] = await Promise.allSettled([
      api.get('/jobs', { params: { limit: 100 } }),
      api.get('/jobs/external', { params: { limit: 50 } }),
    ]);

    const community = (communityRes.status === 'fulfilled' ? communityRes.value.data.jobs : []) || [];
    const indeed    = (indeedRes.status   === 'fulfilled' ? indeedRes.value.data.jobs    : []) || [];

    // Normalize into one shape, tag source, add unified _date for sorting
    const normalized = [
      ...community.map(j => ({ ...j, _source: 'community', _date: new Date(j.createdAt) })),
      ...indeed.map(j => ({ ...j, _source: 'indeed',    _date: new Date(j.postedAt || j.createdAt || Date.now()) })),
    ].sort((a, b) => b._date - a._date); // newest first

    setAllJobs(normalized);
    setLoading(false);
  }

  function onJobCreated(job) {
    setAllJobs(prev => [{ ...job, _source: 'community', _date: new Date(job.createdAt) }, ...prev]);
    setShowCreate(false);
  }

  function onInterestToggle(jobId) {
    setAllJobs(prev => prev.map(j => {
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

  const filtered = useMemo(() => {
    let list = allJobs;

    // source filter
    if (sourceFilter !== 'any') list = list.filter(j => j._source === sourceFilter);

    // referral only (community jobs only have referrals)
    if (referralOnly) list = list.filter(j => j._source === 'community' && j.referralAvailable);

    // date filter
    if (dateFilter !== 'any') {
      const cutoff = new Date(Date.now() - parseInt(dateFilter) * 24 * 60 * 60 * 1000);
      list = list.filter(j => j._date >= cutoff);
    }

    // type filter — matches community location/description keywords + indeed jobType
    if (typeFilter !== 'any') {
      list = list.filter(j => {
        const haystack = [j.jobType, j.location, j.role, j.title, j.description]
          .filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(typeFilter);
      });
    }

    return list;
  }, [allJobs, sourceFilter, referralOnly, dateFilter, typeFilter]);

  const activeFilters = [dateFilter, typeFilter, sourceFilter].filter(f => f !== 'any').length
    + (referralOnly ? 1 : 0);

  function clearAll() {
    setDateFilter('any'); setTypeFilter('any');
    setSourceFilter('any'); setReferralOnly(false);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      {/* header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">Jobs Board</h1>
          <p className="text-sm text-gray-500">{loading ? 'Loading…' : `${filtered.length} jobs found`}</p>
        </div>
        {user?.role === 'mentor' && (
          <button className="btn-primary text-sm" onClick={() => setShowCreate(true)}>+ Post Job</button>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="space-y-3 mb-5">

        {/* Date posted */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Date posted</p>
          <div className="flex gap-1.5 flex-wrap">
            {DATE_FILTERS.map(f => (
              <button key={f.key} onClick={() => setDateFilter(f.key)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${dateFilter === f.key ? 'bg-green-700 text-white border-green-700' : 'border-gray-200 text-gray-600 hover:border-green-600'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Job type */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Job type</p>
          <div className="flex gap-1.5 flex-wrap">
            {TYPE_FILTERS.map(f => (
              <button key={f.key} onClick={() => setTypeFilter(f.key)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${typeFilter === f.key ? 'bg-green-700 text-white border-green-700' : 'border-gray-200 text-gray-600 hover:border-green-600'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Source + Referral row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5 flex-wrap">
            {SOURCE_FILTERS.map(f => (
              <button key={f.key} onClick={() => setSourceFilter(f.key)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${sourceFilter === f.key ? 'bg-green-700 text-white border-green-700' : 'border-gray-200 text-gray-600 hover:border-green-600'}`}>
                {f.label}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer ml-auto">
            <input type="checkbox" checked={referralOnly} onChange={e => setReferralOnly(e.target.checked)}
              className="w-4 h-4 accent-green-700" />
            <span className="text-xs text-gray-700 font-medium whitespace-nowrap">🔗 Referral only</span>
          </label>
        </div>

        {/* Clear filters */}
        {activeFilters > 0 && (
          <button onClick={clearAll} className="text-xs text-green-700 underline underline-offset-2">
            Clear all filters ({activeFilters})
          </button>
        )}
      </div>

      {/* ── Results ── */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">💼</p>
          <p className="font-medium">No jobs match your filters</p>
          <button onClick={clearAll} className="mt-3 text-sm text-green-700 underline">Clear filters</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(job =>
            job._source === 'community'
              ? <JobCard key={job._id} job={job} currentUserId={user?._id} onInterestToggle={onInterestToggle} />
              : <IndeedJobCard key={job._id} job={job} />
          )}
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
      <div className="h-3 bg-gray-200 rounded w-2/3 mb-1" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
    </div>
  );
}
