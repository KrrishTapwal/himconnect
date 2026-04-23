import { motion } from 'framer-motion';
import SpotlightCard from './ui/SpotlightCard';

const OPEN_LABEL = { Mentorship: 'Mentor', Referrals: 'Referrals', Chai: 'Chai', MockInterview: 'Mock' };

export default function MentorCard({ mentor, onClick }) {
  const initials = mentor.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <SpotlightCard className="card cursor-pointer border hover:border-green-200 transition-colors" onClick={onClick}>
        <div className="flex items-start gap-3">
          <motion.div
            whileHover={{ scale: 1.08 }}
            className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-800 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm"
          >
            {initials}
          </motion.div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="font-semibold text-sm">{mentor.name}</p>
              {mentor.isTrustedMentor && <span className="text-xs text-orange-500">⭐ Trusted</span>}
              {mentor.isFoundingMember && <span className="text-xs text-green-700">🏔️ Founding</span>}
            </div>
            <p className="text-xs text-gray-600">
              {[mentor.profession, mentor.company && `@ ${mentor.company}`].filter(Boolean).join(' ')}
            </p>
            <p className="text-xs text-gray-500">
              {[mentor.hometownDistrict && `📍 ${mentor.hometownDistrict}`, mentor.college].filter(Boolean).join(' · ')}
            </p>
            {mentor.bio && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{mentor.bio}</p>}
          </div>
          <div className="text-right shrink-0">
            {mentor.avgRating > 0 && (
              <p className="text-xs font-semibold text-orange-500">{mentor.avgRating.toFixed(1)} ⭐</p>
            )}
            {mentor.totalSessions > 0 && (
              <p className="text-xs text-gray-400">{mentor.totalSessions} sessions</p>
            )}
          </div>
        </div>

        <div className="flex gap-1.5 flex-wrap mt-2">
          {mentor.fieldOfInterest && <span className="badge-green">{mentor.fieldOfInterest}</span>}
          {mentor.openTo?.slice(0, 3).map(o => (
            <span key={o} className="badge-gray">{OPEN_LABEL[o] || o}</span>
          ))}
        </div>
      </SpotlightCard>
    </motion.div>
  );
}
