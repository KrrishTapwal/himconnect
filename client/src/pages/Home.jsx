import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'job_crack', label: '💼 Jobs' },
  { key: 'exam_crack', label: '🎓 Exams' },
  { key: 'tip', label: '💡 Tips' },
  { key: 'question', label: '❓ Questions' },
  { key: 'story', label: '📖 Stories' }
];

export default function Home() {
  const { user } = useAuth();
  const [tab, setTab] = useState('all');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadPosts = useCallback(async (currentTab, currentPage) => {
    setLoading(true);
    try {
      const params = { page: currentPage, limit: 15 };
      if (currentTab !== 'all') params.type = currentTab;
      const { data } = await api.get('/posts/feed', { params });
      if (currentPage === 1) {
        setPosts(data.posts);
      } else {
        setPosts(prev => [...prev, ...data.posts]);
      }
      setHasMore(data.posts.length === 15);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    setPage(1);
    loadPosts(tab, 1);
  }, [tab]);

  function onTabChange(t) {
    setTab(t);
  }

  function onPostCreated(post) {
    setPosts(prev => [post, ...prev]);
    setShowCreate(false);
  }

  function onLikeToggle(postId, likes, liked) {
    setPosts(prev => prev.map(p => p._id === postId ? { ...p, likes, likedBy: liked ? [...(p.likedBy || []), user._id] : (p.likedBy || []).filter(id => id !== user._id) } : p));
  }

  function onDeleted(postId) {
    setPosts(prev => prev.filter(p => p._id !== postId));
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      {/* header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Community Feed</h1>
          <p className="text-sm text-gray-500">Stories, tips & wins from HP students</p>
        </div>
        <button className="btn-primary text-sm" onClick={() => setShowCreate(true)}>+ Post</button>
      </div>

      {/* tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {TABS.map(t => (
          <button key={t.key} onClick={() => onTabChange(t.key)}
            className={`whitespace-nowrap text-sm px-3 py-1.5 rounded-full border transition-colors ${tab === t.key ? 'bg-green-700 text-white border-green-700' : 'border-gray-200 text-gray-600 hover:border-green-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* posts */}
      {loading && page === 1 ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <SkeletonCard key={i} />)}</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">🏔️</p>
          <p>No posts yet. Be the first to share!</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {posts.map(post => (
              <PostCard key={post._id} post={post} currentUserId={user?._id} onLikeToggle={onLikeToggle} onDeleted={onDeleted} />
            ))}
          </div>
          {hasMore && (
            <button className="w-full mt-4 py-2 text-sm text-green-700 border border-green-700 rounded-lg hover:bg-green-50"
              onClick={() => { const next = page + 1; setPage(next); loadPosts(tab, next); }}>
              Load more
            </button>
          )}
        </>
      )}

      {showCreate && <CreatePostModal onClose={() => setShowCreate(false)} onCreated={onPostCreated} />}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="flex gap-3">
        <div className="w-8 h-8 bg-gray-200 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-gray-200 rounded w-1/3" />
          <div className="h-3 bg-gray-200 rounded w-2/3" />
          <div className="h-3 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}
