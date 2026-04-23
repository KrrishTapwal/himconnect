import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const TYPE_STYLE = {
  job_crack: { label: '💼 Job Win', cls: 'badge-green' },
  exam_crack: { label: '🎓 Exam Win', cls: 'badge-green' },
  tip: { label: '💡 Tip', cls: 'badge-gray' },
  question: { label: '❓ Question', cls: 'badge-gray' },
  story: { label: '📖 Story', cls: 'badge-gray' }
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

export default function PostCard({ post, currentUserId, onLikeToggle }) {
  const nav = useNavigate();
  const [liked, setLiked] = useState(post.likedBy?.includes(currentUserId));
  const [likes, setLikes] = useState(post.likes || 0);
  const [toggling, setToggling] = useState(false);
  const [playing, setPlaying] = useState(false);

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

  const author = post.userId;
  const ts = TYPE_STYLE[post.type] || TYPE_STYLE.story;

  return (
    <div className="card">
      {/* author */}
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
            <span className="text-gray-400 text-xs">·</span>
            <span className="text-gray-400 text-xs">{timeAgo(post.createdAt)}</span>
          </div>
          <p className="text-xs text-gray-500">{author?.hometownDistrict ? `${author.hometownDistrict}, HP` : ''} {author?.college ? `· ${author.college}` : ''}</p>
        </div>
        <span className={ts.cls + ' badge shrink-0 text-xs'}>{ts.label}</span>
      </div>

      {/* content */}
      <h3 className="font-semibold text-gray-900 text-sm mb-1">{post.title}</h3>
      <p className="text-sm text-gray-700 leading-relaxed">{post.body}</p>

      {/* meta for exam/job crack */}
      {post.type === 'exam_crack' && (
        <div className="flex gap-3 mt-2">
          {post.examName && <span className="text-xs text-gray-500">📝 {post.examName}</span>}
          {post.rank && <span className="text-xs text-green-700 font-semibold">{post.rank}</span>}
          {post.collegeCracked && <span className="text-xs text-gray-500">🎓 {post.collegeCracked}</span>}
        </div>
      )}
      {post.type === 'job_crack' && (
        <div className="flex gap-3 mt-2">
          {post.companyName && <span className="text-xs text-gray-500">🏢 {post.companyName}</span>}
          {post.role && <span className="text-xs text-gray-500">{post.role}</span>}
          {post.salary && <span className="text-xs text-green-700 font-semibold">{post.salary}</span>}
        </div>
      )}

      {/* youtube thumbnail */}
      {post.youtubeLink && (() => {
        const videoId = getYouTubeId(post.youtubeLink);
        return videoId ? (
          <div className="mt-3 rounded-xl overflow-hidden relative"
            style={{ paddingBottom: '56.25%', height: 0 }}>
            {playing ? (
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                title="YouTube video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 group cursor-pointer" onClick={() => setPlaying(true)}>
                <img
                  src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                  alt="YouTube thumbnail"
                  className="w-full h-full object-cover"
                />
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
            className="inline-block mt-2 text-xs text-green-700 hover:underline">
            ▶ Watch on YouTube →
          </a>
        );
      })()}

      {/* actions */}
      <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100">
        <button onClick={toggleLike}
          className={`flex items-center gap-1 text-sm transition-colors ${liked ? 'text-orange-500' : 'text-gray-400 hover:text-orange-500'}`}>
          <span>{liked ? '❤️' : '🤍'}</span>
          <span>{likes}</span>
        </button>
      </div>
    </div>
  );
}
