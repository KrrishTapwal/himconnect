import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const TABS = ['Overview', 'Users', 'Content', 'Analytics', 'Server'];

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
            {tab === 'Server'    && <ServerTab />}
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
  const { user: me } = useAuth();
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

  async function toggleDashboardAccess(userId, current) {
    try {
      await api.put(`/admin/users/${userId}/dashboard-access`);
      setData(prev => ({
        ...prev,
        users: prev.users.map(u => u._id === userId ? { ...u, isSubAdmin: !current } : u),
      }));
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update access');
    }
  }

  const isRealAdmin = me?.role === 'admin';

  return (
    <div className="space-y-4">
      {isRealAdmin && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
          <span>🛡️</span>
          <span>You can grant any user <strong>Dashboard Access</strong> — they'll see the full admin panel. Remove it anytime to revoke.</span>
        </div>
      )}
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
                  {['Name', 'Email', 'Role', 'District', 'Points', 'Joined', 'Status', isRealAdmin ? 'Dashboard' : '', ''].map((h, i) => (
                    <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide first:rounded-l-lg last:rounded-r-lg">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.users.length === 0 ? (
                  <tr><td colSpan={isRealAdmin ? 9 : 8} className="text-center py-12 text-gray-400">No users found</td></tr>
                ) : data.users.map(u => (
                  <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                      {u.name}
                      {u.isFoundingMember && <span className="text-amber-500 text-xs ml-1">⭐</span>}
                      {u.isSubAdmin && <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">🛡️ Access</span>}
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
                    {isRealAdmin && (
                      <td className="px-4 py-3">
                        <button onClick={() => toggleDashboardAccess(u._id, u.isSubAdmin)}
                          className={`text-xs px-3 py-1 rounded-lg border font-medium transition-colors ${u.isSubAdmin ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' : 'border-blue-300 text-blue-600 hover:bg-blue-50'}`}>
                          {u.isSubAdmin ? '🛡️ Revoke' : 'Grant Access'}
                        </button>
                      </td>
                    )}
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

function AdminEditPostModal({ post, onClose, onSaved }) {
  const [form, setForm] = useState({ title: post.title, body: post.body, imageUrl: post.imageUrl || '', youtubeLink: post.youtubeLink || '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
  async function submit(e) {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const { data } = await api.put(`/admin/posts/${post._id}`, form);
      onSaved(data);
    } catch (err) { setError(err.response?.data?.message || 'Failed'); }
    setLoading(false);
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Edit Post <span className="text-xs text-gray-400 font-normal">by {post.userId?.name}</span></h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl">×</button>
        </div>
        {error && <p className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded">{error}</p>}
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Title</label>
            <input className="input" value={form.title} onChange={e => set('title', e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Body</label>
            <textarea className="input resize-none" rows={4} maxLength={500} value={form.body} onChange={e => set('body', e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Image URL</label>
            <input className="input" type="url" placeholder="https://..." value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">YouTube URL</label>
            <input className="input" type="url" placeholder="https://youtube.com/..." value={form.youtubeLink} onChange={e => set('youtubeLink', e.target.value)} />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-600">Cancel</button>
            <button type="submit" className="flex-1 btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PostsList() {
  const [data, setData] = useState({ posts: [], total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState(null);

  const load = useCallback(async (p) => {
    setLoading(true);
    try { const res = await api.get('/admin/posts', { params: { page: p } }); setData(res.data); } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(page); }, [page]);

  async function toggleHide(id, current) {
    await api.put(`/admin/posts/${id}/hide`);
    setData(prev => ({ ...prev, posts: prev.posts.map(p => p._id === id ? { ...p, isHidden: !current } : p) }));
  }

  async function del(id) {
    if (!confirm('Permanently delete this post?')) return;
    await api.delete(`/admin/posts/${id}`);
    setData(prev => ({ ...prev, posts: prev.posts.filter(p => p._id !== id), total: prev.total - 1 }));
  }

  const TYPE_COLORS = { job_crack: 'badge-green', exam_crack: 'badge-orange', tip: 'badge-gray', question: 'badge-gray', story: 'badge-gray' };
  const TYPE_LABELS = { job_crack: 'Job Crack', exam_crack: 'Exam Crack', tip: 'Tip', question: 'Question', story: 'Story' };

  if (loading) return <Spinner />;
  return (
    <>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">All Posts</span>
          <span className="text-xs text-gray-400">{data.total} total</span>
        </div>
        <div className="divide-y divide-gray-50">
          {data.posts.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No posts yet</div>
          ) : data.posts.map(p => (
            <div key={p._id} className={`flex items-start gap-4 px-5 py-3 hover:bg-gray-50 ${p.isHidden ? 'opacity-50' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`badge ${TYPE_COLORS[p.type] || 'badge-gray'}`}>{TYPE_LABELS[p.type] || p.type}</span>
                  {p.isHidden && <span className="badge bg-gray-100 text-gray-500">Hidden</span>}
                  <span className="text-xs text-gray-400">by {p.userId?.name || 'Unknown'}</span>
                  <span className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString('en-IN')}</span>
                  <span className="text-xs text-gray-400">❤️ {p.likes}</span>
                </div>
                <p className="font-medium text-gray-800 text-sm truncate">{p.title}</p>
                <p className="text-gray-500 text-xs line-clamp-1 mt-0.5">{p.body}</p>
              </div>
              <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
                <button onClick={() => setEditingPost(p)}
                  className="text-xs px-2.5 py-1 rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50 transition-colors">
                  Edit
                </button>
                <button onClick={() => toggleHide(p._id, p.isHidden)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${p.isHidden ? 'border-green-600 text-green-700 hover:bg-green-50' : 'border-gray-400 text-gray-600 hover:bg-gray-50'}`}>
                  {p.isHidden ? 'Unhide' : 'Hide'}
                </button>
                <button onClick={() => del(p._id)}
                  className="text-xs border border-red-300 text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        <Pagination pages={data.pages} current={page} onChange={setPage} />
      </div>
      {editingPost && (
        <AdminEditPostModal post={editingPost} onClose={() => setEditingPost(null)}
          onSaved={updated => {
            setData(prev => ({ ...prev, posts: prev.posts.map(p => p._id === updated._id ? { ...p, ...updated } : p) }));
            setEditingPost(null);
          }} />
      )}
    </>
  );
}

function JobsList() {
  const [statusTab, setStatusTab] = useState('pending');
  const [data, setData] = useState({ jobs: [], total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p, s) => {
    setLoading(true);
    try { const res = await api.get('/admin/jobs', { params: { page: p, status: s } }); setData(res.data); } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(page, statusTab); }, [page, statusTab]);

  function switchTab(t) { setStatusTab(t); setPage(1); }

  async function approve(id) {
    await api.put(`/admin/jobs/${id}/approve`);
    setData(prev => ({ ...prev, jobs: prev.jobs.filter(j => j._id !== id), total: prev.total - 1 }));
  }

  async function reject(id) {
    if (!confirm('Reject and delete this job?')) return;
    await api.put(`/admin/jobs/${id}/reject`);
    setData(prev => ({ ...prev, jobs: prev.jobs.filter(j => j._id !== id), total: prev.total - 1 }));
  }

  async function del(id) {
    if (!confirm('Delete this job?')) return;
    await api.delete(`/admin/jobs/${id}`);
    setData(prev => ({ ...prev, jobs: prev.jobs.filter(j => j._id !== id), total: prev.total - 1 }));
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {[['pending', '⏳ Pending'], ['approved', '✅ Approved'], ['all', 'All']].map(([key, label]) => (
          <button key={key} onClick={() => switchTab(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${statusTab === key ? (key === 'pending' ? 'bg-orange-500 text-white border-orange-500' : 'bg-green-700 text-white border-green-700') : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
            {label}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400 self-center">{data.total} jobs</span>
      </div>

      {statusTab === 'pending' && (
        <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-2.5 text-sm text-orange-700 flex items-center gap-2">
          <span>⚠️</span>
          <span>These jobs are waiting for your approval — they are <strong>hidden from all users</strong> until you approve.</span>
        </div>
      )}

      {loading ? <Spinner /> : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {data.jobs.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                {statusTab === 'pending' ? '🎉 No pending jobs — all clear!' : 'No jobs yet'}
              </div>
            ) : data.jobs.map(j => (
              <div key={j._id} className="flex items-start gap-4 px-5 py-3 hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-gray-800 text-sm">{j.role}</span>
                    <span className="text-gray-500 text-xs">at {j.company}</span>
                    {j.referralAvailable && <span className="badge badge-green">Referral</span>}
                    <span className={`badge text-xs ${j.status === 'pending' ? 'bg-orange-50 text-orange-600' : 'badge-green'}`}>
                      {j.status}
                    </span>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-400 flex-wrap">
                    {j.location && <span>📍 {j.location}</span>}
                    {j.salary && <span>💰 {j.salary}</span>}
                    <span>👤 {j.postedBy?.name || 'Unknown'} ({j.postedBy?.email})</span>
                    <span>{new Date(j.createdAt).toLocaleDateString('en-IN')}</span>
                    {j.description && <span className="text-gray-500 italic truncate max-w-xs">"{j.description}"</span>}
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {j.status === 'pending' && (
                    <button onClick={() => approve(j._id)}
                      className="text-xs bg-green-700 text-white hover:bg-green-800 px-2.5 py-1 rounded-lg transition-colors font-medium">
                      ✓ Approve
                    </button>
                  )}
                  <button onClick={() => j.status === 'pending' ? reject(j._id) : del(j._id)}
                    className="text-xs border border-red-300 text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-colors">
                    {j.status === 'pending' ? 'Reject' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Pagination pages={data.pages} current={page} onChange={setPage} />
        </div>
      )}
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

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SERVER ━━━ */
function ServerTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/admin/server-stats')
      .then(r => { setData(r.data); setLoading(false); })
      .catch(e => { setError(e.response?.data?.message || 'Failed to load'); setLoading(false); });
  }, []);

  if (loading) return <FullSpinner />;
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;

  const { mongo, collections, process: proc } = data;

  const usedPct  = Math.min(mongo.usedPct, 100);
  const gaugeColor = usedPct > 85 ? '#ef4444' : usedPct > 60 ? '#f97316' : '#15803d';

  const storageDonut = [
    { name: 'Data',    value: mongo.dataMB   },
    { name: 'Indexes', value: mongo.indexMB  },
    { name: 'Free',    value: Math.max(mongo.freeMB, 0) },
  ];
  const donutColors = ['#15803d', '#3b82f6', '#e5e7eb'];

  function fmtUptime(s) {
    if (!s) return '—';
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    return [d && `${d}d`, h && `${h}h`, `${m}m`].filter(Boolean).join(' ');
  }

  return (
    <div className="space-y-5">

      {/* ── Storage gauge + donut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Gauge card */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col items-center">
          <SectionTitle>MongoDB Atlas Storage</SectionTitle>
          {/* SVG radial gauge */}
          <svg viewBox="0 0 120 70" className="w-48">
            {/* track */}
            <path d="M10 65 A50 50 0 0 1 110 65" fill="none" stroke="#e5e7eb" strokeWidth="10" strokeLinecap="round" />
            {/* fill */}
            <path d="M10 65 A50 50 0 0 1 110 65" fill="none" stroke={gaugeColor} strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${usedPct * 1.571} 999`} />
            <text x="60" y="62" textAnchor="middle" fontSize="16" fontWeight="bold" fill={gaugeColor}>{usedPct.toFixed(1)}%</text>
          </svg>
          <p className="text-2xl font-bold text-gray-800 mt-1">{mongo.dataMB} <span className="text-sm font-normal text-gray-500">MB used</span></p>
          <p className="text-sm text-gray-400">of {mongo.limitMB} MB free tier</p>
          <div className="w-full bg-gray-100 rounded-full h-2 mt-4">
            <div className="h-2 rounded-full transition-all" style={{ width: `${usedPct}%`, background: gaugeColor }} />
          </div>
          <div className="flex justify-between w-full text-xs text-gray-400 mt-1">
            <span>0 MB</span><span>{mongo.limitMB} MB</span>
          </div>
          <div className="mt-4 space-y-1 w-full text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Data size</span><span className="font-medium">{mongo.dataMB} MB</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Index size</span><span className="font-medium">{mongo.indexMB} MB</span></div>
            <div className="flex justify-between"><span className="text-gray-500">On-disk (compressed)</span><span className="font-medium">{mongo.storageMB} MB</span></div>
            <div className="flex justify-between border-t pt-1 mt-1"><span className="text-gray-500">Free remaining</span><span className="font-semibold text-green-700">{mongo.freeMB} MB</span></div>
          </div>
        </div>

        {/* Donut breakdown */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <SectionTitle>Storage Breakdown</SectionTitle>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie data={storageDonut} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                  dataKey="value" paddingAngle={2}>
                  {storageDonut.map((_, i) => <Cell key={i} fill={donutColors[i]} />)}
                </Pie>
                <Tooltip formatter={(v) => `${v} MB`}
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {storageDonut.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: donutColors[i] }} />
                    <span className="text-sm text-gray-600">{d.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold">{d.value} MB</span>
                    <span className="text-xs text-gray-400 ml-1">({((d.value / mongo.limitMB) * 100).toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t text-xs text-gray-400">
                Atlas M0 free tier · 512 MB limit · WiredTiger compression active
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MongoDB overview cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Collections',    value: mongo.collections,                    icon: '🗂️' },
          { label: 'Total Documents',value: (mongo.objects || 0).toLocaleString(), icon: '📄' },
          { label: 'Avg Doc Size',   value: `${mongo.avgObjBytes} B`,             icon: '⚖️' },
          { label: 'MongoDB Version',value: mongo.version || '—',                 icon: '🍃' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="text-xl mb-1">{c.icon}</div>
            <div className="text-lg font-bold text-gray-800">{c.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>

      {/* ── Collection breakdown table ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <SectionTitle>Collection Breakdown</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Collection', 'Documents', 'Data Size', 'Index Size', 'Avg Doc', 'Share'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {collections.map(c => {
                const totalKB = c.dataKB + c.indexKB;
                const pct = mongo.dataMB > 0 ? ((c.dataKB / 1024) / mongo.dataMB * 100) : 0;
                return (
                  <tr key={c.name} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-800 capitalize">{c.name}</td>
                    <td className="px-4 py-2.5 text-gray-600">{c.documents.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-gray-600">{c.dataKB < 1024 ? `${c.dataKB} KB` : `${(c.dataKB/1024).toFixed(2)} MB`}</td>
                    <td className="px-4 py-2.5 text-gray-600">{c.indexKB < 1024 ? `${c.indexKB} KB` : `${(c.indexKB/1024).toFixed(2)} MB`}</td>
                    <td className="px-4 py-2.5 text-gray-600">{c.avgDocBytes} B</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-[60px]">
                          <div className="h-1.5 bg-green-600 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{pct.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Collection size bar chart ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <SectionTitle>Collection Size (KB)</SectionTitle>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={collections} margin={{ top: 0, right: 10, left: -10, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => `${v} KB`}
              contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
            <Bar dataKey="dataKB" name="Data" radius={[4,4,0,0]}>
              {collections.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Node / Render process info ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <SectionTitle>Server Process (Render Backend)</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Node.js',        value: proc.nodeVersion,                      icon: '💚' },
            { label: 'Server Uptime',  value: fmtUptime(proc.uptimeSeconds),          icon: '⏱️' },
            { label: 'Heap Used',      value: `${proc.heapUsedMB} MB`,               icon: '🧠' },
            { label: 'Heap Total',     value: `${proc.heapTotalMB} MB`,              icon: '📦' },
            { label: 'RSS Memory',     value: `${proc.rssMB} MB`,                    icon: '💾' },
            { label: 'External Mem',   value: `${proc.externalMB} MB`,              icon: '🔌' },
            { label: 'Platform',       value: proc.platform,                          icon: '🖥️' },
            { label: 'DB Connections', value: mongo.connections ? `${mongo.connections.current} / ${mongo.connections.available + mongo.connections.current}` : '—', icon: '🔗' },
          ].map(c => (
            <div key={c.label} className="bg-gray-50 rounded-xl p-4">
              <div className="text-lg mb-1">{c.icon}</div>
              <div className="text-base font-bold text-gray-800">{c.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{c.label}</div>
            </div>
          ))}
        </div>

        {/* Heap usage bar */}
        <div className="mt-5">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Heap Memory Usage</span>
            <span>{proc.heapUsedMB} MB / {proc.heapTotalMB} MB ({Math.round(proc.heapUsedMB / proc.heapTotalMB * 100)}%)</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div className="h-3 rounded-full bg-gradient-to-r from-green-500 to-green-700 transition-all"
              style={{ width: `${Math.min((proc.heapUsedMB / proc.heapTotalMB) * 100, 100)}%` }} />
          </div>
        </div>

        {mongo.connections && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>MongoDB Connections</span>
              <span>{mongo.connections.current} active / {mongo.connections.current + mongo.connections.available} total</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div className="h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all"
                style={{ width: `${Math.min((mongo.connections.current / (mongo.connections.current + mongo.connections.available)) * 100, 100)}%` }} />
            </div>
          </div>
        )}

        {mongo.uptime && (
          <div className="mt-4 text-xs text-gray-400 text-center">
            MongoDB server uptime: {fmtUptime(mongo.uptime)}
          </div>
        )}
      </div>
    </div>
  );

  function fmtUptime(s) {
    if (!s) return '—';
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    return [d && `${d}d`, h && `${h}h`, `${m}m`].filter(Boolean).join(' ');
  }
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
