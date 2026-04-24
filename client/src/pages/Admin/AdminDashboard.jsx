import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const TABS = ['Overview', 'Users', 'Posts', 'Jobs'];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('Overview');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-green-700 text-white px-6 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold">HimConnect</span>
          <span className="text-green-200 text-sm font-medium px-2 py-0.5 bg-green-800 rounded">Admin Panel</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-green-100">{user?.email}</span>
          <button
            onClick={logout}
            className="text-sm bg-green-800 hover:bg-green-900 px-3 py-1.5 rounded-lg transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Tab nav */}
      <div className="bg-white border-b border-gray-100 px-6">
        <div className="flex gap-1">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? 'border-green-700 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {tab === 'Overview' && <OverviewTab />}
        {tab === 'Users'    && <UsersTab />}
        {tab === 'Posts'    && <PostsTab />}
        {tab === 'Jobs'     && <JobsTab />}
      </main>
    </div>
  );
}

/* ── Overview ────────────────────────────────────────────────────────────────── */
function OverviewTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats').then(r => { setStats(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const cards = [
    { label: 'Total Users',   value: stats?.totalUsers,   color: 'bg-blue-50 text-blue-700',   icon: '👥' },
    { label: 'Students',      value: stats?.students,     color: 'bg-green-50 text-green-700', icon: '🎓' },
    { label: 'Mentors',       value: stats?.mentors,      color: 'bg-purple-50 text-purple-700', icon: '🧑‍🏫' },
    { label: 'Posts',         value: stats?.posts,        color: 'bg-orange-50 text-orange-600', icon: '📝' },
    { label: 'Jobs Posted',   value: stats?.jobs,         color: 'bg-yellow-50 text-yellow-700', icon: '💼' },
    { label: 'Connections',   value: stats?.connections,  color: 'bg-pink-50 text-pink-700',   icon: '🤝' },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Platform Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map(c => (
          <div key={c.label} className={`card ${c.color}`}>
            <div className="text-2xl mb-1">{c.icon}</div>
            <div className="text-3xl font-bold">{c.value ?? '—'}</div>
            <div className="text-sm font-medium mt-1 opacity-80">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Users ───────────────────────────────────────────────────────────────────── */
function UsersTab() {
  const [data, setData]     = useState({ users: [], total: 0, pages: 1 });
  const [search, setSearch] = useState('');
  const [role, setRole]     = useState('all');
  const [page, setPage]     = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (s, r, p) => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', { params: { search: s, role: r, page: p } });
      setData(res.data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(search, role, page); }, [search, role, page]);

  async function toggleBan(userId, currentBan) {
    await api.put(`/admin/users/${userId}/ban`);
    setData(prev => ({
      ...prev,
      users: prev.users.map(u => u._id === userId ? { ...u, isBanned: !currentBan } : u),
    }));
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          className="input max-w-xs"
          placeholder="Search name or email…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <select
          className="input max-w-[140px]"
          value={role}
          onChange={e => { setRole(e.target.value); setPage(1); }}
        >
          <option value="all">All roles</option>
          <option value="student">Students</option>
          <option value="mentor">Mentors</option>
        </select>
        <span className="self-center text-sm text-gray-500">{data.total} users</span>
      </div>

      {loading ? <Spinner /> : (
        <>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Name', 'Email', 'Role', 'District', 'Points', 'Joined', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.users.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-10 text-gray-400">No users found</td></tr>
                ) : data.users.map(u => (
                  <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {u.name}
                      {u.isFoundingMember && <span className="ml-1 text-xs text-amber-600">⭐</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${u.role === 'mentor' ? 'badge-orange' : 'badge-green'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.hometownDistrict || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{u.points}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${u.isBanned ? 'bg-red-50 text-red-600' : 'badge-green'}`}>
                        {u.isBanned ? 'Banned' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleBan(u._id, u.isBanned)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                          u.isBanned
                            ? 'border-green-600 text-green-700 hover:bg-green-50'
                            : 'border-red-400 text-red-600 hover:bg-red-50'
                        }`}
                      >
                        {u.isBanned ? 'Unban' : 'Ban'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: data.pages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 text-sm rounded-lg border transition-colors ${
                    p === page ? 'bg-green-700 text-white border-green-700' : 'border-gray-200 hover:border-green-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Posts ───────────────────────────────────────────────────────────────────── */
function PostsTab() {
  const [data, setData]   = useState({ posts: [], total: 0, pages: 1 });
  const [page, setPage]   = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p) => {
    setLoading(true);
    try {
      const res = await api.get('/admin/posts', { params: { page: p } });
      setData(res.data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(page); }, [page]);

  async function deletePost(postId) {
    if (!confirm('Delete this post?')) return;
    await api.delete(`/admin/posts/${postId}`);
    setData(prev => ({ ...prev, posts: prev.posts.filter(p => p._id !== postId), total: prev.total - 1 }));
  }

  const TYPE_LABELS = {
    job_crack: '💼 Job Crack', exam_crack: '🎓 Exam Crack',
    tip: '💡 Tip', question: '❓ Question', story: '📖 Story',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Posts <span className="text-sm font-normal text-gray-400">({data.total} total)</span></h2>
      </div>

      {loading ? <Spinner /> : (
        <>
          <div className="space-y-3">
            {data.posts.length === 0 ? (
              <div className="text-center py-16 text-gray-400">No posts yet</div>
            ) : data.posts.map(p => (
              <div key={p._id} className="card flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                      {TYPE_LABELS[p.type] || p.type}
                    </span>
                    <span className="text-xs text-gray-400">by {p.userId?.name || 'Unknown'}</span>
                    <span className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString('en-IN')}</span>
                    <span className="text-xs text-gray-400">❤️ {p.likes}</span>
                  </div>
                  <p className="font-medium text-gray-800 text-sm truncate">{p.title}</p>
                  <p className="text-gray-500 text-sm line-clamp-2 mt-0.5">{p.body}</p>
                </div>
                <button
                  onClick={() => deletePost(p._id)}
                  className="shrink-0 text-xs border border-red-300 text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>

          {data.pages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: data.pages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 text-sm rounded-lg border transition-colors ${p === page ? 'bg-green-700 text-white border-green-700' : 'border-gray-200 hover:border-green-700'}`}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Jobs ────────────────────────────────────────────────────────────────────── */
function JobsTab() {
  const [data, setData]   = useState({ jobs: [], total: 0, pages: 1 });
  const [page, setPage]   = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p) => {
    setLoading(true);
    try {
      const res = await api.get('/admin/jobs', { params: { page: p } });
      setData(res.data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(page); }, [page]);

  async function deleteJob(jobId) {
    if (!confirm('Delete this job?')) return;
    await api.delete(`/admin/jobs/${jobId}`);
    setData(prev => ({ ...prev, jobs: prev.jobs.filter(j => j._id !== jobId), total: prev.total - 1 }));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Jobs <span className="text-sm font-normal text-gray-400">({data.total} total)</span></h2>
      </div>

      {loading ? <Spinner /> : (
        <>
          <div className="space-y-3">
            {data.jobs.length === 0 ? (
              <div className="text-center py-16 text-gray-400">No jobs yet</div>
            ) : data.jobs.map(j => (
              <div key={j._id} className="card flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-gray-800">{j.role}</span>
                    <span className="text-gray-500 text-sm">at {j.company}</span>
                    {j.referralAvailable && (
                      <span className="badge badge-green">Referral</span>
                    )}
                  </div>
                  <div className="flex gap-3 text-xs text-gray-400 flex-wrap">
                    {j.location && <span>📍 {j.location}</span>}
                    {j.salary && <span>💰 {j.salary}</span>}
                    <span>👤 {j.postedBy?.name || 'Unknown'}</span>
                    <span>{new Date(j.createdAt).toLocaleDateString('en-IN')}</span>
                    <span>👥 {j.interestedUsers?.length || 0} interested</span>
                  </div>
                </div>
                <button
                  onClick={() => deleteJob(j._id)}
                  className="shrink-0 text-xs border border-red-300 text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>

          {data.pages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: data.pages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 text-sm rounded-lg border transition-colors ${p === page ? 'bg-green-700 text-white border-green-700' : 'border-gray-200 hover:border-green-700'}`}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-green-700 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
