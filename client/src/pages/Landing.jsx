import { useNavigate } from 'react-router-dom';

const FEATURES = [
  { icon: '🧑‍💼', title: 'Find a Mentor', desc: 'Connect with HP seniors placed at top companies & colleges. Get real guidance, not generic advice.' },
  { icon: '💼', title: 'Jobs & Referrals', desc: 'HP professionals post jobs with referrals. Get your resume seen by someone who already works there.' },
  { icon: '🏔️', title: 'District Rooms', desc: 'Live chat rooms for all 12 HP districts. Find people from your own village, town, or college.' },
  { icon: '🎓', title: 'HP Wins Feed', desc: 'Read real stories — JEE cracks, job offers, UPSC selections — all from HP students like you.' },
  { icon: '🤝', title: 'Schedule a Meet', desc: 'Book a 15-min Chai chat, 30-min career session, or 60-min mock interview with any mentor.' },
  { icon: '🔥', title: 'Streaks & Points', desc: 'Earn points for learning daily. First 1000 users get Founding Member badge + 100 bonus points.' },
];

const DISTRICTS = ['Shimla', 'Mandi', 'Kangra', 'Kullu', 'Hamirpur', 'Solan', 'Bilaspur', 'Chamba', 'Una', 'Kinnaur', 'Sirmaur', 'Lahaul-Spiti'];

export default function Landing() {
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-white">

      {/* navbar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <span className="font-bold text-green-700 text-lg">HimConnect</span>
        <div className="flex gap-2">
          <button onClick={() => nav('/login')} className="btn-secondary text-sm px-4 py-1.5">Sign in</button>
          <button onClick={() => nav('/signup')} className="btn-primary text-sm px-4 py-1.5">Join free</button>
        </div>
      </header>

      {/* hero */}
      <section className="text-center px-6 py-16 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-500 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          🏔️ Built for Himachal Pradesh
        </div>
        <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-4">
          HP Students meet<br />
          <span className="text-green-700">HP Mentors & Jobs</span>
        </h1>
        <p className="text-gray-500 text-base leading-relaxed mb-8">
          HimConnect is a free community platform where students from Himachal Pradesh
          find mentors, referrals, and job opportunities — from HP seniors who've been there.
          School students, college students, job seekers — everyone welcome.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={() => nav('/signup')} className="btn-primary px-8 py-3 text-base">
            Join HimConnect — It's Free
          </button>
          <button onClick={() => nav('/login')} className="btn-secondary px-6 py-3 text-base">
            Sign in
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-4">First 1000 users get Founding Member badge + 100 points</p>
      </section>

      {/* districts strip */}
      <div className="bg-green-700 py-3 overflow-hidden">
        <div className="flex gap-6 animate-none whitespace-nowrap px-6 flex-wrap justify-center">
          {DISTRICTS.map(d => (
            <span key={d} className="text-white text-sm font-medium opacity-90">📍 {d}</span>
          ))}
        </div>
      </div>

      {/* what is it */}
      <section className="px-6 py-14 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">What is HimConnect?</h2>
        <p className="text-center text-gray-500 text-sm mb-10">
          A text-only, distraction-free community. No reels, no ads, no noise. Just HP people helping HP people.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FEATURES.map(f => (
            <div key={f.title} className="card flex gap-3 items-start">
              <span className="text-2xl shrink-0">{f.icon}</span>
              <div>
                <p className="font-semibold text-sm text-gray-900">{f.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* who is it for */}
      <section className="bg-gray-50 px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Who is it for?</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: '📚', label: 'School Students', desc: 'Class 9–12, board prep, JEE/NEET aspirants' },
              { icon: '🎓', label: 'College Students', desc: 'Engineering, medical, arts — any stream' },
              { icon: '💼', label: 'Job Seekers', desc: 'Fresh grads or experienced, looking for a break' },
              { icon: '🧑‍💼', label: 'HP Professionals', desc: 'Want to give back and mentor HP juniors' },
            ].map(item => (
              <div key={item.label} className="card text-center">
                <p className="text-3xl mb-2">{item.icon}</p>
                <p className="font-semibold text-sm text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* how it works */}
      <section className="px-6 py-12 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">How it works</h2>
        <div className="space-y-4">
          {[
            { step: '1', title: 'Create your free account', desc: 'Sign up in 30 seconds. No verification needed.' },
            { step: '2', title: 'Set up your profile', desc: 'Pick your district, field of interest, and what you need help with.' },
            { step: '3', title: 'Browse mentors & join rooms', desc: 'Filter mentors by field or district. Join your district\'s chat room.' },
            { step: '4', title: 'Request a meet', desc: 'Send a Chai / Career / Mock Interview request to any mentor.' },
          ].map(item => (
            <div key={item.step} className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-green-700 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                {item.step}
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-green-700 px-6 py-14 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">Ready to connect with HP?</h2>
        <p className="text-green-100 text-sm mb-6">Join free. No spam. No ads. Just community.</p>
        <button onClick={() => nav('/signup')} className="bg-white text-green-700 font-bold px-8 py-3 rounded-xl hover:bg-green-50 transition-colors text-base">
          Get Started — It's Free
        </button>
      </section>

      {/* footer */}
      <footer className="text-center py-6 text-xs text-gray-400 border-t border-gray-100">
        HimConnect · Built for HP students everywhere · Free forever
      </footer>

    </div>
  );
}
