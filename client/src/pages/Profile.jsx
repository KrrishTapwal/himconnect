import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import ConnectModal from '../components/ConnectModal';
import PostCard from '../components/PostCard';

export default function Profile() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const nav = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConnect, setShowConnect] = useState(false);

  const isOwn = !id || id === me?._id;
  const targetId = id || me?._id;

  useEffect(() => {
    if (!targetId) return;
    Promise.all([
      api.get(`/users/${targetId}`),
      api.get('/posts', { params: { userId: targetId } })
    ]).then(([userRes, postsRes]) => {
      setProfile(userRes.data);
      setPosts(postsRes.data.posts);
    }).finally(() => setLoading(false));
  }, [targetId]);

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-8 text-center text-gray-400">Loading…</div>;
  if (!profile) return <div className="max-w-2xl mx-auto px-4 py-8 text-center text-gray-400">User not found</div>;

  const initials = profile.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      {/* avatar + info */}
      <div className="card mb-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-green-700 flex items-center justify-center text-white text-xl font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{profile.name}</h1>
              {profile.isTrustedMentor && <span className="badge-orange">⭐ Trusted Mentor</span>}
              {profile.isFoundingMember && <span className="badge-green">🏔️ Founding Member</span>}
            </div>
            <p className="text-sm text-gray-600 mt-0.5">
              {profile.role === 'mentor' && profile.profession ? `${profile.profession}${profile.company ? ` @ ${profile.company}` : ''}` : profile.college || ''}
            </p>
            <p className="text-sm text-gray-500">
              {[profile.hometownDistrict && `📍 ${profile.hometownDistrict}`, profile.currentCity && `🏙️ ${profile.currentCity}`].filter(Boolean).join(' · ')}
            </p>
            {profile.bio && <p className="text-sm text-gray-700 mt-2">{profile.bio}</p>}
          </div>
        </div>

        {/* stats */}
        <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100 flex-wrap">
          {profile.role === 'mentor' ? (
            <>
              <Stat label="Sessions" value={profile.totalSessions || 0} />
              <Stat label="Rating" value={profile.avgRating ? `${profile.avgRating.toFixed(1)}⭐` : '—'} />
              <Stat label="Help streak" value={`🔥 ${profile.helpStreak || 0}`} />
            </>
          ) : (
            <Stat label="Learn streak" value={`🔥 ${profile.learnStreak || 0}`} />
          )}
          {profile.points > 0 && (
            <Stat label="Points" value={`🪙 ${profile.points}`} />
          )}
        </div>

        {/* openTo */}
        {profile.openTo?.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-3">
            {profile.openTo.map(o => <span key={o} className="badge-green">{o === 'MockInterview' ? 'Mock Interview' : o}</span>)}
          </div>
        )}

        {/* skills */}
        {profile.skills?.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-2">
            {profile.skills.map(s => <span key={s} className="badge-gray">{s}</span>)}
          </div>
        )}

        {/* links */}
        <div className="flex gap-3 mt-4">
          {profile.linkedinUrl && (
            <a href={profile.linkedinUrl} target="_blank" rel="noreferrer"
              className="text-sm text-green-700 font-medium hover:underline">LinkedIn →</a>
          )}
          {profile.meetLink && profile.role === 'mentor' && (
            <a href={profile.meetLink} target="_blank" rel="noreferrer"
              className="text-sm text-green-700 font-medium hover:underline">Meet link →</a>
          )}
        </div>

        {/* actions */}
        {!isOwn && (
          <div className="flex gap-2 mt-4">
            <button className="btn-primary flex-1" onClick={() => setShowConnect(true)}>
              Request Meet
            </button>
            <button className="btn-secondary flex-1" onClick={() => nav(`/messages/dm/${profile._id}`)}>
              Message
            </button>
          </div>
        )}
        {isOwn && (
          <button className="btn-secondary w-full mt-4" onClick={() => nav('/settings')}>Edit Profile</button>
        )}
      </div>

      {/* posts */}
      {posts.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">Posts by {isOwn ? 'you' : profile.name}</h2>
          <div className="space-y-3">
            {posts.map(p => <PostCard key={p._id} post={p} currentUserId={me?._id} />)}
          </div>
        </div>
      )}

      {showConnect && (
        <ConnectModal mentor={profile} onClose={() => setShowConnect(false)} />
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
