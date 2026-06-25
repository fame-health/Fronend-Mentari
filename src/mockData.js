export const colors = {
  pink: "#E85F88",
  pinkSoft: "#FFE4EC",
  peach: "#F59D5C",
  peachSoft: "#FFEAD8",
  lavender: "#7B71E8",
  lavenderSoft: "#EDEBFF",
  mint: "#33B88F",
  mintSoft: "#E1F7EF",
  sky: "#4CA7D8",
  skySoft: "#E2F3FB",
  sun: "#F6C95F",
  white: "#FFFCF8",
  surface: "#FFFFFF",
  surfaceWarm: "#FFF7F0",
  ink: "#231F2B",
  muted: "#706B7B",
  line: "#EDE6EF"
};

export const navItems = [
  { id: "home", label: "Home", subtitle: "Ringkasan", icon: "home", color: colors.pink },
  { id: "mood", label: "Mood", subtitle: "Tracking harian", icon: "sentiment_satisfied", color: colors.pink },
  { id: "education", label: "Edukasi", subtitle: "Artikel admin", icon: "menu_book", color: colors.lavender },
  { id: "screening", label: "DASS-21", subtitle: "Screening cepat", icon: "assignment", color: colors.mint },
  { id: "analytics", label: "Analitik", subtitle: "Tren & statistik", icon: "monitoring", color: colors.peach },
  { id: "recommendation", label: "Rekomendasi", subtitle: "Coping personal", icon: "favorite", color: colors.sun },
  { id: "community", label: "Komunitas", subtitle: "Dukungan sekolah", icon: "groups", color: colors.lavender },
  { id: "profile", label: "Profil", subtitle: "Akun pengguna", icon: "person", color: colors.mint }
];

export const emptyActivityStats = [
  { label: "Mood Check-in", value: "0x", helper: "belum ada data", accentColor: colors.pink },
  { label: "Rata-rata Mood", value: "-", helper: "belum ada data", accentColor: colors.mint },
  { label: "Konten Dibaca", value: "0", helper: "belum ada data", accentColor: colors.lavender },
  { label: "Dukungan", value: "0", helper: "belum ada data", accentColor: colors.peach }
];

export function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

export const fallbackData = {
  profile: {
    id: 0,
    name: "Aurel Putri",
    email: "aurel.putri@sekolah.sch.id",
    school: "SMA Mentari Bangsa",
    level: "Kelas XI",
    initial: "A",
    streakDays: 12,
    joinedLabel: "Bergabung sejak Juni 2026",
    canTakeScreening: true
  },
  moodOptions: [
    { id: 1, emoji: "😢", label: "Buruk", description: "Butuh dukungan", color: "#E85F88", score: 1 },
    { id: 2, emoji: "😟", label: "Kurang", description: "Agak berat", color: "#F59D5C", score: 2 },
    { id: 3, emoji: "😐", label: "Biasa", description: "Stabil", color: "#F6C95F", score: 3 },
    { id: 4, emoji: "🙂", label: "Baik", description: "Cukup ringan", color: "#33B88F", score: 4 },
    { id: 5, emoji: "😊", label: "Hebat", description: "Sangat baik", color: "#7B71E8", score: 5 }
  ],
  moodEntries: [],
  riskAlerts: [
    {
      id: 1,
      level: "attention",
      title: "Perhatikan pola stres",
      message: "Stres sempat naik pada pertengahan minggu.",
      recommendation: "Ambil jeda 10 menit, tulis pemicu utama, dan pilih satu aktivitas coping ringan."
    }
  ],
  educationCategories: [
    { id: "all", title: "Semua", description: "Semua materi admin" },
    { id: "stress", title: "Manajemen Stres", description: "" },
    { id: "relation", title: "Relasi", description: "" },
    { id: "habit", title: "Kebiasaan Sehat", description: "" }
  ],
  educationContents: [
    {
      id: 1,
      title: "Teknik napas 4-7-8 saat cemas",
      categoryId: "stress",
      categoryTitle: "Manajemen Stres",
      type: "ARTICLE",
      readTime: "4 menit",
      summary: "Latihan napas sederhana untuk menurunkan ketegangan sebelum belajar atau presentasi.",
      body: "Tarik napas 4 hitungan, tahan 7 hitungan, lalu embuskan 8 hitungan. Ulangi beberapa putaran dengan ritme yang nyaman.",
      mediaUrl: "",
      accentColor: colors.pink
    },
    {
      id: 2,
      title: "Mengenali tanda burnout pelajar",
      categoryId: "habit",
      categoryTitle: "Kebiasaan Sehat",
      type: "INFOGRAPHIC",
      readTime: "6 menit",
      summary: "Pahami sinyal tubuh dan pikiran ketika beban akademik mulai terlalu berat.",
      body: "Burnout dapat muncul sebagai lelah berkepanjangan, sulit fokus, dan kehilangan minat terhadap aktivitas harian.",
      mediaUrl: "",
      accentColor: colors.lavender
    },
    {
      id: 3,
      title: "Cara meminta bantuan dengan aman",
      categoryId: "relation",
      categoryTitle: "Relasi",
      type: "VIDEO",
      readTime: "8 menit",
      summary: "Panduan berbicara dengan guru BK, wali kelas, atau teman tepercaya.",
      body: "Mulai dari kalimat sederhana: saya sedang kesulitan dan butuh ditemani bicara.",
      mediaUrl: "",
      accentColor: colors.mint
    }
  ],
  latestScreening: {
    id: 1,
    dateLabel: "23 Jun 2026",
    summary: "Pantau kondisi secara berkala.",
    scores: [
      { label: "Depresi", rawScore: 12, severity: "Ringan", color: colors.mint },
      { label: "Kecemasan", rawScore: 18, severity: "Sedang", color: colors.peach },
      { label: "Stres", rawScore: 20, severity: "Sedang", color: colors.pink }
    ]
  },
  screeningResults: [],
  screeningQuestions: [
    { id: 1, number: 1, scale: "STRESS", text: "Saya sulit menenangkan diri setelah sesuatu membuat saya kesal." },
    { id: 2, number: 2, scale: "ANXIETY", text: "Saya merasa mulut saya kering tanpa alasan yang jelas." },
    { id: 3, number: 3, scale: "DEPRESSION", text: "Saya merasa tidak punya hal yang bisa diharapkan." }
  ],
  recommendations: [
    {
      id: 1,
      title: "Jurnal 3 hal yang bisa dikendalikan",
      category: "Coping singkat",
      description: "Tulis satu kekhawatiran, satu tindakan kecil, dan satu orang yang bisa dihubungi.",
      duration: "10 menit",
      priority: "Prioritas",
      accentColor: colors.pink
    },
    {
      id: 2,
      title: "Grounding 5-4-3-2-1",
      category: "Regulasi emosi",
      description: "Gunakan indera untuk kembali ke kondisi saat ini ketika pikiran terasa penuh.",
      duration: "5 menit",
      priority: "Ringan",
      accentColor: colors.lavender
    },
    {
      id: 3,
      title: "Jalan kaki tanpa gawai",
      category: "Aktivitas fisik",
      description: "Berjalan pelan sambil memperhatikan ritme napas dan lingkungan sekitar.",
      duration: "15 menit",
      priority: "Opsional",
      accentColor: colors.mint
    }
  ],
  communityPosts: [
    {
      id: 1,
      author: "Bu Rina",
      role: "Guru BK",
      timeLabel: "Hari ini",
      tag: "Pengumuman",
      content: "Reminder: ruang konseling terbuka setiap istirahat kedua. Datang sendiri atau bersama teman tepercaya.",
      likes: 18,
      likedByMe: true,
      isPinned: true,
      isMine: false
    },
    {
      id: 2,
      author: "Aurel",
      role: "Siswa",
      timeLabel: "2 jam lalu",
      tag: "Cerita",
      content: "Aku mencoba latihan napas sebelum presentasi. Tidak langsung hilang cemasnya, tapi jadi lebih bisa mulai.",
      likes: 6,
      likedByMe: false,
      isPinned: false,
      isMine: true
    }
  ],
  activityStats: [
    { label: "Mood Check-in", value: "12x", helper: "bulan ini", accentColor: colors.pink },
    { label: "Rata-rata Mood", value: "3.8", helper: "stabil naik", accentColor: colors.mint },
    { label: "Konten Dibaca", value: "9", helper: "artikel/video", accentColor: colors.lavender },
    { label: "Dukungan", value: "24", helper: "interaksi komunitas", accentColor: colors.peach }
  ],
  schools: []
};

const todaySeed = [
  ["Sen", "17 Jun", 2, "Hari cukup stabil.", 6, 4],
  ["Sel", "18 Jun", 3, "Lebih fokus setelah olahraga.", 7, 3],
  ["Rab", "19 Jun", 1, "Tugas menumpuk.", 4, 7],
  ["Kam", "20 Jun", 3, "Bisa bicara dengan teman.", 7, 4],
  ["Jum", "21 Jun", 4, "Presentasi berjalan lancar.", 8, 2],
  ["Sab", "22 Jun", 2, "Istirahat di rumah.", 6, 3],
  ["Min", "23 Jun", 3, "Siap mulai minggu baru.", 7, 3]
];

fallbackData.moodEntries = todaySeed.map(([dayName, dateLabel, moodIndex, note, energy, stress], index) => ({
  id: index + 1,
  entryDate: `2026-06-${17 + index}`,
  dayName,
  dateLabel,
  mood: fallbackData.moodOptions[moodIndex],
  note,
  energy,
  stress
}));

fallbackData.screeningResults = [fallbackData.latestScreening];

export function createEmptyUserData(profile = {}) {
  const data = cloneData(fallbackData);
  const emptyProfile = {
    id: 0,
    name: "",
    email: "",
    school: "Sekolah belum ditentukan",
    level: "",
    initial: "M",
    streakDays: 0,
    joinedLabel: "",
    canTakeScreening: true
  };
  const mergedProfile = { ...emptyProfile, ...profile };

  data.profile = {
    ...mergedProfile,
    initial: mergedProfile.initial || mergedProfile.name.slice(0, 1).toUpperCase() || "M",
    streakDays: Number(mergedProfile.streakDays || 0),
    canTakeScreening: mergedProfile.canTakeScreening == null ? true : mergedProfile.canTakeScreening
  };
  data.moodEntries = [];
  data.riskAlerts = [];
  data.latestScreening = null;
  data.screeningResults = [];
  data.recommendations = [];
  data.communityPosts = [];
  data.activityStats = cloneData(emptyActivityStats);

  return data;
}
