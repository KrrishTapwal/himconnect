require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Post = require('../models/Post');
const Job = require('../models/Job');

const districts = ['Shimla', 'Mandi', 'Kangra', 'Kullu', 'Hamirpur', 'Solan', 'Bilaspur', 'Chamba', 'Una', 'Kinnaur'];
const fields = ['CSE', 'Mechanical', 'Civil', 'Medical', 'UPSC', 'JEE prep', 'NEET prep', 'MBA'];

const mentors = [
  { name: 'Aditya Sharma', email: 'aditya@himconnect.dev', district: 'Shimla', field: 'CSE', profession: 'SDE-2', company: 'Flipkart', college: 'NIT Hamirpur', year: 2021, bio: 'HP boy @ Flipkart. Happy to help!', skills: ['React', 'Node.js', 'DSA'], openTo: ['Mentorship', 'Referrals', 'MockInterview'] },
  { name: 'Priya Thakur', email: 'priya@himconnect.dev', district: 'Mandi', field: 'Medical', profession: 'MBBS Doctor', company: 'AIIMS Delhi', college: 'AIIMS Delhi', year: 2022, bio: 'AIIMS 2022. NEET AIR 340. HP is home.', skills: ['NEET', 'Biochemistry'], openTo: ['Mentorship', 'Chai'] },
  { name: 'Rohit Verma', email: 'rohit@himconnect.dev', district: 'Kangra', field: 'UPSC', profession: 'IAS Officer', company: 'HP Cadre', college: 'HP University', year: 2019, bio: 'IAS 2019. HP cadre. Let\'s connect!', skills: ['GS', 'Essay', 'Interview'], openTo: ['Mentorship', 'MockInterview'] },
  { name: 'Simran Negi', email: 'simran@himconnect.dev', district: 'Kullu', field: 'CSE', profession: 'ML Engineer', company: 'Google', college: 'IIT Delhi', year: 2020, bio: 'IIT Delhi → Google. HP proud.', skills: ['Python', 'ML', 'TensorFlow', 'DSA'], openTo: ['Mentorship', 'Referrals'] },
  { name: 'Vikram Chauhan', email: 'vikram@himconnect.dev', district: 'Hamirpur', field: 'Mechanical', profession: 'Design Engineer', company: 'Tata Motors', college: 'NIT Hamirpur', year: 2020, bio: 'Mech engineer @ Tata. Love mountains.', skills: ['AutoCAD', 'SolidWorks', 'GATE'], openTo: ['Mentorship', 'Chai'] },
  { name: 'Anjali Rana', email: 'anjali@himconnect.dev', district: 'Solan', field: 'MBA', profession: 'Product Manager', company: 'Razorpay', college: 'IIM Ahmedabad', year: 2021, bio: 'IIM-A → Razorpay PM. Ask me anything!', skills: ['Product', 'Strategy', 'CAT'], openTo: ['Mentorship', 'Referrals', 'MockInterview'] },
  { name: 'Deepak Jaswal', email: 'deepak@himconnect.dev', district: 'Bilaspur', field: 'CSE', profession: 'Backend Engineer', company: 'Swiggy', college: 'BITS Pilani', year: 2019, bio: 'BITS → Swiggy. Himachali at heart.', skills: ['Java', 'Microservices', 'AWS'], openTo: ['Mentorship', 'Referrals'] },
  { name: 'Kavita Dogra', email: 'kavita@himconnect.dev', district: 'Chamba', field: 'JEE prep', profession: 'JEE Educator', company: 'Unacademy', college: 'IIT Bombay', year: 2018, bio: 'IIT Bombay. Teaching JEE now. HP batch!', skills: ['Physics', 'Maths', 'JEE'], openTo: ['Mentorship', 'Chai', 'MockInterview'] },
  { name: 'Suresh Patel', email: 'suresh@himconnect.dev', district: 'Una', field: 'Civil', profession: 'Site Engineer', company: 'L&T', college: 'NIT Kurukshetra', year: 2020, bio: 'Civil @ L&T. GATE AIR 88.', skills: ['AutoCAD', 'STAAD Pro', 'GATE'], openTo: ['Mentorship'] },
  { name: 'Meena Kapoor', email: 'meena@himconnect.dev', district: 'Kinnaur', field: 'NEET prep', profession: 'Paediatrician', company: 'PGIMER Chandigarh', college: 'GMC Shimla', year: 2017, bio: 'PGIMER doc. Love helping HP NEET aspirants.', skills: ['NEET', 'Biology', 'Chemistry'], openTo: ['Mentorship', 'MockInterview'] },
];

const students = [
  { name: 'Rahul Nath', email: 'rahul@himconnect.dev', district: 'Shimla', field: 'CSE', college: 'NIT Hamirpur', year: 2026, bio: 'Final year CSE. Looking for SDE roles.', skills: ['C++', 'React'] },
  { name: 'Pooja Singh', email: 'pooja@himconnect.dev', district: 'Mandi', field: 'NEET prep', college: 'Govt College Mandi', year: 2025, bio: 'NEET 2025 aspirant. Study hard.', skills: ['Biology', 'Chemistry'] },
  { name: 'Arjun Mehta', email: 'arjun@himconnect.dev', district: 'Kangra', field: 'UPSC', college: 'HP University', year: 2024, bio: 'UPSC 2024. History optional.', skills: ['GS', 'History'] },
  { name: 'Ritika Sharma', email: 'ritika@himconnect.dev', district: 'Kullu', field: 'JEE prep', college: 'Allen Kota', year: 2025, bio: 'JEE 2025 drop. Physics is love.', skills: ['Physics', 'Maths'] },
  { name: 'Manish Thakur', email: 'manish@himconnect.dev', district: 'Hamirpur', field: 'Mechanical', college: 'NIT Hamirpur', year: 2025, bio: 'Mech 3rd year. GATE aspirant.', skills: ['GATE', 'AutoCAD'] },
  { name: 'Sanya Vaid', email: 'sanya@himconnect.dev', district: 'Solan', field: 'MBA', college: 'DAV College Chandigarh', year: 2024, bio: 'CAT prep 2024. Want to crack IIM.', skills: ['CAT', 'Excel'] },
  { name: 'Karan Pathania', email: 'karan@himconnect.dev', district: 'Bilaspur', field: 'CSE', college: 'Chitkara University', year: 2025, bio: 'Full stack dev learning. Open to intern.', skills: ['JavaScript', 'MongoDB'] },
  { name: 'Divya Rana', email: 'divya@himconnect.dev', district: 'Chamba', field: 'Medical', college: 'GMC Shimla', year: 2026, bio: '2nd year MBBS. Future doc!', skills: ['Anatomy', 'Physiology'] },
  { name: 'Abhishek Kumar', email: 'abhishek@himconnect.dev', district: 'Una', field: 'CSE', college: 'Lovely Professional University', year: 2025, bio: 'Placement prep. CP and dev.', skills: ['Python', 'DSA', 'Django'] },
  { name: 'Nisha Chandel', email: 'nisha@himconnect.dev', district: 'Kinnaur', field: 'Civil', college: 'NIT Kurukshetra', year: 2025, bio: 'Civil 3rd year. GATE 2026 target.', skills: ['GATE', 'Structures'] },
];

const seedPosts = (userIds) => [
  { userId: userIds[0], type: 'job_crack', title: 'Got SDE-2 at Flipkart!', body: 'After 6 months of prep, cracked Flipkart SDE-2. HP wale bhaiyo — DSA + system design = key. Start early. DM me if need help!', companyName: 'Flipkart', role: 'SDE-2', salary: '42 LPA' },
  { userId: userIds[2], type: 'exam_crack', title: 'IAS 2019 — My HP Journey', body: 'From Kangra to HP cadre IAS. 3rd attempt. History optional. Consistency beats intensity. HP batch is strong. Reach out anytime.', examName: 'UPSC CSE', rank: 'AIR 289', collegeCracked: 'HP Cadre' },
  { userId: userIds[3], type: 'job_crack', title: 'IIT Delhi → Google London', body: 'Placed at Google London via campus. ML role. Prep: Leetcode hard + ML projects. Himachal mein sapne bado hain! Ask me anything.', companyName: 'Google', role: 'ML Engineer', salary: '1.2 Cr' },
  { userId: userIds[7], type: 'tip', title: 'JEE 2025 aspirants — read this', body: 'Consistency > intensity. 6 hours focused > 12 hours distracted. HP students — Kota is good but online resources are equally good now. Save money.', youtubeLink: 'https://youtube.com/watch?v=example1' },
  { userId: userIds[5], type: 'tip', title: 'CAT prep in 6 months — roadmap', body: 'Month 1-2: Concepts. Month 3-4: Mock series. Month 5: Analysis. Month 6: weak areas. CAT is about percentile not marks. HP students are underrated!', youtubeLink: 'https://youtube.com/watch?v=example2' },
  { userId: userIds[10], type: 'question', title: 'Best coaching for NEET in Chandigarh?', body: 'I\'m from Mandi. Moving to Chandigarh for NEET prep. Which coaching is good — Aakash vs Allen vs Motion? Budget is limited. Please help seniors!' },
  { userId: userIds[14], type: 'question', title: 'NIT Hamirpur CSE placement record?', body: 'I got NIT Hamirpur CSE. Worried about placements. Is 7+ LPA realistic? What companies visit? Seniors please share your experience!' },
  { userId: userIds[1], type: 'exam_crack', title: 'AIIMS Delhi — NEET AIR 340', body: 'HP girl cracks AIIMS Delhi. AIR 340. Studied from home in Mandi till class 12. You don\'t need Kota to crack NEET. Believe in yourself!', examName: 'NEET', rank: 'AIR 340', collegeCracked: 'AIIMS Delhi' },
  { userId: userIds[6], type: 'story', title: 'Why I left a 30LPA job to mentor HP students', body: 'BITS → Swiggy. Life was good. But no HP mentors when I needed them. Started helping HP juniors. More fulfilling than any package. Join HimConnect!', youtubeLink: 'https://youtube.com/watch?v=example3' },
  { userId: userIds[4], type: 'tip', title: 'GATE Mechanical — Free resources that work', body: 'ACE Academy notes + NPTEL lectures + previous papers. That\'s it. GATE Mech AIR 88 with just these. Save your coaching money for post-GATE.', youtubeLink: 'https://youtube.com/watch?v=example4' },
];

const seedJobs = (userIds) => [
  { postedBy: userIds[0], role: 'SDE Intern', company: 'Flipkart', location: 'Bangalore', salary: '60k/month', skillsRequired: ['DSA', 'React', 'Node.js'], referralAvailable: true, description: 'Summer intern role. Apply through me for referral.' },
  { postedBy: userIds[3], role: 'ML Intern', company: 'Google', location: 'Hyderabad', salary: '80k/month', skillsRequired: ['Python', 'ML', 'TensorFlow'], referralAvailable: true, description: 'Google STEP Intern. Competitive but worth it.' },
  { postedBy: userIds[6], role: 'Backend Intern', company: 'Swiggy', location: 'Bangalore', salary: '50k/month', skillsRequired: ['Java', 'Spring Boot', 'MySQL'], referralAvailable: true, description: 'Swiggy backend intern. HP students get priority referral from me!' },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await User.deleteMany({});
  await Post.deleteMany({});
  await Job.deleteMany({});
  console.log('Cleared existing data');

  const hash = await bcrypt.hash('Test@1234', 10);

  const mentorDocs = await User.insertMany(mentors.map((m, i) => ({
    ...m,
    hometownDistrict: m.district,
    graduationYear: m.year,
    role: 'mentor',
    passwordHash: hash,
    fieldOfInterest: m.field,
    isFoundingMember: true,
    onboardingComplete: true,
    helpStreak: Math.floor(Math.random() * 30) + 1,
    avgRating: 4 + Math.random(),
    totalSessions: Math.floor(Math.random() * 20) + 5,
    isTrustedMentor: i < 5
  })));

  const studentDocs = await User.insertMany(students.map(s => ({
    ...s,
    hometownDistrict: s.district,
    graduationYear: s.year,
    role: 'student',
    passwordHash: hash,
    fieldOfInterest: s.field,
    isFoundingMember: true,
    onboardingComplete: true,
    learnStreak: Math.floor(Math.random() * 15) + 1,
    openTo: ['Mentorship']
  })));

  const allUsers = [...mentorDocs, ...studentDocs];
  const userIds = allUsers.map(u => u._id);

  await Post.insertMany(seedPosts(userIds));
  await Job.insertMany(seedJobs(userIds));

  console.log(`Seeded: ${mentorDocs.length} mentors, ${studentDocs.length} students, 10 posts, 3 jobs`);
  console.log('All accounts password: Test@1234');
  console.log('Sample login: aditya@himconnect.dev / Test@1234');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
