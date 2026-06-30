// This represents the data layer that will be fetched from your Amazon backend later.
// Field names here are the canonical contract — all views must use these field names.

export const mockCategories = [
    { id: 'c1', title: 'Old Testament',           subtitle: '39 books',  count: 39, image: '/assets/images/categories/cat-old-testament.png' },
    { id: 'c2', title: 'New Testament',           subtitle: '27 books',  count: 27, image: '/assets/images/categories/cat-new-testament.png' },
    { id: 'c3', title: 'Audio Stories',           subtitle: '32 stories',count: 32, image: '/assets/images/categories/cat-old-audio.png' },
    { id: 'c4', title: 'Bedtime Stories',         subtitle: '53 stories',count: 53, image: '/assets/images/categories/cat-bedtime.png' },
    { id: 'c5', title: 'Christian Biblical Music',subtitle: '20 tracks', count: 20, image: '/assets/images/music/christian-1.png' },
    { id: 'c6', title: 'Hebrew Biblical Music',   subtitle: '20 tracks', count: 20, image: '/assets/images/music/hebrew-1.png' },
];

export const mockStories = [
    { id: 's1', title: 'Isaiah',          type: 'Old Testament', duration: '12 min', image: '/assets/images/books/ot-isaiah.png' },
    { id: 's2', title: '2 Chronicles',    type: 'Old Testament', duration: '10 min', image: '/assets/images/books/ot-2chronicles.png' },
    { id: 's3', title: 'Ruth',            type: 'Old Testament', duration: '8 min',  image: '/assets/images/books/ot-ruth.png' },
    { id: 's4', title: 'Judges',          type: 'Old Testament', duration: '9 min',  image: '/assets/images/books/ot-judges.png' },
    { id: 's5', title: '2 Thessalonians', type: 'New Testament', duration: '7 min',  image: '/assets/images/books/nt-2thessalonians.png' },
    { id: 's6', title: 'Revelation',      type: 'New Testament', duration: '15 min', image: '/assets/images/books/nt-revelation.png' },
    { id: 's7', title: '1 Corinthians',   type: 'New Testament', duration: '11 min', image: '/assets/images/books/nt-1corinthians.png' },
];

export const mockAudio = [
    { id: 'a1', title: '2 Chronicles',  category: 'Old Audio Testament', duration: '10 min', image: '/assets/images/audio/audio-ot-2chronicles.png', badgeColor: 'purple' },
    { id: 'a2', title: 'Amos',          category: 'Old Audio Testament', duration: '10 min', image: '/assets/images/audio/audio-ot-amos.png',        badgeColor: 'purple' },
    { id: 'a3', title: 'Ecclesiastes',  category: 'Old Audio Testament', duration: '10 min', image: '/assets/images/audio/audio-ot-ecclesiastes.png', badgeColor: 'purple' },
    { id: 'a4', title: '2 Chronicles',  category: 'New Audio Testament', duration: '10 min', image: '/assets/images/audio/audio-nt-2chronicles.png', badgeColor: 'orange' },
    { id: 'a5', title: 'Ephesians',     category: 'New Audio Testament', duration: '10 min', image: '/assets/images/audio/audio-nt-ephesians.png',   badgeColor: 'orange' },
    { id: 'a6', title: 'Galatians',     category: 'New Audio Testament', duration: '10 min', image: '/assets/images/audio/audio-nt-galatians.png',   badgeColor: 'orange' },
];

export const mockMusic = [
    { id: 'm1', title: 'Psalm 23',           type: 'Hebrew Biblical Music',    image: '/assets/images/music/hebrew-1.png' },
    { id: 'm2', title: 'Shema Yisrael',      type: 'Hebrew Biblical Music',    image: '/assets/images/music/hebrew-2.png' },
    { id: 'm3', title: 'Amazing Grace',      type: 'Christian Biblical Music', image: '/assets/images/music/christian-1.png' },
    { id: 'm4', title: 'How Great Thou Art', type: 'Christian Biblical Music', image: '/assets/images/music/christian-2.png' },
];

export const mockShopProducts = [
    { id: 'p1', title: 'Kids Bible Stories', category: 'Old Testament', catColor: '#9747ff', image: '/assets/images/books/ot-isaiah.png', websiteUrl: 'https://thekidsbiblestories.com/products/kids-bible-stories-old-testament', stories: '25+', ages: '3-12', pages: '15' },
    { id: 'p2', title: 'Kids Bible Stories', category: 'New Testament', catColor: '#ff7547', image: '/assets/images/books/nt-matthew.png', websiteUrl: 'https://thekidsbiblestories.com/products/kids-bible-stories-new-testament-digital-tablet-wallpaper', stories: '25+', ages: '3-12', pages: '15' },
];

// IMPORTANT: Use 'body' field for notification message text (not 'desc')
// type: 'approval' + status: 'pending' → shows Decline/Approve buttons
// status: 'approved' → shows green Approved badge
// status: 'declined' → shows red Request declined badge
// no type/status → plain notification card
export const mockNotifications = [
    { id: 'n1', title: 'Your child is ready to start 🎉', time: 'now',          body: 'Approve their account so they can begin exploring Bible stories.', read: false, type: 'approval', status: 'pending' },
    { id: 'n2', title: 'Keep your streak alive 🔥',       time: 'Dec 16, 2026', body: 'Just 5 minutes of practice today keeps you on track.',             read: false },
    { id: 'n3', title: 'Keep your streak alive 🔥',       time: 'Dec 15, 2026', body: 'Just 5 minutes of practice today keeps you on track.',             read: true  },
];
