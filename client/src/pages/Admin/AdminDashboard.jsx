import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const TABS = ['Overview', 'Users', 'Content', 'Analytics'];

const GREEN  = ['#15803d','#16a34a','#22c55e','#4ade80','#86efac','#bbf7d0'];
const COLORS = ['#15803d','#f97316','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f59e0b'];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then(r => { setStats(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" style={{ paddingTop: 0, paddingBottom: 0 }}>
      {/* ── Header ── */}
      <header className="bg-green-700 text-white px-4 md:px-8 py-3 flex items-center justify-between shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/')} className="flex items-center gap-1 text-green-200 hover:text-white text-sm transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden sm:inline">Back to App</span>
          </button>
          <div className="w-px h-4 bg-green-500" />
          <span className="font-bold text-base sm:text-lg">HimConnect</span>
          <span className="text-xs bg-green-800 text-green-200 px-2 py-0.5 rounded font-medium">Admin</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden md:block text-green-200">{user?.name}</span>
          <button onClick={logout}
            className="bg-green-800 hover:bg-green-900 px-3 py-1.5 rounded-lg text-sm transition-colors font-medium">
            Sign out
          </button>
        </div>
      </header>

      {/* ── Tab nav ── */}
      <div className="bg-white border-b border-gray-100 px-4 md:px-8 sticky top-12 z-40 shadow-sm">
        <div className="flex gap-0 overflow-x-auto scrollbar-hide max-w-7xl mx-auto">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
                tab === t ? 'border-green-700 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-6">
        {loading ? <FullSpinner /> : (
          <>
            {tab === 'Overview'  && <OverviewTab  stats={stats} />}
            {tab === 'Users'     && <UsersTab />}
            {tab === 'Content'   && <ContentTab />}
            {tab === 'Analytics' && <AnalyticsTab stats={stats} />}
          </>
        )}
      </main>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ OVERVIEW ━━ */
function OverviewTab({ stats }) {
  const kpis = [
    { label: 'Total Users',       value: stats.totalUsers,      sub: `${stats.bannedUsers} banned`,          icon: '👥', color: 'from-blue-500 to-blue-600' },
    { label: 'Students',          value: stats.students,        sub: `${Math.round(stats.students/Math.max(stats.totalUsers,1)*100)}% of users`, icon: '🎓', color: 'from-green-600 to-green-700' },
    { label: 'Mentors',           value: stats.mentors,         sub: `${Math.round(stats.mentors/Math.max(stats.totalUsers,1)*100)}% of users`,  icon: '🧑‍🏫', color: 'from-purple-500 to-purple-600' },
    { label: 'Posts',             value: stats.posts,           sub: 'across all types',                     icon: '📝', color: 'from-orange-500 to-orange-600' },
    { label: 'Jobs Posted',       value: stats.jobs,            sub: 'active listings',                      icon: '💼', color: 'from-yellow-500 to-yellow-600' },
    { label: 'Connections',       value: stats.connections,     sub: 'accepted',                             icon: '🤝', color: 'from-pink-500 to-pink-600' },
    { label: 'Founding Members',  value: stats.foundingMembers, sub: 'first 1000 users',                     icon: '⭐', color: 'from-amber-500 to-amber-600' },
    { label: 'Banned Users',      value: stats.bannedUsers,     sub: 'policy violations',                    icon: '🚫', color: 'from-red-500 to-red-600' },
  ];

  const roleData = [
    { name: 'Students', value: stats.students },
    { name: 'Mentors',  value: stats.mentors  },
  ];

  return (
    <div className="space-y-6">
      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map(k => (
          <div key={k.label} className={`bg-gradient-to-br ${k.color} text-white rounded-xl p-4 shadow-md`}>
            <div className="text-2xl mb-1">{k.icon}</div>
            <div className="text-3xl font-bold">{k.value?.toLocaleString()}</div>
            <div className="text-sm font-semibold mt-0.5 opacity-90">{k.label}</div>
            <div className="text-xs mt-0.5 opacity-70">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Growth + Role split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <SectionTitle>User & Post Growth (Last 12 Months)</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={stats.growthByMonth} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#15803d" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#15803d" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Legend />
              <Area type="monotone" dataKey="users" stroke="#15803d" strokeWidth={2} fill="url(#gu)" name="New Users" />
              <Area type="monotone" dataKey="posts" stroke="#f97316" strokeWidth={2} fill="url(#gp)" name="Posts" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <SectionTitle>Role Distribution</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={roleData} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                dataKey="value" nameKey="name" paddingAngle={3}>
                {roleData.map((_, i) => <Cell key={i} fill={GREEN[i * 2]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1">
            {roleData.map((d, i) => (
              <div key={d.name} className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: GREEN[i * 2] }} />
                  {d.name}
                </span>
                <span className="font-semibold">{d.value} ({Math.round(d.value / Math.max(stats.totalUsers, 1) * 100)}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* District + Post type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <SectionTitle>Users by HP District</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.districtBreakdown} layout="vertical" margin={{ top: 0, right: 20, left: 70, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="district" tick={{ fontSize: 11 }} width={68} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="count" name="Users" radius={[0, 4, 4, 0]}>
                {stats.districtBreakdown.map((_, i) => <Cell key={i} fill={GREEN[i % GREEN.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <SectionTitle>Posts by Type</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.postsByType} margin={{ top: 0, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="type" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="count" name="Posts" radius={[4, 4, 0, 0]}>
                {stats.postsByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top users */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <SectionTitle>Top Users by Points</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Rank', 'Name', 'Role', 'District', 'Points'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(stats.topUsers || []).map((u, i) => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="py-2.5 px-3">
                    <span className={`font-bold text-sm ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : 'text-gray-400'}`}>
                      #{i + 1}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-gray-800">
                    {u.name} {u.isFoundingMember && <span className="text-amber-500">⭐</span>}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`badge ${u.role === 'mentor' ? 'badge-orange' : 'badge-green'}`}>{u.role}</span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-500">{u.hometownDistrict || '—'}</td>
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-green-700">{u.points}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ USERS ━━━ */
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
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-wrap gap-3 items-center mb-5">
          <input className="input max-w-xs" placeholder="Search name or email…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          <select className="input max-w-[150px]" value={role}
            onChange={e => { setRole(e.target.value); setPage(1); }}>
            <option value="all">All roles</option>
            <option value="student">Students</option>
            <option value="mentor">Mentors</option>
          </select>
          <span className="ml-auto text-sm text-gray-500 font-medium">{data.total} users</span>
        </div>

        {loading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Name', 'Email', 'Role', 'District', 'Points', 'Joined', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide first:rounded-l-lg last:rounded-r-lg">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.users.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-400">No users found</td></tr>
                ) : data.users.map(u => (
                  <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                      {u.name} {u.isFoundingMember && <span className="text-amber-500 text-xs">⭐</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${u.role === 'mentor' ? 'badge-orange' : 'badge-green'}`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{u.hometownDistrict || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-green-700">{u.points}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${u.isBanned ? 'bg-red-50 text-red-600' : 'badge-green'}`}>
                        {u.isBanned ? 'Banned' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleBan(u._id, u.isBanned)}
                        className={`text-xs px-3 py-1 rounded-lg border font-medium transition-colors ${u.isBanned ? 'border-green-600 text-green-700 hover:bg-green-50' : 'border-red-400 text-red-600 hover:bg-red-50'}`}>
                        {u.isBanned ? 'Unban' : 'Ban'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

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
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CONTENT ━━ */
function ContentTab() {
  const [section, setSection] = useState('posts');
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['posts', 'jobs'].map(s => (
          <button key={s} onClick={() => setSection(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${section === s ? 'bg-green-700 text-white border-green-700' : 'border-gray-200 text-gray-600 hover:border-green-700'}`}>
            {s === 'posts' ? '📝 Posts' : '💼 Jobs'}
          </button>
        ))}
      </div>
      {section === 'posts' ? <PostsList /> : <JobsList />}
    </div>
  );
}

function PostsList() {
  const [data, setData] = useState({ posts: [], total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p) => {
    setLoading(true);
    try { const res = await api.get('/admin/posts', { params: { page: p } }); setData(res.data); } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(page); }, [page]);

  async function del(id) {
    if (!confirm('Delete this post?')) return;
    await api.delete(`/admin/posts/${id}`);
    setData(prev => ({ ...prev, posts: prev.posts.filter(p => p._id !== id), total: prev.total - 1 }));
  }

  const TYPE_COLORS = { job_crack: 'badge-green', exam_crack: 'badge-orange', tip: 'badge-gray', question: 'badge-gray', story: 'badge-gray' };
  const TYPE_LABELS = { job_crack: 'Job Crack', exam_crack: 'Exam Crack', tip: 'Tip', question: 'Question', story: 'Story' };

  if (loading) return <Spinner />;
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">All Posts</span>
        <span className="text-xs text-gray-400">{data.total} total</span>
      </div>
      <div className="divide-y divide-gray-50">
        {data.posts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No posts yet</div>
        ) : data.posts.map(p => (
          <div key={p._id} className="flex items-start gap-4 px-5 py-3 hover:bg-gray-50">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`badge ${TYPE_COLORS[p.type] || 'badge-gray'}`}>{TYPE_LABELS[p.type] || p.type}</span>
                <span className="text-xs text-gray-400">by {p.userId?.name || 'Unknown'}</span>
                <span className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString('en-IN')}</span>
                <span className="text-xs text-gray-400">❤️ {p.likes}</span>
              </div>
              <p className="font-medium text-gray-800 text-sm truncate">{p.title}</p>
              <p className="text-gray-500 text-xs line-clamp-1 mt-0.5">{p.body}</p>
            </div>
            <button onClick={() => del(p._id)}
              className="shrink-0 text-xs border border-red-300 text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-colors">
              Delete
            </button>
          </div>
        ))}
      </div>
      <Pagination pages={data.pages} current={page} onChange={setPage} />
    </div>
  );
}

function JobsList() {
  const [data, setData] = useState({ jobs: [], total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p) => {
    setLoading(true);
    try { const res = await api.get('/admin/jobs', { params: { page: p } }); setData(res.data); } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(page); }, [page]);

  async function del(id) {
    if (!confirm('Delete this job?')) return;
    await api.delete(`/admin/jobs/${id}`);
    setData(prev => ({ ...prev, jobs: prev.jobs.filter(j => j._id !== id), total: prev.total - 1 }));
  }

  if (loading) return <Spinner />;
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">All Jobs</span>
        <span className="text-xs text-gray-400">{data.total} total</span>
      </div>
      <div className="divide-y divide-gray-50">
        {data.jobs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No jobs yet</div>
        ) : data.jobs.map(j => (
          <div key={j._id} className="flex items-start gap-4 px-5 py-3 hover:bg-gray-50">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-semibold text-gray-800 text-sm">{j.role}</span>
                <span className="text-gray-500 text-xs">at {j.company}</span>
                {j.referralAvailable && <span className="badge badge-green">Referral</span>}
              </div>
              <div className="flex gap-3 text-xs text-gray-400 flex-wrap">
                {j.location && <span>📍 {j.location}</span>}
                {j.salary && <span>💰 {j.salary}</span>}
                <span>👤 {j.postedBy?.name || 'Unknown'}</span>
                <span>{new Date(j.createdAt).toLocaleDateString('en-IN')}</span>
                <span>👥 {j.interestedUsers?.length || 0} interested</span>
              </div>
            </div>
            <button onClick={() => del(j._id)}
              className="shrink-0 text-xs border border-red-300 text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-colors">
              Delete
            </button>
          </div>
        ))}
      </div>
      <Pagination pages={data.pages} current={page} onChange={setPage} />
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ANALYTICS ━━ */
function AnalyticsTab({ stats }) {
  const [range, setRange] = useState('all');

  const filtered = filterByRange(stats.growthByMonth, range);

  return (
    <div className="space-y-4">
      {/* Slicer bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-3 flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date Range</span>
        {[['7d','7 Days'],['30d','30 Days'],['90d','90 Days'],['6mo','6 Months'],['all','All Time']].map(([v, l]) => (
          <button key={v} onClick={() => setRange(v)}
            className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${range === v ? 'bg-green-700 text-white border-green-700' : 'border-gray-200 text-gray-600 hover:border-green-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Growth deep-dive */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <SectionTitle>User Registrations Over Time</SectionTitle>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={filtered} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="au" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#15803d" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#15803d" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
            <Area type="monotone" dataKey="users" stroke="#15803d" strokeWidth={2.5} fill="url(#au)" name="New Users" dot={{ r: 4, fill: '#15803d' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Post activity */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <SectionTitle>Post Activity Over Time</SectionTitle>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={filtered} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="ap" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
            <Area type="monotone" dataKey="posts" stroke="#f97316" strokeWidth={2.5} fill="url(#ap)" name="Posts" dot={{ r: 4, fill: '#f97316' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Field of interest + Districts side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <SectionTitle>Field of Interest Breakdown</SectionTitle>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.fieldBreakdown} layout="vertical" margin={{ top: 0, right: 20, left: 100, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="field" tick={{ fontSize: 10 }} width={98} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="count" name="Users" radius={[0, 4, 4, 0]}>
                {stats.fieldBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <SectionTitle>Post Type Distribution</SectionTitle>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={stats.postsByType} cx="50%" cy="50%" outerRadius={100}
                dataKey="count" nameKey="type" paddingAngle={2} label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}>
                {stats.postsByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary stats table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <SectionTitle>Platform Summary</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
          {[
            { label: 'Avg Points / User', value: stats.totalUsers ? (stats.topUsers?.reduce((s, u) => s + u.points, 0) / Math.min(stats.topUsers?.length || 1, stats.totalUsers)).toFixed(1) : 0 },
            { label: 'Mentor Ratio', value: `1 : ${stats.mentors ? Math.round(stats.students / stats.mentors) : '∞'}` },
            { label: 'Post / User Ratio', value: stats.totalUsers ? (stats.posts / stats.totalUsers).toFixed(2) : 0 },
            { label: 'Ban Rate', value: `${stats.totalUsers ? ((stats.bannedUsers / stats.totalUsers) * 100).toFixed(1) : 0}%` },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-700">{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ HELPERS ━━ */
function filterByRange(data, range) {
  if (!data?.length) return [];
  if (range === 'all') return data;
  const counts = { '7d': 1, '30d': 2, '90d': 3, '6mo': 6 };
  return data.slice(-(counts[range] || data.length));
}

function SectionTitle({ children }) {
  return <h3 className="text-sm font-semibold text-gray-700 mb-4">{children}</h3>;
}

function Pagination({ pages, current, onChange }) {
  if (pages <= 1) return null;
  return (
    <div className="flex justify-center gap-2 py-4 border-t border-gray-50">
      {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
        <button key={p} onClick={() => onChange(p)}
          className={`w-8 h-8 text-sm rounded-lg border transition-colors ${p === current ? 'bg-green-700 text-white border-green-700' : 'border-gray-200 hover:border-green-700'}`}>
          {p}
        </button>
      ))}
    </div>
  );
}

function Spinner() {
  return <div className="flex justify-center py-10"><div className="w-7 h-7 border-4 border-green-700 border-t-transparent rounded-full animate-spin" /></div>;
}

function FullSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <div className="w-10 h-10 border-4 border-green-700 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-400">Loading analytics…</p>
    </div>
  );
}
