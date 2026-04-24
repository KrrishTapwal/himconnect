import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import SpotlightCard from './ui/SpotlightCard';

const TYPE_STYLE = {
  job_crack:  { label: '💼 Job Win',  cls: 'badge-green' },
  exam_crack: { label: '🎓 Exam Win', cls: 'badge-green' },
  tip:        { label: '💡 Tip',      cls: 'badge-gray' },
  question:   { label: '❓ Question', cls: 'badge-gray' },
  story:      { label: '📖 Story',    cls: 'badge-gray' }
};

function getYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

/* ── Edit modal ── */
function EditModal({ post, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: post.title, body: post.body,
    imageUrl: post.imageUrl || '', youtubeLink: post.youtubeLink || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await api.put(`/posts/${post._id}`, form);
      onSaved(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Edit post</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl">×</button>
        </div>
        {error && <p className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded">{error}</p>}
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Title</label>
            <input className="input" maxLength={150} value={form.title} onChange={e => set('title', e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Body ({form.body.length}/500)</label>
            <textarea className="input resize-none" rows={4} maxLength={500} value={form.body} onChange={e => set('body', e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Photo link (optional)</label>
            <input className="input" type="url" placeholder="https://i.imgur.com/..." value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">YouTube link (optional)</label>
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

/* ── Comments section ── */
function Comments({ postId, currentUserId, initialCount, onCountChange }) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [count, setCount] = useState(initialCount || 0);

  async function load() {
    if (loaded) return;
    try {
      const { data } = await api.get(`/posts/${postId}/comments`);
      setComments(data);
      setLoaded(true);
    } catch {}
  }

  function toggle() {
    if (!open) load();
    setOpen(o => !o);
  }

  async function submit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/posts/${postId}/comments`, { text });
      setComments(prev => [...prev, data]);
      const newCount = count + 1;
      setCount(newCount);
      onCountChange?.(newCount);
      setText('');
    } catch {}
    setSubmitting(false);
  }

  async function deleteComment(id) {
    try {
      await api.delete(`/posts/${postId}/comments/${id}`);
      setComments(prev => prev.filter(c => c._id !== id));
      const newCount = Math.max(0, count - 1);
      setCount(newCount);
      onCountChange?.(newCount);
    } catch {}
  }

  return (
    <div>
      <button onClick={toggle}
        className={`flex items-center gap-1 text-sm transition-colors ${open ? 'text-green-700' : 'text-gray-400 hover:text-green-700'}`}>
        <span>💬</span>
        <span>{count > 0 ? count : ''} {count === 1 ? 'comment' : 'comments'}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
            className="mt-3 space-y-2 overflow-hidden">

            {comments.length === 0 && loaded && (
              <p className="text-xs text-gray-400 pl-1">No comments yet — be the first!</p>
            )}

            {comments.map(c => (
              <div key={c._id} className="flex items-start gap-2 group">
                <div className="w-6 h-6 bg-green-700 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                  {c.userId?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0 bg-gray-50 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-semibold text-gray-800">{c.userId?.name}</span>
                    <span className="text-xs text-gray-400">{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="text-xs text-gray-700">{c.text}</p>
                </div>
                {c.userId?._id === currentUserId && (
                  <button onClick={() => deleteComment(c._id)}
                    className="text-gray-300 hover:text-red-400 text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">✕</button>
                )}
              </div>
            ))}

            {currentUserId && (
              <form onSubmit={submit} className="flex gap-2 pt-1">
                <input value={text} onChange={e => setText(e.target.value)} maxLength={300}
                  placeholder="Write a comment…"
                  className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-green-500" />
                <button type="submit" disabled={submitting || !text.trim()}
                  className="btn-primary text-xs px-3 py-1.5 disabled:opacity-50">Post</button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── PostCard ── */
export default function PostCard({ post: initialPost, currentUserId, onLikeToggle, onDeleted }) {
  const nav = useNavigate();
  const [post, setPost] = useState(initialPost);
  const [liked, setLiked] = useState(post.likedBy?.includes(currentUserId));
  const [likes, setLikes] = useState(post.likes || 0);
  const [toggling, setToggling] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);

  const isAuthor = currentUserId && post.userId?._id === currentUserId;

  async function toggleLike() {
    if (toggling || !currentUserId) return;
    setToggling(true);
    setLiked(prev => !prev);
    setLikes(prev => liked ? prev - 1 : prev + 1);
    try {
      const { data } = await api.post(`/posts/${post._id}/like`);
      setLikes(data.likes);
      setLiked(data.liked);
      onLikeToggle?.(post._id, data.likes, data.liked);
    } catch {
      setLiked(prev => !prev);
      setLikes(prev => liked ? prev + 1 : prev - 1);
    } finally {
      setToggling(false);
    }
  }

  async function deletePost() {
    if (!confirm('Delete this post?')) return;
    try {
      await api.delete(`/posts/${post._id}`);
      onDeleted?.(post._id);
    } catch {}
  }

  const author = post.userId;
  const ts = TYPE_STYLE[post.type] || TYPE_STYLE.story;
  const videoId = getYouTubeId(post.youtubeLink);

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
        <SpotlightCard className="card">
          {/* author row */}
          <div className="flex items-start gap-2 mb-3">
            <button onClick={() => nav(`/profile/${author?._id}`)}
              className="w-8 h-8 bg-green-700 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
              {author?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button onClick={() => nav(`/profile/${author?._id}`)} className="font-semibold text-sm hover:underline">{author?.name}</button>
                {author?.isTrustedMentor && <span className="text-xs text-orange-500">⭐</span>}
                {author?.isFoundingMember && <span className="text-xs text-green-700">🏔️</span>}
                <span className="text-gray-400 text-xs">· {timeAgo(post.createdAt)}</span>
              </div>
              <p className="text-xs text-gray-500">{author?.hometownDistrict ? `${author.hometownDistrict}, HP` : ''}{author?.college ? ` · ${author.college}` : ''}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={ts.cls + ' badge text-xs'}>{ts.label}</span>
              {isAuthor && (
                <div className="relative">
                  <button onClick={() => setMenuOpen(o => !o)}
                    className="text-gray-400 hover:text-gray-600 text-base leading-none px-1">⋯</button>
                  {menuOpen && (
                    <div className="absolute right-0 top-6 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-10 min-w-[110px]"
                      onMouseLeave={() => setMenuOpen(false)}>
                      <button onClick={() => { setEditing(true); setMenuOpen(false); }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">✏️ Edit</button>
                      <button onClick={() => { deletePost(); setMenuOpen(false); }}
                        className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50">🗑️ Delete</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* content */}
          <h3 className="font-semibold text-gray-900 text-sm mb-1">{post.title}</h3>
          <p className="text-sm text-gray-700 leading-relaxed">{post.body}</p>

          {/* exam / job meta */}
          {post.type === 'exam_crack' && (
            <div className="flex gap-3 mt-2 flex-wrap">
              {post.examName && <span className="text-xs text-gray-500">📝 {post.examName}</span>}
              {post.rank && <span className="text-xs text-green-700 font-semibold">{post.rank}</span>}
              {post.collegeCracked && <span className="text-xs text-gray-500">🎓 {post.collegeCracked}</span>}
            </div>
          )}
          {post.type === 'job_crack' && (
            <div className="flex gap-3 mt-2 flex-wrap">
              {post.companyName && <span className="text-xs text-gray-500">🏢 {post.companyName}</span>}
              {post.role && <span className="text-xs text-gray-500">{post.role}</span>}
              {post.salary && <span className="text-xs text-green-700 font-semibold">{post.salary}</span>}
            </div>
          )}

          {/* image */}
          {post.imageUrl && (
            <div className="mt-3 rounded-xl overflow-hidden">
              <img src={post.imageUrl} alt="Post image" className="w-full object-cover max-h-80"
                onError={e => { e.target.style.display = 'none'; }} />
            </div>
          )}

          {/* youtube */}
          {post.youtubeLink && (
            videoId ? (
              <div className="mt-3 rounded-xl overflow-hidden relative" style={{ paddingBottom: '56.25%', height: 0 }}>
                {playing ? (
                  <iframe className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                    title="YouTube video" frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen />
                ) : (
                  <div className="absolute inset-0 group cursor-pointer" onClick={() => setPlaying(true)}>
                    <img src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} alt="YouTube thumbnail" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/40 transition-colors">
                      <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <span className="text-white text-lg ml-1">▶</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <a href={post.youtubeLink} target="_blank" rel="noreferrer"
                className="inline-block mt-2 text-xs text-green-700 hover:underline">▶ Watch on YouTube →</a>
            )
          )}

          {/* actions */}
          <div className="flex gap-5 mt-3 pt-3 border-t border-gray-100">
            <motion.button onClick={toggleLike} whileTap={{ scale: 1.3 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              className={`flex items-center gap-1 text-sm transition-colors ${liked ? 'text-orange-500' : 'text-gray-400 hover:text-orange-500'}`}>
              <span>{liked ? '❤️' : '🤍'}</span>
              <span>{likes}</span>
            </motion.button>

            <Comments postId={post._id} currentUserId={currentUserId}
              initialCount={commentsCount} onCountChange={setCommentsCount} />
          </div>
        </SpotlightCard>
      </motion.div>

      {editing && (
        <EditModal post={post} onClose={() => setEditing(false)}
          onSaved={updated => { setPost(updated); setEditing(false); }} />
      )}
    </>
  );
}
