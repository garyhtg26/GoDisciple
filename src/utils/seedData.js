/**
 * seedData.js
 * Run this once from a trusted environment (Node.js or admin panel)
 * using the Firebase Admin SDK or Firestore REST API.
 *
 * For quick seeding during development, you can also use
 * Firebase Console > Firestore > Add document manually,
 * or paste this data into the Firestore Emulator.
 *
 * Structure mirrors your Firestore collections exactly.
 */

export const SEED_BANNERS = [
  {
    id: 'banner1',
    imageURL: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800',
    title: 'Welcome to Go Disciple',
    order: 1,
  },
];

export const SEED_NEWS = [
  {
    id: 'news1',
    title: 'Sunday Service – Special Worship Night',
    excerpt: 'Join us this Sunday for a special worship night as we enter the new season together.',
    imageURL: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600',
    category: 'ANNOUNCEMENT',
    createdAt: new Date('2026-06-01'),
  },
  {
    id: 'news2',
    title: 'New Discipleship Groups Starting July',
    excerpt: 'We are opening new discipleship groups this July. Sign up and find your community.',
    imageURL: null,
    category: 'NEWS',
    createdAt: new Date('2026-05-28'),
  },
  {
    id: 'news3',
    title: 'Bible Study: Book of John – Week 4',
    excerpt: 'This week we dive into John 6 — The Bread of Life. Come prepared with questions!',
    imageURL: null,
    category: 'BIBLE STUDY',
    createdAt: new Date('2026-05-25'),
  },
];

export const SEED_BIBLE_THEME = [
  {
    id: 'theme1',
    title: 'Abide in the Vine',
    subtitle: 'Living in Union with Christ',
    scriptureReference: 'John 15:5',
    scriptureText: 'I am the vine; you are the branches. If you remain in me and I in you, you will bear much fruit; apart from me you can do nothing.',
    description: 'This month we reflect on what it means to truly abide in Christ — to stay connected to His Word, His Spirit, and His people. As branches draw life from the vine, so we draw every strength from Jesus. This is not a passive waiting but an active daily choosing: to read, to pray, to serve, to love.',
    imageURL: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800',
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    isActive: true,
  },
];

export const SEED_GROUPS = [
  {
    id: 'group1',
    name: 'Kelompok Kecil Alpha',
    description: 'A vibrant group for young professionals seeking to grow deeper in faith and community.',
    logoURL: null,
    location: 'Jakarta Selatan',
    ageRange: '20-30',
    meetingSchedule: 'Every Saturday, 7:00 PM',
    leaderId: null,
    coLeaderIds: [],
    memberIds: [],
    socials: { instagram: 'kkAlpha', whatsapp: null },
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'group2',
    name: 'Kelompok Kecil Berkat',
    description: 'A close-knit group studying the Psalms and learning to worship in all seasons of life.',
    logoURL: null,
    location: 'Jakarta Pusat',
    ageRange: '25-35',
    meetingSchedule: 'Every Friday, 6:30 PM',
    leaderId: null,
    coLeaderIds: [],
    memberIds: [],
    socials: { instagram: 'kkBerkat', whatsapp: null },
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15'),
  },
  {
    id: 'group3',
    name: 'Kelompok Kecil Cahaya',
    description: 'For students and young adults wanting to build strong discipleship foundations.',
    logoURL: null,
    location: 'Tangerang',
    ageRange: '18-24',
    meetingSchedule: 'Every Sunday, 4:00 PM',
    leaderId: null,
    coLeaderIds: [],
    memberIds: [],
    socials: { instagram: null, whatsapp: null },
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date('2026-02-01'),
  },
];

export const SEED_SCHEDULES = [
  {
    id: 'sched1',
    title: 'Sunday Morning Service',
    type: 'service',
    description: 'Weekly Sunday worship service. All are welcome.',
    location: 'GKDI Main Sanctuary',
    startDateTime: new Date('2026-06-08T09:00:00'),
    endDateTime: new Date('2026-06-08T11:00:00'),
    groupId: null,
    createdBy: 'admin',
    isPublic: true,
    createdAt: new Date(),
  },
  {
    id: 'sched2',
    title: 'Youth Special Night',
    type: 'event',
    description: 'An evening of worship, testimonies, and fellowship for the youth.',
    location: 'GKDI Hall B',
    startDateTime: new Date('2026-06-14T18:00:00'),
    endDateTime: new Date('2026-06-14T21:00:00'),
    groupId: null,
    createdBy: 'admin',
    isPublic: true,
    createdAt: new Date(),
  },
  {
    id: 'sched3',
    title: 'Discipleship Training Module 1',
    type: 'training',
    description: 'Introduction to Biblical discipleship for new leaders.',
    location: 'Online – Zoom',
    startDateTime: new Date('2026-06-21T10:00:00'),
    endDateTime: new Date('2026-06-21T12:00:00'),
    groupId: null,
    createdBy: 'admin',
    isPublic: true,
    createdAt: new Date(),
  },
];

export const SEED_STREAM_POSTS = [
  {
    id: 'post1',
    authorId: 'seed-user',
    authorName: 'Pastor David',
    authorPhotoURL: null,
    content: 'Today during morning prayer I was reminded of John 15:5 — "apart from me you can do nothing." In a world that tells us to do more, achieve more, hustle more — Jesus says: abide. Stay. Rest. That is where fruit grows. 🌿',
    category: 'reflection',
    visibility: 'public',
    groupId: null,
    likeCount: 12,
    commentCount: 3,
    createdAt: new Date('2026-06-02T07:30:00'),
    updatedAt: new Date('2026-06-02T07:30:00'),
  },
  {
    id: 'post2',
    authorId: 'seed-user-2',
    authorName: 'Maria S.',
    authorPhotoURL: null,
    content: 'Testimony: I was struggling with fear about my job situation for weeks. Last night during our group meeting, we prayed together, and today I received an unexpected call with good news. God is faithful! 🙌 Thank you Lord.',
    category: 'testimony',
    visibility: 'public',
    groupId: null,
    likeCount: 28,
    commentCount: 7,
    createdAt: new Date('2026-06-01T19:00:00'),
    updatedAt: new Date('2026-06-01T19:00:00'),
  },
];

/**
 * HOW TO SEED:
 *
 * Option 1 – Firebase Console:
 *   Go to Firestore > Create collection > manually add documents
 *   using the data above. Copy/paste each field.
 *
 * Option 2 – Emulator:
 *   Import this file in a local seed script and use
 *   the Firebase Admin SDK to batch-write these documents.
 *
 * Option 3 – Admin CMS:
 *   Use the /admin panel once built to create content
 *   through the UI.
 */
