import { useEffect, useMemo, useState } from "react";
import {
  API_BASE_URL,
  changePassword,
  createCommunityPost,
  deleteMoodEntry,
  getStoredToken,
  loadMentariData,
  loadSchools,
  login,
  logout,
  register,
  saveMoodEntry,
  submitScreening,
  toggleCommunityLike,
  updateProfile
} from "./api";
import { colors, fallbackData, navItems } from "./mockData";

const bottomNav = navItems.filter((item) =>
  ["home", "mood", "screening", "community", "profile"].includes(item.id)
);
const quickMenu = navItems.filter((item) => item.id !== "home" && item.id !== "profile");

const pageCopy = {
  home: ["Dashboard MENTARI", "Ringkasan kondisi harian, konten edukasi, dan dukungan sekolah."],
  mood: ["Jurnal Mood", "Luangkan satu menit untuk jujur pada perasaanmu hari ini."],
  education: ["Edukasi", "Temukan materi ringan untuk membantu tetap ceria dan aman."],
  screening: ["Screening", "Kenali dirimu lebih baik dengan pertanyaan DASS-21 sederhana."],
  analytics: ["Dashboard Analitik", "Pantau tren mood, screening, dan aktivitas kesehatan mental."],
  recommendation: ["Rekomendasi Personal", "Aktivitas, edukasi, dan strategi coping berdasarkan kondisi terakhirmu."],
  community: ["Komunitas Sekolah", "Forum dukungan sebaya, edukasi, dan pengumuman kesehatan mental."],
  profile: ["Profil Pengguna", "Kelola identitas, preferensi, dan ringkasan aktivitas."]
};

const iconFallbacks = {
  arrow_back: "<",
  arrow_forward: ">",
  article: "A",
  assignment: "T",
  auto_awesome: "*",
  bolt: "!",
  calendar: "D",
  calendar_month: "D",
  chat_bubble: "C",
  check: "V",
  check_circle: "V",
  delete: "X",
  favorite: "F",
  groups: "K",
  home: "H",
  image: "I",
  info: "i",
  lightbulb: "L",
  menu_book: "E",
  monitoring: "A",
  notifications: "!",
  open_in_new: "^",
  person: "P",
  play_circle: ">",
  school: "S",
  search: "S",
  sentiment_satisfied: "M",
  shield: "S",
  trending_up: "^"
};

export default function App() {
  const [activePage, setActivePage] = useState("home");
  const [selectedEducationContent, setSelectedEducationContent] = useState(null);
  const [token, setToken] = useState(getStoredToken());
  const [data, setData] = useState(fallbackData);
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const refreshData = async () => {
    if (!token && !getStoredToken()) return;
    setIsLoading(true);
    setError("");
    try {
      setData(await loadMentariData());
    } catch (err) {
      if (err.status === 401) {
        await logout();
        setToken(null);
        setError("Sesi berakhir. Silakan masuk kembali.");
      } else {
        setError(err.message || "Gagal memuat data dari server.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) refreshData();
  }, [token]);

  useEffect(() => {
    if (!document.fonts?.load) return;

    let cancelled = false;
    document.fonts
      .load('24px "Material Symbols Rounded"', "home")
      .then((fonts) => {
        if (!cancelled && fonts.length) {
          document.documentElement.classList.add("material-icons-ready");
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogin = async (email, password) => {
    setIsLoading(true);
    setError("");
    try {
      const result = await login(email, password);
      setToken(result.token);
      setMessage(result.message || "Login berhasil.");
      if (result.profile) setData((current) => ({ ...current, profile: result.profile }));
    } catch (err) {
      setError(err.message || "Login gagal.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (payload) => {
    setIsLoading(true);
    setError("");
    try {
      const result = await register(payload);
      setToken(result.token);
      setMessage(result.message || "Registrasi berhasil.");
      if (result.profile) setData((current) => ({ ...current, profile: result.profile }));
    } catch (err) {
      setError(err.message || "Registrasi gagal.");
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToPage = (page) => {
    setActivePage(page);
    setSelectedEducationContent(null);
  };

  const openEducationContent = (content) => {
    setSelectedEducationContent(content);
    setActivePage("education");
  };

  const handleLogout = async () => {
    setIsLoading(true);
    await logout();
    setToken(null);
    setData(fallbackData);
    setSelectedEducationContent(null);
    setActivePage("home");
    setIsLoading(false);
  };

  if (!token) {
    return (
      <AuthScreen
        error={error}
        isLoading={isLoading}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    );
  }

  const activeItem = navItems.find((item) => item.id === activePage) ?? navItems[0];
  const demoMode = false;

  return (
    <div className="app">
      <Sidebar activePage={activePage} onNavigate={navigateToPage} />

      <main className="workspace">
        <TopBar
          activeItem={activeItem}
          profile={data.profile}
          isLoading={isLoading}
          onRefresh={refreshData}
          onLogout={handleLogout}
        />

        <StatusBanner error={error} message={message} onClose={() => {
          setError("");
          setMessage("");
        }} />

        <div className="content-grid">
          <section className="page-panel">
            <PageRenderer
              page={activePage}
              data={data}
              demoMode={demoMode}
              isLoading={isLoading}
              selectedEducationContent={selectedEducationContent}
              onNavigate={navigateToPage}
              onOpenEducation={openEducationContent}
              onCloseEducationContent={() => setSelectedEducationContent(null)}
              onRefresh={refreshData}
              onError={setError}
              onMessage={setMessage}
              onLogout={handleLogout}
              setData={setData}
            />
          </section>
          <aside className="preview-panel desktop-only">
            <PhonePreview activePage={activePage} data={data} setActivePage={navigateToPage} />
          </aside>
        </div>
      </main>

      <MobileBottomNav activePage={activePage} onNavigate={navigateToPage} />
    </div>
  );
}

function AuthScreen({ error, isLoading, onLogin, onRegister }) {
  const [mode, setMode] = useState("login");
  const [schools, setSchools] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirmation: "",
    schoolId: "",
    classroomId: "",
    showPassword: false,
    showConfirmPassword: false
  });
  const [schoolError, setSchoolError] = useState("");

  useEffect(() => {
    if (mode !== "register" || schools.length) return;
    loadSchools()
      .then(setSchools)
      .catch((err) => setSchoolError(err.message || "Gagal memuat daftar sekolah."));
  }, [mode, schools.length]);

  const selectedSchool = schools.find(s => s.id === Number(form.schoolId));
  const availableClassrooms = selectedSchool?.classrooms || [];

  const submit = (event) => {
    event.preventDefault();
    if (mode === "login") {
      onLogin(form.email, form.password);
    } else {
      onRegister({
        name: form.name,
        email: form.email,
        password: form.password,
        passwordConfirmation: form.passwordConfirmation,
        schoolId: form.schoolId ? Number(form.schoolId) : null,
        classroomId: form.classroomId ? Number(form.classroomId) : null
      });
    }
  };

  const handleSchoolChange = (e) => {
    const newId = e.target.value;
    setForm({ ...form, schoolId: newId, classroomId: "" });
  };

  return (
    <main className="auth-layout">
      <section className="auth-card">
        <Brand />
        <div>
          <h2>{mode === "login" ? "Selamat datang kembali" : "Buat akun MENTARI"}</h2>
          <p>
            {mode === "login"
              ? "Masuk untuk melanjutkan pemantauan kesehatan mentalmu."
              : "Daftar untuk mulai memakai MENTARI di web dan mobile."}
          </p>
        </div>

        <div className="form-tabs">
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Masuk</button>
          <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Daftar</button>
        </div>

        {error ? <div className="inline-error">{error}</div> : null}

        <form className="auth-form" onSubmit={submit}>
          {mode === "register" ? (
            <>
              <input className="input" placeholder="Nama lengkap" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

              <div className="custom-select-wrapper">
                <select className="input select-input" value={form.schoolId} onChange={handleSchoolChange}>
                  <option value="">Pilih asal sekolah kamu</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>{school.name}</option>
                  ))}
                </select>
                <span className="select-icon"><MaterialIcon name="school" /></span>
              </div>

              <div className="custom-select-wrapper">
                <select
                  className="input select-input"
                  value={form.classroomId}
                  onChange={(e) => setForm({ ...form, classroomId: e.target.value })}
                  disabled={!form.schoolId || availableClassrooms.length === 0}
                >
                  <option value="">{!form.schoolId ? "Pilih sekolah dahulu" : availableClassrooms.length === 0 ? "Kelas belum tersedia" : "Pilih kelas kamu"}</option>
                  {availableClassrooms.map((classroom) => (
                    <option key={classroom.id} value={classroom.id}>{classroom.name}</option>
                  ))}
                </select>
                <span className="select-icon"><MaterialIcon name="groups" /></span>
              </div>

              {schoolError ? <small className="inline-error">{schoolError}</small> : null}
            </>
          ) : null}

          <input className="input" type="email" placeholder="Email sekolah/kampus" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />

          <div className="password-input-wrapper">
            <input
              className="input"
              type={form.showPassword ? "text" : "password"}
              placeholder="Kata sandi"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setForm({ ...form, showPassword: !form.showPassword })}
              aria-label={form.showPassword ? "Sembunyikan sandi" : "Lihat sandi"}
            >
              <MaterialIcon name={form.showPassword ? "visibility" : "visibility_off"} />
            </button>
          </div>

          {mode === "register" ? (
            <div className="password-input-wrapper">
              <input
                className="input"
                type={form.showConfirmPassword ? "text" : "password"}
                placeholder="Konfirmasi kata sandi"
                value={form.passwordConfirmation}
                onChange={(e) => setForm({ ...form, passwordConfirmation: e.target.value })}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setForm({ ...form, showConfirmPassword: !form.showConfirmPassword })}
                aria-label={form.showConfirmPassword ? "Sembunyikan sandi" : "Lihat sandi"}
              >
                <MaterialIcon name={form.showConfirmPassword ? "visibility" : "visibility_off"} />
              </button>
            </div>
          ) : null}

          <button className="button" disabled={isLoading}>
            {isLoading ? "Memproses..." : mode === "login" ? "Masuk ke dashboard" : "Buat akun"}
          </button>
        </form>
      </section>
    </main>
  );
}

function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="sidebar">
      <Brand />
      <nav className="side-nav" aria-label="Navigasi utama">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-button ${activePage === item.id ? "active" : ""}`}
            onClick={() => onNavigate(item.id)}
            style={{ "--accent": item.color }}
          >
            <span className="nav-icon"><IconGlyph icon={item.icon} /></span>
            <span>
              <strong>{item.label}</strong>
              <small>{item.subtitle}</small>
            </span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

function Brand() {
  return (
    <div className="brand">
      <div className="brand-mark"><MaterialIcon name="favorite" filled /></div>
      <div>
        <h1>MENTARI</h1>
        <p>Mental Health Monitoring</p>
      </div>
    </div>
  );
}

function TopBar({ activeItem, profile, isLoading, onRefresh, onLogout }) {
  return (
    <header className="topbar">
      <div>
        <span className="eyebrow">Aplikasi Web</span>
        <h2>{activeItem.label}</h2>
      </div>
      <div className="topbar-actions">
        <button className="connection-chip" onClick={onRefresh} disabled={isLoading}>
          {isLoading ? "Memuat..." : "Refresh Data"}
        </button>
        <button className="connection-chip danger" onClick={onLogout}>Keluar</button>
        <div className="profile-chip">
          <span className="avatar">{profile.initial}</span>
          <span>
            <strong>{profile.name}</strong>
            <small>{profile.school}</small>
          </span>
        </div>
      </div>
    </header>
  );
}

function StatusBanner({ error, message, onClose }) {
  if (!error && !message) return null;
  return (
    <div className={`status-banner ${error ? "error" : "success"}`}>
      <span>{error || message}</span>
      <button onClick={onClose} aria-label="Tutup notifikasi">×</button>
    </div>
  );
}

function CircularProgressIndicator({ color }) {
  return <div className="circular-progress" style={{ "--color": color }}></div>;
}

function PageRenderer(props) {
  const pages = {
    home: <HomePage {...props} />,
    mood: <MoodPage {...props} />,
    education: <EducationPage {...props} />,
    screening: <ScreeningPage {...props} />,
    analytics: <AnalyticsPage {...props} />,
    recommendation: <RecommendationPage {...props} />,
    community: <CommunityPage {...props} />,
    profile: <ProfilePage {...props} />
  };

  if (props.isLoading && !props.data.profile.name) {
    return (
      <div className="loading-page">
        <CircularProgressIndicator color={colors.pink} />
        <p>Menyiapkan Mentari...</p>
      </div>
    );
  }

  return pages[props.page] ?? pages.home;
}

function ScreenTitle({ page }) {
  const [title, subtitle] = pageCopy[page];
  return (
    <div className="screen-title">
      <div className="title-row">
        <span className="title-bar" />
        <h2>{title}</h2>
      </div>
      <p>{subtitle}</p>
    </div>
  );
}

function Card({ children, className = "", style, as: Component = "section", ...props }) {
  return <Component className={`card ${className}`.trim()} style={style} {...props}>{children}</Component>;
}

function SectionTitle({ title, action, onAction }) {
  return (
    <div className="section-title">
      <div>
        <span className="section-bar" />
        <h3>{title}</h3>
      </div>
      {action ? <button className="pill-button" onClick={onAction}>{action}</button> : null}
    </div>
  );
}

function IconBadge({ icon, color = colors.pink, softColor }) {
  return <span className="icon-badge" style={{ "--icon": color, "--soft": softColor ?? `${color}1f` }}><IconGlyph icon={icon} /></span>;
}

function PrimaryButton({ children, variant = "primary", ...props }) {
  return <button className={`button ${variant}`} {...props}>{children}</button>;
}

function IconGlyph({ icon }) {
  if (isMaterialIcon(icon)) return <MaterialIcon name={icon} />;
  return icon;
}

function MaterialIcon({ name, filled = false }) {
  return (
    <span
      className="material-symbols-rounded"
      data-fallback={iconFallbacks[name] || name.slice(0, 1).toUpperCase()}
      aria-hidden="true"
      style={{ fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 600, 'GRAD' 0, 'opsz' 24` }}
    >
      {name}
    </span>
  );
}

function isMaterialIcon(icon) {
  return typeof icon === "string" && /^[a-z0-9_]+$/.test(icon);
}

function HomePage({ data, onNavigate, onOpenEducation }) {
  const todayMood = data.moodEntries.at(-1)?.mood ?? data.moodOptions[0];

  return (
    <div className="page-stack">
      <div className="home-hero">
        <div>
          <span>Halo,</span>
          <h2>{data.profile.name}</h2>
        </div>
        <div className="hero-avatar">{data.profile.initial}</div>
        <div className="hero-stats">
          <InfoPair icon="calendar_month" title="STREAK" value={`${data.profile.streakDays} Hari`} />
          <span className="hero-divider" />
          <InfoPair icon="favorite" title="STATUS" value="Fokus" />
        </div>
      </div>

      {data.riskAlerts.map((alert) => <RiskAlert key={alert.id || alert.title} alert={alert} />)}

      <Card>
        <div className="mood-check">
          <div className="mood-orb">{todayMood?.emoji || "❓"}</div>
          <div>
            <h3>Apa kabarmu hari ini?</h3>
            <p>{todayMood?.label || "Yuk catat perasaanmu sekarang."}</p>
          </div>
        </div>
        <small className="muted-label">Tren mood 7 hari terakhir</small>
        <MoodChart entries={data.moodEntries} compact />
        <PrimaryButton onClick={() => onNavigate("mood")}>Check-in Mood</PrimaryButton>
      </Card>

      <SectionTitle title="Menu Utama" />
      <div className="feature-grid">
        {quickMenu.map((item) => (
          <button key={item.id} className="feature-tile" onClick={() => onNavigate(item.id)} style={{ "--accent": item.color }}>
            <IconBadge icon={item.icon} color={item.color} />
            <strong>{item.label}</strong>
            <span>{item.subtitle}</span>
          </button>
        ))}
      </div>

      <SectionTitle title="Edukasi Untukmu" action="Lihat semua" onAction={() => onNavigate("education")} />
      <ListOrEmpty items={data.educationContents.slice(0, 3)} empty="Belum ada konten edukasi.">
        {(content) => <EducationCard key={content.id || content.title} content={content} compact onOpen={onOpenEducation} />}
      </ListOrEmpty>

      <SectionTitle title="Hasil Screening" action="Tes Lagi" onAction={() => onNavigate("screening")} />
      {data.latestScreening ? <ScreeningResultCard result={data.latestScreening} /> : <EmptyCard text="Belum ada hasil screening." />}

      <SectionTitle title="Aktivitas Harian" action="Lihat" onAction={() => onNavigate("recommendation")} />
      <ListOrEmpty items={data.recommendations.slice(0, 2)} empty="Belum ada rekomendasi.">
        {(item) => <RecommendationCard key={item.id || item.title} item={item} />}
      </ListOrEmpty>
    </div>
  );
}

function MoodPage({ data, demoMode, onRefresh, onError, onMessage }) {
  const [selectedMoodId, setSelectedMoodId] = useState(data.moodOptions[0]?.id);
  const [note, setNote] = useState("");
  const [energy, setEnergy] = useState(5);
  const [stress, setStress] = useState(5);
  const [saving, setSaving] = useState(false);

  const selectedMood = data.moodOptions.find((mood) => mood.id === selectedMoodId) ?? data.moodOptions[0];

  const save = async () => {
    if (!selectedMood) return;
    if (demoMode) {
      onMessage("Mode demo: jurnal tidak dikirim ke API.");
      return;
    }
    setSaving(true);
    try {
      await saveMoodEntry({ moodOptionId: selectedMood.id, note, energy, stress });
      setNote("");
      onMessage("Mood berhasil disimpan.");
      onRefresh();
    } catch (err) {
      onError(err.message || "Gagal menyimpan mood.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (entry) => {
    if (demoMode || !entry.id) return onMessage("Mode demo: data tidak dihapus dari API.");
    try {
      await deleteMoodEntry(entry.id);
      onMessage("Catatan mood dihapus.");
      onRefresh();
    } catch (err) {
      onError(err.message || "Gagal menghapus mood.");
    }
  };

  return (
    <div className="page-stack">
      <ScreenTitle page="mood" />
      <SectionTitle title="Bagaimana perasaanmu?" />
      <div className="mood-options">
        {data.moodOptions.map((mood) => (
          <button
            key={mood.id || mood.label}
            className={`mood-option ${selectedMoodId === mood.id ? "selected" : ""}`}
            style={{ "--accent": mood.color }}
            onClick={() => setSelectedMoodId(mood.id)}
          >
            <span>{mood.emoji}</span>
            <strong>{mood.label}</strong>
            <small>{mood.description}</small>
          </button>
        ))}
      </div>

      <Card>
        <label className="field-label" htmlFor="mood-note">Apa yang kamu pikirkan?</label>
        <textarea id="mood-note" className="textarea" placeholder="Tulis catatan singkat..." value={note} onChange={(e) => setNote(e.target.value)} />
        <SliderControl title="Level Energi" value={energy} setValue={setEnergy} color={colors.mint} />
        <SliderControl title="Level Stres" value={stress} setValue={setStress} color={colors.peach} />
        <PrimaryButton onClick={save} disabled={saving}>{saving ? "Menyimpan..." : "Simpan Jurnal"}</PrimaryButton>
      </Card>

      <SectionTitle title="Statistik & Riwayat" />
      <Card>
        <h3>Tren Mood 7 Hari</h3>
        <MoodChart entries={data.moodEntries} />
        <MiniMoodCalendar entries={data.moodEntries} />
      </Card>

      <ListOrEmpty items={data.moodEntries.slice(-5).reverse()} empty="Belum ada riwayat mood.">
        {(entry) => (
          <Card key={entry.id || entry.entryDate} className="history-card" style={{ "--accent": entry.mood.color }}>
            <div className="history-row">
              <span className="history-emoji">{entry.mood.emoji}</span>
              <div>
                <small>{entry.dayName}, {entry.dateLabel}</small>
                <h3>{entry.mood.label}</h3>
                <p>{entry.note || "Tanpa catatan."}</p>
              </div>
              <button className="icon-action" onClick={() => remove(entry)} aria-label="Hapus catatan mood"><MaterialIcon name="delete" /></button>
            </div>
          </Card>
        )}
      </ListOrEmpty>
    </div>
  );
}

function EducationPage({ data, selectedEducationContent, onOpenEducation, onCloseEducationContent }) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [query, setQuery] = useState("");
  const visible = data.educationContents.filter((content) => {
    const matchCategory = selectedCategory === "all" || content.categoryId === selectedCategory;
    const matchQuery = !query.trim() || `${content.title} ${content.summary}`.toLowerCase().includes(query.toLowerCase());
    return matchCategory && matchQuery;
  });

  if (selectedEducationContent) {
    return <EducationDetailPage content={selectedEducationContent} onBack={onCloseEducationContent} />;
  }

  return (
    <div className="page-stack">
      <ScreenTitle page="education" />
      <Card>
        <div className="search-box">
          <MaterialIcon name="search" />
          <input placeholder="Cari topik atau artikel..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </Card>
      <div className="chips">
        {data.educationCategories.map((category) => (
          <button
            key={category.id}
            className={selectedCategory === category.id ? "chip active" : "chip"}
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.title}
          </button>
        ))}
      </div>
      <ListOrEmpty items={visible} empty="Belum ada konten edukasi yang sesuai.">
        {(content) => <EducationCard key={content.id || content.title} content={content} onOpen={onOpenEducation} />}
      </ListOrEmpty>
    </div>
  );
}

function ScreeningPage({ data, demoMode, onRefresh, onError, onMessage }) {
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const canSubmit = data.screeningQuestions.length > 0 && Object.keys(answers).length === data.screeningQuestions.length;

  const submit = async () => {
    if (demoMode) return onMessage("Mode demo: hasil screening tidak dikirim ke API.");
    if (!data.profile.canTakeScreening) return onError("Akses screening belum tersedia.");
    setSaving(true);
    try {
      await submitScreening(answers);
      setAnswers({});
      onMessage("Screening berhasil dikirim.");
      onRefresh();
    } catch (err) {
      onError(err.message || "Gagal mengirim screening.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-stack">
      <ScreenTitle page="screening" />
      {data.profile.canTakeScreening ? (
        <>
          <Card className="soft-lavender">
            <div className="row">
              <IconBadge icon="bolt" color={colors.lavender} softColor="#fff" />
              <div>
                <h3>Instruksi Cepat</h3>
                <p>Jawab berdasarkan kondisi seminggu terakhir. Skala 0 berarti tidak pernah, 3 berarti sering.</p>
              </div>
            </div>
          </Card>
          <ListOrEmpty items={data.screeningQuestions} empty="Pertanyaan screening belum tersedia.">
            {(question) => (
              <QuestionCard
                key={question.id}
                question={question}
                selected={answers[question.id]}
                onSelect={(score) => setAnswers({ ...answers, [question.id]: score })}
              />
            )}
          </ListOrEmpty>
          <div className="button-row">
            <PrimaryButton variant="outline" onClick={() => setAnswers({})}>Reset</PrimaryButton>
            <PrimaryButton onClick={submit} disabled={!canSubmit || saving}>{saving ? "Mengirim..." : "Simpan Hasil"}</PrimaryButton>
          </div>
        </>
      ) : (
        <Card className="screening-locked">
          <div className="row">
            <IconBadge icon="check_circle" color={colors.mint} softColor="#fff" />
            <p>Kamu sudah menyelesaikan screening. Hubungi admin jika memerlukan akses tes ulang.</p>
          </div>
        </Card>
      )}

      <SectionTitle title="Riwayat Screening" />
      <ListOrEmpty items={data.screeningResults.length ? data.screeningResults : data.latestScreening ? [data.latestScreening] : []} empty="Belum ada hasil screening.">
        {(result) => <ScreeningResultCard key={result.id || result.dateLabel} result={result} />}
      </ListOrEmpty>
    </div>
  );
}

function AnalyticsPage({ data }) {
  return (
    <div className="page-stack">
      <ScreenTitle page="analytics" />
      <div className="stat-grid">
        {data.activityStats.map((stat) => <MetricCard key={stat.label} stat={stat} />)}
      </div>
      <Card>
        <div className="row">
          <IconBadge icon="trending_up" color={colors.pink} softColor={colors.pinkSoft} />
          <div>
            <h3>Tren mood mingguan</h3>
            <p>{data.moodEntries.slice(-7).length} check-in terbaru dari server.</p>
          </div>
        </div>
        <MoodChart entries={data.moodEntries} />
      </Card>
      {data.latestScreening ? <ScreeningResultCard result={data.latestScreening} /> : null}
    </div>
  );
}

function RecommendationPage({ data }) {
  const alert = data.riskAlerts[0];
  return (
    <div className="page-stack">
      <ScreenTitle page="recommendation" />
      <Card className="soft-peach">
        <div className="row">
          <IconBadge icon="auto_awesome" color={colors.peach} softColor="#fff" />
          <div>
            <h3>{alert?.title || "Rekomendasi untukmu"}</h3>
            <p>{alert?.recommendation || "Pilih aktivitas yang paling relevan dengan kondisimu saat ini."}</p>
          </div>
        </div>
      </Card>
      <ListOrEmpty items={data.recommendations} empty="Belum ada rekomendasi dari server.">
        {(item) => <RecommendationCard key={item.id || item.title} item={item} />}
      </ListOrEmpty>
    </div>
  );
}

function CommunityPage({ data, demoMode, onRefresh, onError, onMessage }) {
  const [postText, setPostText] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!postText.trim()) return onError("Isi postingan tidak boleh kosong.");
    if (demoMode) return onMessage("Mode demo: postingan tidak dikirim ke API.");
    setSaving(true);
    try {
      await createCommunityPost(postText.trim());
      setPostText("");
      onMessage("Postingan berhasil dikirim.");
      onRefresh();
    } catch (err) {
      onError(err.message || "Gagal membuat postingan.");
    } finally {
      setSaving(false);
    }
  };

  const like = async (post) => {
    if (demoMode) return onMessage("Mode demo: dukungan tidak dikirim ke API.");
    try {
      await toggleCommunityLike(post.id);
      onRefresh();
    } catch (err) {
      onError(err.message || "Gagal mengubah dukungan.");
    }
  };

  return (
    <div className="page-stack">
      <ScreenTitle page="community" />
      <div className="notice-card">
        <MaterialIcon name="shield" />
        <p>Aturan Komunitas: gunakan bahasa sopan. Dilarang melakukan perundungan atau menyebar hoaks.</p>
      </div>
      <Card>
        <div className="row">
          <IconBadge icon="chat_bubble" color={colors.lavender} softColor={colors.lavenderSoft} />
          <div>
            <h3>Ruang dukungan</h3>
            <p>Bagikan refleksi singkat yang aman dan suportif.</p>
          </div>
        </div>
        <textarea className="textarea" placeholder="Tulis dukungan atau refleksi..." value={postText} onChange={(e) => setPostText(e.target.value)} />
        <PrimaryButton onClick={submit} disabled={saving}>{saving ? "Mengirim..." : "Kirim ke komunitas"}</PrimaryButton>
      </Card>
      <ListOrEmpty items={data.communityPosts} empty="Belum ada postingan komunitas.">
        {(post) => <CommunityPostCard key={post.id} post={post} onLike={() => like(post)} />}
      </ListOrEmpty>
    </div>
  );
}

function ProfilePage({ data, demoMode, onRefresh, onError, onMessage, onLogout }) {
  const [form, setForm] = useState({
    name: data.profile.name,
    email: data.profile.email,
    level: data.profile.level
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    password: "",
    passwordConfirmation: ""
  });

  useEffect(() => {
    setForm({ name: data.profile.name, email: data.profile.email, level: data.profile.level });
  }, [data.profile]);

  const saveProfile = async () => {
    if (demoMode) return onMessage("Mode demo: profil tidak dikirim ke API.");
    try {
      await updateProfile(form);
      onMessage("Profil berhasil diperbarui.");
      onRefresh();
    } catch (err) {
      onError(err.message || "Gagal memperbarui profil.");
    }
  };

  const savePassword = async () => {
    if (demoMode) return onMessage("Mode demo: kata sandi tidak dikirim ke API.");
    try {
      await changePassword(passwordForm);
      setPasswordForm({ currentPassword: "", password: "", passwordConfirmation: "" });
      onMessage("Kata sandi berhasil diubah.");
    } catch (err) {
      onError(err.message || "Gagal mengubah kata sandi.");
    }
  };

  return (
    <div className="page-stack">
      <ScreenTitle page="profile" />
      <Card className="profile-hero-card">
        <span className="profile-avatar">{data.profile.initial}</span>
        <div>
          <h3>{data.profile.name}</h3>
          <p>{data.profile.school}</p>
          <small>{data.profile.joinedLabel}</small>
        </div>
      </Card>

      <Card>
        <SectionTitle title="Ubah profil" />
        <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} />
        <PrimaryButton onClick={saveProfile}>Simpan profil</PrimaryButton>
      </Card>

      <Card>
        <SectionTitle title="Ganti kata sandi" />
        <input className="input" type="password" placeholder="Kata sandi lama" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
        <input className="input" type="password" placeholder="Kata sandi baru" value={passwordForm.password} onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })} />
        <input className="input" type="password" placeholder="Konfirmasi kata sandi baru" value={passwordForm.passwordConfirmation} onChange={(e) => setPasswordForm({ ...passwordForm, passwordConfirmation: e.target.value })} />
        <PrimaryButton onClick={savePassword}>Ubah kata sandi</PrimaryButton>
      </Card>

      <div className="stat-grid">
        {data.activityStats.map((stat) => <MetricCard key={stat.label} stat={stat} />)}
      </div>

      <Card>
        <InfoListRow icon="school" title="Status" value={data.profile.level || "-"} color={colors.lavender} />
        <InfoListRow icon="notifications" title="Notifikasi" value="Siap menerima pembaruan" color={colors.peach} />
        <InfoListRow icon="calendar_month" title="Check-in beruntun" value={`${data.profile.streakDays} hari`} color={colors.pink} />
        <InfoListRow icon="shield" title="Privasi" value="Terhubung ke server MENTARI" color={colors.mint} />
      </Card>

      <PrimaryButton variant="outline" onClick={onLogout}>Keluar dari akun</PrimaryButton>
    </div>
  );
}

function RiskAlert({ alert }) {
  const palette = alert.level === "urgent"
    ? [colors.pinkSoft, colors.pink]
    : alert.level === "attention"
      ? [colors.peachSoft, colors.peach]
      : [colors.mintSoft, colors.mint];
  return (
    <Card className="risk-card" style={{ background: palette[0] }}>
      <div className="row">
        <IconBadge icon="info" color={palette[1]} softColor="#fff" />
        <div>
          <h3>{alert.title}</h3>
          <p>{alert.message}</p>
        </div>
      </div>
      <div className="risk-note">{alert.recommendation}</div>
    </Card>
  );
}

function InfoPair({ icon, title, value }) {
  return (
    <div className="info-pair">
      <span><IconGlyph icon={icon} /></span>
      <div>
        <small>{title}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function EducationDetailPage({ content, onBack }) {
  const summary = String(content.summary || "").trim();
  const rawBody = String(content.body || "").trim();
  const body = isPlaceholderArticleBody(rawBody)
    ? "Isi lengkap artikel ini belum tersedia."
    : rawBody || summary || "Materi ini belum memiliki isi lengkap.";
  const paragraphs = body.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const metaItems = [getEducationTypeLabel(content), content.categoryTitle, content.readTime].filter(Boolean);

  return (
    <div className="page-stack education-detail-page">
      <button className="back-button" type="button" onClick={onBack}>
        <MaterialIcon name="arrow_back" />
        Kembali ke daftar edukasi
      </button>

      <Card className="education-detail-card" style={{ "--accent": content.accentColor }}>
        <div className="education-detail-head">
          <IconBadge icon={getEducationTypeIcon(content)} color={content.accentColor} />
          <div>
            <div className="meta-row education-detail-meta">
              {metaItems.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            <h2>{content.title}</h2>
            {summary && summary !== body ? <p className="article-summary">{summary}</p> : null}
          </div>
        </div>

        <EducationMedia content={content} />

        <article className="article-body">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </article>
      </Card>
    </div>
  );
}

function EducationMedia({ content }) {
  if (!content.mediaUrl) return null;

  const isImage = /\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/i.test(content.mediaUrl);
  const isYouTube = content.mediaUrl.includes("youtube.com") || content.mediaUrl.includes("youtu.be");

  if (isImage) {
    return (
      <figure className="education-media">
        <img src={content.mediaUrl} alt={content.title} />
      </figure>
    );
  }

  if (isYouTube) {
    const videoId = content.mediaUrl.includes("v=")
      ? content.mediaUrl.split("v=")[1].split("&")[0]
      : content.mediaUrl.split("/").pop();
    const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;

    return (
      <div className="video-container-web">
        <iframe
          src={embedUrl}
          title={content.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    );
  }

  return (
    <a className="media-link" href={content.mediaUrl} target="_blank" rel="noreferrer">
      <MaterialIcon name={content.type === "VIDEO" ? "play_circle" : "open_in_new"} />
      Buka media pendukung
    </a>
  );
}

function EducationCard({ content, compact = false, onOpen }) {
  const clickable = typeof onOpen === "function";
  return (
    <Card
      as={clickable ? "button" : "section"}
      type={clickable ? "button" : undefined}
      className={`education-card ${clickable ? "education-card-button" : ""}`}
      style={{ "--accent": content.accentColor }}
      onClick={clickable ? () => onOpen(content) : undefined}
    >
      <IconBadge icon={getEducationTypeIcon(content)} color={content.accentColor} />
      <div>
        <div className="meta-row">
          <span>{getEducationTypeLabel(content)}</span>
          <span>•</span>
          <span>{content.readTime || "Baca"}</span>
        </div>
        <h3>{content.title}</h3>
        <p>{compact ? truncate(content.summary, 105) : content.summary}</p>
      </div>
      {clickable ? (
        <span className="education-card-action">
          Lihat artikel
          <MaterialIcon name="arrow_forward" />
        </span>
      ) : null}
    </Card>
  );
}

function RecommendationCard({ item }) {
  return (
    <Card className="recommendation-card" style={{ "--accent": item.accentColor }}>
      <div className="recommendation-head">
        <div className="row">
          <IconBadge icon="lightbulb" color={item.accentColor} softColor="#fff" />
          <div>
            <h3>{item.title}</h3>
            <p>{item.category}</p>
          </div>
        </div>
        {item.priority ? <span className="priority-pill">{item.priority}</span> : null}
      </div>
      <p>{item.description}</p>
      <strong className="duration">{item.duration}</strong>
    </Card>
  );
}

function ScreeningResultCard({ result }) {
  return (
    <Card>
      <div className="row">
        <IconBadge icon="monitoring" color={colors.pink} softColor={colors.lavenderSoft} />
        <div>
          <h3>Hasil Screening</h3>
          <p>{result.dateLabel}</p>
        </div>
      </div>
      <div className="score-stack">
        {result.scores.map((score) => <ScoreBar key={score.label} score={score} />)}
      </div>
      <div className="medical-note">
        <strong>DISCLAIMER MEDIS</strong>
        <span>Hasil ini adalah alat pemantauan mandiri dan bukan diagnosis klinis medis.</span>
      </div>
    </Card>
  );
}

function ScoreBar({ score }) {
  return (
    <div className="score-bar">
      <div>
        <strong>{score.label}</strong>
        <span style={{ color: score.color }}>{score.severity}</span>
      </div>
      <div className="progress-track">
        <span style={{ width: `${Math.min(100, (score.rawScore / 42) * 100)}%`, background: score.color }} />
      </div>
    </div>
  );
}

function MetricCard({ stat }) {
  return (
    <Card className="metric-card" style={{ "--accent": stat.accentColor }}>
      <strong>{stat.value}</strong>
      <h3>{stat.label}</h3>
      <p>{stat.helper}</p>
    </Card>
  );
}

function MoodChart({ entries, compact = false }) {
  const chart = useMemo(() => {
    const safeEntries = entries.length ? entries.slice(-7) : fallbackData.moodEntries.slice(-7);
    const width = 640;
    const height = compact ? 180 : 220;
    const left = compact ? 18 : 70;
    const right = 18;
    const top = 18;
    const chartWidth = width - left - right;
    const chartHeight = height - top - 44;
    const points = safeEntries.map((entry, index) => {
      const step = safeEntries.length <= 1 ? 0 : chartWidth / (safeEntries.length - 1);
      const x = left + step * index;
      const y = top + ((5 - entry.mood.score) / 4) * chartHeight;
      return { x, y, entry };
    });
    const line = points.map((point) => `${point.x},${point.y}`).join(" ");
    const area = `${left},${top + chartHeight} ${line} ${points.at(-1).x},${top + chartHeight}`;
    return { width, height, left, top, chartHeight, points, line, area };
  }, [entries, compact]);

  const labels = [
    { label: "😊 Hebat", score: 5 },
    { label: "🙂 Baik", score: 4 },
    { label: "😐 Biasa", score: 3 },
    { label: "😟 Kurang", score: 2 },
    { label: "😢 Buruk", score: 1 }
  ];

  return (
    <div className={compact ? "chart compact" : "chart"}>
      <svg viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-label="Grafik tren mood">
        <defs>
          <linearGradient id="moodArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={colors.pink} stopOpacity="0.24" />
            <stop offset="100%" stopColor={colors.pink} stopOpacity="0" />
          </linearGradient>
        </defs>
        {labels.map((item) => {
          const y = chart.top + ((5 - item.score) / 4) * chart.chartHeight;
          return (
            <g key={item.label}>
              <line x1={chart.left} x2={chart.width - 18} y1={y} y2={y} className="grid-line" />
              {!compact ? <text x="8" y={y + 4} className="axis-label">{item.label}</text> : null}
            </g>
          );
        })}
        <polygon points={chart.area} fill="url(#moodArea)" />
        <polyline points={chart.line} className="mood-line" />
        {chart.points.map((point) => (
          <g key={`${point.entry.id}-${point.entry.entryDate}`}>
            <circle cx={point.x} cy={point.y} r="7" fill="#fff" />
            <circle cx={point.x} cy={point.y} r="4" fill={point.entry.mood.color} />
            <text x={point.x} y={chart.top + chart.chartHeight + 28} textAnchor="middle" className="day-label">
              {point.entry.dayName}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function MiniMoodCalendar({ entries }) {
  const days = entries.length ? entries.slice(-14) : fallbackData.moodEntries.concat(fallbackData.moodEntries);
  return (
    <div className="mini-calendar">
      {days.map((entry, index) => (
        <span key={`${entry.id}-${index}`} style={{ "--accent": entry.mood.color }}>
          <small>{entry.dayName.slice(0, 1)}</small>
          {entry.mood.emoji}
        </span>
      ))}
    </div>
  );
}

function SliderControl({ title, value, setValue, color }) {
  return (
    <div className="slider-preview">
      <div>
        <strong>{title}</strong>
        <span style={{ color, background: `${color}18` }}>{value}</span>
      </div>
      <input type="range" min="0" max="10" value={value} onChange={(e) => setValue(Number(e.target.value))} style={{ accentColor: color }} />
    </div>
  );
}

function QuestionCard({ question, selected, onSelect }) {
  return (
    <Card>
      <div className="question-number">Pertanyaan {question.number}</div>
      <p className="question-text">{question.text}</p>
      <div className="score-buttons">
        {[0, 1, 2, 3].map((score) => (
          <button key={score} className={selected === score ? "selected" : ""} onClick={() => onSelect(score)}>{score}</button>
        ))}
      </div>
    </Card>
  );
}

function CommunityPostCard({ post, onLike }) {
  return (
    <Card className={post.isPinned ? "post-card pinned" : "post-card"}>
      <div className="post-head">
        <span className="post-avatar">{post.author.slice(0, 1)}</span>
        <div>
          <h3>{post.author}</h3>
          <p>{post.role} · {post.timeLabel}</p>
        </div>
        <span className="tag">{post.tag || "Cerita"}</span>
      </div>
      <p>{post.content}</p>
      <div className="post-actions">
        <button onClick={onLike}><MaterialIcon name="favorite" filled={post.likedByMe} /> {post.likes} dukungan</button>
        <span><MaterialIcon name="shield" /> Laporkan</span>
      </div>
    </Card>
  );
}

function InfoListRow({ icon, title, value, color }) {
  return (
    <div className="info-list-row">
      <IconBadge icon={icon} color={color} />
      <div>
        <small>{title}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function ListOrEmpty({ items, empty, children }) {
  if (!items.length) return <EmptyCard text={empty} />;
  return <div className="list-stack">{items.map(children)}</div>;
}

function EmptyCard({ text }) {
  return <Card className="empty-card"><p>{text}</p></Card>;
}

function PhonePreview({ activePage, data, setActivePage }) {
  const item = navItems.find((nav) => nav.id === activePage);
  return (
    <div className="phone-shell">
      <div className="phone-status" />
      <div className="phone-content">
        {activePage === "home" ? (
          <>
            <div className="phone-hero">
              <small>Halo,</small>
              <strong>{data.profile.name}</strong>
              <div className="phone-hero-meta">
                <MaterialIcon name="calendar_month" />
                {data.profile.streakDays} Hari ·
                <MaterialIcon name="favorite" filled />
                Fokus
              </div>
            </div>
            <div className="phone-card">
              <span className="phone-mood">{data.moodEntries.at(-1)?.mood.emoji || "🙂"}</span>
              <strong>Apa kabarmu hari ini?</strong>
              <small>{data.moodEntries.at(-1)?.mood.label || "Yuk check-in."}</small>
            </div>
            <div className="phone-grid">
              {quickMenu.slice(0, 4).map((nav) => <span key={nav.id}><IconGlyph icon={nav.icon} /><small>{nav.label}</small></span>)}
            </div>
          </>
        ) : (
          <>
            <div className="phone-title">
              <span><IconGlyph icon={item?.icon} /></span>
              <strong>{item?.label}</strong>
            </div>
            <div className="phone-card">
              <strong>{pageCopy[activePage]?.[1]}</strong>
              <MoodChart entries={data.moodEntries} compact />
            </div>
            <div className="phone-card muted-phone-card">
              <small>Tampilan mobile mengikuti pola Android MENTARI.</small>
            </div>
          </>
        )}
      </div>
      <div className="phone-nav">
        {bottomNav.map((nav) => (
          <button key={nav.id} className={activePage === nav.id ? "active" : ""} onClick={() => setActivePage(nav.id)}>
            <span><IconGlyph icon={nav.icon} /></span>
            <small>{nav.label}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

function MobileBottomNav({ activePage, onNavigate }) {
  return (
    <nav className="mobile-bottom-nav" aria-label="Navigasi mobile">
      {bottomNav.map((nav) => (
        <button key={nav.id} className={activePage === nav.id ? "active" : ""} onClick={() => onNavigate(nav.id)}>
          <span><IconGlyph icon={nav.icon} /></span>
          <small>{nav.label}</small>
        </button>
      ))}
    </nav>
  );
}

function truncate(value, limit) {
  if (!value || value.length <= limit) return value;
  return `${value.slice(0, limit).trim()}...`;
}

function isPlaceholderArticleBody(value) {
  return !value || /^[-–—]+$/.test(value);
}

function getEducationTypeIcon(content) {
  if (content.type === "VIDEO") return "play_circle";
  if (content.type === "INFOGRAPHIC") return "image";
  return "article";
}

function getEducationTypeLabel(content) {
  if (content.type === "INFOGRAPHIC") return "Infografis";
  if (content.type === "VIDEO") return "Video";
  return "Artikel";
}
