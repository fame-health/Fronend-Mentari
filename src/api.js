import { cloneData, colors, createEmptyUserData, emptyActivityStats } from "./mockData";

const DEFAULT_BASE_URL = "https://bookperdi.my.id/api/v1";
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
const TOKEN_KEY = "mentari_web_token";

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function apiRequest(path, { method = "GET", body, token = getStoredToken(), params } = {}) {
  const query = params ? `?${new URLSearchParams(params).toString()}` : "";
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/${path.replace(/^\/+/, "")}${query}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch {
    throw new Error("Tidak dapat terhubung ke server API.");
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const firstValidation = payload?.errors
      ? Object.values(payload.errors).reduce((items, item) => items.concat(item), []).find(Boolean)
      : null;
    const message = firstValidation || payload?.message || `Permintaan gagal (HTTP ${response.status}).`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export async function login(email, password) {
  const payload = await apiRequest("auth/login", {
    method: "POST",
    token: null,
    body: { email, password, device_name: "web" }
  });
  const data = unwrapData(payload);
  const token = data?.token;
  if (!token) throw new Error("Respons login tidak memuat token.");
  setStoredToken(token);
  return { token, profile: mapUser(data.user), message: payload.message };
}

export async function register({ name, email, password, passwordConfirmation, schoolId, classroomId }) {
  const payload = await apiRequest("auth/register", {
    method: "POST",
    token: null,
    body: {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
      school_id: schoolId,
      classroom_id: classroomId,
      device_name: "web"
    }
  });
  const data = unwrapData(payload);
  const token = data?.token;
  if (!token) throw new Error("Respons registrasi tidak memuat token.");
  setStoredToken(token);
  return { token, profile: mapUser(data.user), message: payload.message };
}

export async function logout() {
  try {
    await apiRequest("auth/logout", { method: "POST" });
  } finally {
    setStoredToken(null);
  }
}

export async function loadSchools() {
  const payload = await apiRequest("schools", { token: null });
  return findArray(payload).map(mapSchool).filter((school) => school.id && school.name);
}

export async function loadMentariData() {
  const [
    me,
    dashboard,
    moodOptions,
    moodEntries,
    screeningQuestions,
    screeningResults,
    education,
    recommendations,
    communityPosts,
    riskAlerts
  ] = await settleAll([
    apiRequest("auth/me"),
    apiRequest("dashboard"),
    apiRequest("mood-options"),
    apiRequest("mood-entries"),
    apiRequest("screening/questions"),
    apiRequest("screening/results"),
    loadEducation(),
    apiRequest("recommendations"),
    apiRequest("community/posts").catch(() => apiRequest("community-posts")),
    apiRequest("risk-alerts")
  ]);

  if (me.status === "rejected" && me.reason?.status === 401) {
    throw me.reason;
  }

  const data = createEmptyUserData();
  if (me.status === "fulfilled") data.profile = mapUser(unwrapData(me.value));

  if (dashboard.status === "fulfilled") {
    const dash = unwrapData(dashboard.value);
    if (dash?.user) data.profile = mapUser(dash.user);
    if (dash?.latest_mood) data.moodEntries = [mapMoodEntry(dash.latest_mood)].filter(Boolean);
    if (dash?.latest_screening) data.latestScreening = mapScreeningResult(dash.latest_screening);

    // New fields from dashboard update
    if (dash?.screening_analysis) data.screeningAnalysis = mapScreeningAnalysis(dash.screening_analysis);
    if (dash?.personalized_recommendation) data.personalizedRecommendation = mapRecommendation(dash.personalized_recommendation);

    if (Array.isArray(dash?.active_risk_alerts)) data.riskAlerts = dash.active_risk_alerts.map(mapRiskAlert);
    if (Array.isArray(dash?.recommendations)) data.recommendations = dash.recommendations.map(mapRecommendation);
    data.activityStats = mapStatistics(dash?.statistics);

    if (data.latestScreening) {
      data.latestScreening = {
        ...data.latestScreening,
        analysis: data.latestScreening.analysis || data.screeningAnalysis,
        recommendation: data.latestScreening.recommendation || data.personalizedRecommendation
      };
    }
  }

  if (moodOptions.status === "fulfilled") {
    const mapped = findArray(moodOptions.value).map(mapMoodOption).filter((item) => item.id);
    if (mapped.length) data.moodOptions = mapped;
  }
  if (moodEntries.status === "fulfilled") {
    const mapped = findArray(moodEntries.value).map(mapMoodEntry).filter(Boolean);
    data.moodEntries = mapped;
  }
  if (screeningQuestions.status === "fulfilled") {
    const mapped = findArray(screeningQuestions.value).map(mapScreeningQuestion).filter((item) => item.id);
    if (mapped.length) data.screeningQuestions = mapped.sort((a, b) => a.number - b.number);
  }
  if (screeningResults.status === "fulfilled") {
    const mapped = findArray(screeningResults.value).map(mapScreeningResult).filter(Boolean);
    if (mapped[0]) {
      mapped[0] = {
        ...mapped[0],
        analysis: mapped[0].analysis || data.screeningAnalysis,
        recommendation: mapped[0].recommendation || data.personalizedRecommendation
      };
    }
    data.screeningResults = mapped;
    data.latestScreening = mapped[0] || null;
    if (data.latestScreening) {
        if (!data.screeningAnalysis) data.screeningAnalysis = data.latestScreening.analysis;
        if (!data.personalizedRecommendation) data.personalizedRecommendation = data.latestScreening.recommendation;
    }
  }
  if (education.status === "fulfilled") {
    if (education.value.categories.length) data.educationCategories = education.value.categories;
    if (education.value.contents.length) data.educationContents = education.value.contents;
  }
  if (recommendations.status === "fulfilled") {
    const mapped = findArray(recommendations.value).map(mapRecommendation).filter((item) => item.id);
    data.recommendations = mapped;
  }
  if (communityPosts.status === "fulfilled") {
    const mapped = findArray(communityPosts.value).map((post) => mapCommunityPost(post, data.profile.id)).filter((item) => item.id);
    data.communityPosts = mapped;
  }
  if (riskAlerts.status === "fulfilled") {
    const mapped = findArray(riskAlerts.value).map(mapRiskAlert).filter((item) => item.id);
    data.riskAlerts = mapped.filter((alert) => !alert.dismissedAt);
  }

  return data;
}

export async function loadEducation() {
  const payload = await apiRequest("education");
  const root = unwrapData(payload);
  const routeItems = findArray(payload);
  const routeLooksLikeCategories = routeItems.some((item) => item?.slug || Array.isArray(item?.contents));
  const categoriesSource = findArray(root?.categories ? { data: root.categories } : routeLooksLikeCategories ? payload : { data: [] });
  const hasNestedCategoryShape = categoriesSource.some((category) => Array.isArray(category?.contents));
  const categories = categoriesSource
    .filter((category) => category?.slug || category?.id || category?.title)
    .map(mapEducationCategory);

  const nestedContents = categoriesSource.flatMap((category) =>
    Array.isArray(category?.contents) ? category.contents.map((content) => mapEducationContent(content, category)) : []
  );
  const directSource = root?.contents ? root.contents : hasNestedCategoryShape || routeLooksLikeCategories ? { data: [] } : payload;
  const directContents = findArray(directSource)
    .filter((content) => content?.title || content?.summary)
    .map((content) => mapEducationContent(content));
  const contents = distinctBy([...nestedContents, ...directContents], (item) => item.id || item.title);

  const resolvedCategories = categories.length
    ? [{ id: "all", title: "Semua", description: "Semua materi admin" }, ...distinctBy(categories, (item) => item.id)]
    : deriveCategories(contents);
  return { categories: resolvedCategories, contents };
}

export async function saveMoodEntry({ moodOptionId, note, energy, stress }) {
  const today = new Date().toISOString().slice(0, 10);
  const payload = await apiRequest("mood-entries", {
    method: "POST",
    body: {
      mood_option_id: moodOptionId,
      entry_date: today,
      note: note?.trim() || null,
      energy,
      stress
    }
  });
  return mapMoodEntry(findObject(payload, ["mood_entry", "moodEntry"]) || unwrapData(payload));
}

export async function deleteMoodEntry(id) {
  await apiRequest(`mood-entries/${id}`, { method: "DELETE" });
}

export async function submitScreening(answers) {
  const payload = await apiRequest("screening/results", {
    method: "POST",
    body: {
      answers: Object.entries(answers).map(([questionId, score]) => ({
        question_id: Number(questionId),
        score: Number(score)
      }))
    }
  });
  return mapScreeningResult(findObject(payload, ["screening_result", "screeningResult", "result"]) || unwrapData(payload));
}

export async function createCommunityPost(content, tag = "Cerita") {
  const payload = await apiRequest("community/posts", {
    method: "POST",
    body: { tag, content }
  }).catch(() =>
    apiRequest("community-posts", {
      method: "POST",
      body: { tag, content }
    })
  );
  return mapCommunityPost(findObject(payload, ["post", "community_post", "communityPost"]) || unwrapData(payload));
}

export async function toggleCommunityLike(id) {
  const payload = await apiRequest(`community/posts/${id}/like`, { method: "POST" }).catch(() =>
    apiRequest(`community-posts/${id}/like`, { method: "POST" })
  );
  return unwrapData(payload);
}

export async function updateProfile({ name, email, level }) {
  const payload = await apiRequest("auth/profile", {
    method: "PATCH",
    body: { name, email, level }
  });
  return mapUser(unwrapData(payload));
}

export async function changePassword({ currentPassword, password, passwordConfirmation }) {
  return apiRequest("auth/password", {
    method: "PUT",
    body: {
      current_password: currentPassword,
      password,
      password_confirmation: passwordConfirmation
    }
  });
}

function unwrapData(payload) {
  return payload && typeof payload === "object" && "data" in payload ? payload.data : payload;
}

function findObject(payload, names) {
  const root = unwrapData(payload);
  if (!root || typeof root !== "object" || Array.isArray(root)) return null;
  for (const name of names) {
    if (root[name] && typeof root[name] === "object") return root[name];
  }
  return null;
}

function findArray(payload) {
  const root = unwrapData(payload);
  if (Array.isArray(root)) return root;
  if (!root || typeof root !== "object") return [];
  if (Array.isArray(root.data)) return root.data;
  if (root.data && typeof root.data === "object") return findArray(root.data);
  const names = [
    "items",
    "results",
    "contents",
    "education_contents",
    "posts",
    "community_posts",
    "alerts",
    "questions",
    "recommendations",
    "categories",
    "mood_options",
    "mood_entries",
    "schools"
  ];
  for (const name of names) {
    if (Array.isArray(root[name])) return root[name];
    if (root[name] && typeof root[name] === "object") {
      const nested = findArray(root[name]);
      if (nested.length) return nested;
    }
  }
  return [];
}

function mapUser(user) {
  if (!user) return createEmptyUserData().profile;
  const u = user.user || user;
  const name = u.name || "";
  return {
    id: Number(u.id || 0),
    name,
    email: u.email || "",
    school: u.school?.name || u.school_name || "Sekolah belum ditentukan",
    level: u.level || "",
    initial: u.avatar_initial || name.slice(0, 1).toUpperCase() || "M",
    streakDays: Number(u.streak_days || 0),
    joinedLabel: u.created_at ? `Bergabung ${formatMonthYear(u.created_at)}` : "",
    canTakeScreening: u.can_take_screening == null ? true : Boolean(u.can_take_screening)
  };
}

function mapSchool(school = {}) {
  return {
    id: Number(school.id || 0),
    name: String(school.name || "").trim(),
    classrooms: (school.classrooms || []).map(classroom => ({
      id: Number(classroom.id || 0),
      name: String(classroom.name || "").trim()
    }))
  };
}

function mapMoodOption(option = {}) {
  return {
    id: Number(option.id || 0),
    emoji: option.emoji || "🙂",
    label: option.label || "",
    description: option.description || "",
    color: normalizeColor(option.color, colors.pink),
    score: clamp(Number(option.score || 1), 1, 5)
  };
}

function mapMoodEntry(entry = {}) {
  const mood = mapMoodOption(entry.mood_option || entry.mood);
  if (!mood.id && !mood.label) return null;
  const date = entry.entry_date || "";
  return {
    id: Number(entry.id || 0),
    entryDate: date,
    dayName: formatDay(date),
    dateLabel: formatDate(date),
    mood,
    note: entry.note || "",
    energy: clamp(Number(entry.energy || 0), 0, 10),
    stress: clamp(Number(entry.stress || 0), 0, 10)
  };
}

function mapEducationCategory(category = {}) {
  return {
    id: category.slug || String(category.id || ""),
    title: category.title || "Kategori",
    description: category.description || ""
  };
}

function mapEducationContent(content = {}, parentCategory = {}) {
  const category = content.category || parentCategory;
  return {
    id: Number(content.id || 0),
    title: content.title || "",
    categoryId: category.slug || String(category.id || content.education_category_id || ""),
    categoryTitle: category.title || "",
    type: String(content.type || "ARTICLE").toUpperCase(),
    readTime: content.read_time_label || (content.read_time_minutes ? `${content.read_time_minutes} menit` : ""),
    summary: stripHtml(content.summary || ""),
    body: stripHtml(content.body || ""),
    mediaUrl: content.media_url || "",
    accentColor: normalizeColor(content.accent_color, colors.lavender)
  };
}

function mapScreeningQuestion(question = {}) {
  return {
    id: Number(question.id || 0),
    number: Number(question.number || question.id || 0),
    scale: String(question.scale || "STRESS").toUpperCase(),
    text: question.text || ""
  };
}

function mapScreeningAnalysis(analysis = {}) {
    return {
        severity: normalizeSeverity(analysis.severity) || null,
        severityLabel: analysis.severity_label || severityLabel(analysis.severity),
        title: stripHtml(analysis.title || ""),
        mainPoints: Array.isArray(analysis.main_points)
          ? analysis.main_points.map(stripHtml).filter(Boolean)
          : [],
        educationMessage: stripHtml(analysis.education_message || "")
    };
}

function mapScreeningResult(result = {}) {
  const fallbackSeverity = highestSeverityKey([
    result.depression_severity,
    result.anxiety_severity,
    result.stress_severity
  ]);
  const scores = [
    mapDassScore("Depresi", result.depression_score, result.depression_severity),
    mapDassScore("Kecemasan", result.anxiety_score, result.anxiety_severity),
    mapDassScore("Stres", result.stress_score, result.stress_severity)
  ];
  return {
    id: Number(result.id || 0),
    dateLabel: formatDate(result.taken_at),
    summary: stripHtml(result.summary || ""),
    scores,
    analysis: result.analysis
      ? mapScreeningAnalysis({ ...result.analysis, severity: result.analysis.severity || fallbackSeverity })
      : null,
    recommendation: result.recommendation ? mapRecommendation(result.recommendation, fallbackSeverity) : null
  };
}

function mapDassScore(label, rawScore, severity) {
  return {
    label,
    rawScore: Number(rawScore || 0),
    severity: severityLabel(severity),
    color: severityColor(severity)
  };
}

function mapRecommendation(recommendation = {}, fallbackSeverity = null) {
  const severity = normalizeSeverity(recommendation.severity || fallbackSeverity);
  return {
    id: Number(recommendation.id || 0),
    title: stripHtml(recommendation.title || ""),
    category: recommendation.category || "",
    severity: severity || "normal",
    severityLabel: severityLabel(severity),
    description: stripHtml(recommendation.description || ""),
    durationMinutes: recommendation.duration_minutes == null ? null : Number(recommendation.duration_minutes),
    duration: recommendation.duration_label || (recommendation.duration_minutes ? `${recommendation.duration_minutes} menit` : ""),
    priority: recommendation.priority || "",
    accentColor: normalizeColor(recommendation.accent_color, colors.mint),
    isActive: Boolean(recommendation.is_active ?? true),
    isHighSeverity: severity === "severe" || severity === "extremely_severe",
    hasSafetyMessage: containsSafetyMessage(recommendation.description || "")
  };
}

function mapCommunityPost(post = {}, currentUserId = 0) {
  const author = post.user || post.author || {};
  return {
    id: Number(post.id || 0),
    author: author.name || "Pengguna MENTARI",
    role: author.level || author.role || "",
    timeLabel: formatDateTime(post.created_at),
    tag: post.tag || "",
    content: post.content || "",
    likes: Number(post.likes_count || 0),
    likedByMe: Boolean(post.liked_by_me),
    isPinned: Boolean(post.is_pinned),
    isMine: Boolean(post.is_mine ?? (author.id && Number(author.id) === Number(currentUserId)))
  };
}

function mapRiskAlert(alert = {}) {
  return {
    id: Number(alert.id || 0),
    level: alert.level || "stable",
    title: alert.title || "",
    message: alert.message || "",
    recommendation: alert.recommendation || "",
    dismissedAt: alert.dismissed_at || null
  };
}

function mapStatistics(statistics) {
  if (!statistics) return cloneData(emptyActivityStats);
  const palette = [colors.pink, colors.lavender, colors.mint, colors.peach, colors.sun];
  if (Array.isArray(statistics)) {
    const mapped = statistics.map((item, index) => ({
      label: item.label || "",
      value: String(item.value ?? ""),
      helper: item.helper || "",
      accentColor: normalizeColor(item.accent_color, palette[index % palette.length])
    }));
    return mapped.length ? mapped : cloneData(emptyActivityStats);
  }
  if (typeof statistics === "object") {
    const mapped = Object.entries(statistics).map(([key, value], index) => ({
      label: toTitle(key),
      value: typeof value === "object" ? String(value?.value ?? "") : String(value ?? ""),
      helper: typeof value === "object" ? value?.helper || "" : "",
      accentColor: palette[index % palette.length]
    }));
    return mapped.length ? mapped : cloneData(emptyActivityStats);
  }
  return cloneData(emptyActivityStats);
}

function deriveCategories(contents) {
  const categories = distinctBy(
    contents
      .filter((content) => content.categoryId)
      .map((content) => ({
        id: content.categoryId,
        title: content.categoryTitle || "Kategori",
        description: ""
      })),
    (item) => item.id
  );
  return [{ id: "all", title: "Semua", description: "Semua materi admin" }, ...categories];
}

function distinctBy(items, keyFn) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeColor(value, fallback) {
  if (typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value.trim())) return value.trim();
  return fallback;
}

function normalizeSeverity(value) {
  const normalized = String(value || "").toLowerCase().trim().replace(/\s+/g, "_");
  const aliases = {
    normal: "normal",
    mild: "mild",
    ringan: "mild",
    moderate: "moderate",
    sedang: "moderate",
    severe: "severe",
    berat: "severe",
    extremely_severe: "extremely_severe",
    sangat_berat: "extremely_severe",
    sangat_parah: "extremely_severe"
  };
  return aliases[normalized] || normalized;
}

function highestSeverityKey(values = []) {
  return values
    .map(normalizeSeverity)
    .filter(Boolean)
    .sort((a, b) => severityRank(b) - severityRank(a))[0] || "";
}

function severityRank(value) {
  const map = {
    normal: 1,
    mild: 2,
    moderate: 3,
    severe: 4,
    extremely_severe: 5
  };
  return map[normalizeSeverity(value)] || 0;
}

function severityLabel(value) {
  const map = {
    normal: "Normal",
    mild: "Ringan",
    moderate: "Sedang",
    severe: "Berat",
    extremely_severe: "Sangat berat"
  };
  return map[normalizeSeverity(value)] || String(value || "").replace(/_/g, " ");
}

function severityColor(value) {
  const map = {
    normal: colors.mint,
    mild: colors.lavender,
    moderate: colors.sun,
    severe: colors.peach,
    extremely_severe: colors.pink
  };
  return map[normalizeSeverity(value)] || colors.pink;
}

function containsSafetyMessage(value) {
  const text = stripHtml(value).toLowerCase();
  return [
    "pesan keselamatan",
    "tidak aman",
    "menyakiti diri",
    "bunuh diri",
    "darurat",
    "segera hubungi",
    "orang dewasa tepercaya",
    "guru bk",
    "tenaga kesehatan"
  ].some((keyword) => text.includes(keyword));
}

function stripHtml(value) {
  if (value == null) return "";
  return String(value)
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDay(value) {
  const date = parseDate(value);
  return date ? new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(date) : String(value || "").slice(0, 3);
}

function formatDate(value) {
  const date = parseDate(value);
  return date ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date) : String(value || "");
}

function formatDateTime(value) {
  const date = parseDate(value);
  return date
    ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(date)
    : String(value || "");
}

function formatMonthYear(value) {
  const date = parseDate(value);
  return date ? new Intl.DateTimeFormat("id-ID", { month: "short", year: "numeric" }).format(date) : "";
}

function toTitle(value) {
  return String(value).replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function settleAll(promises) {
  return Promise.all(promises.map((promise) =>
    Promise.resolve(promise).then(
      (value) => ({ status: "fulfilled", value }),
      (reason) => ({ status: "rejected", reason })
    )
  ));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
