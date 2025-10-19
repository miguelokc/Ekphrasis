const API_BASE = "http://127.0.0.1:5000"; // Flask dev server

async function fetchWeather(city, units) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 10000); // 10s timeout

  const url = `${API_BASE}/api/weather/${encodeURIComponent(city)}?units=${encodeURIComponent(units)}`;
  let res;
  try {
    res = await fetch(url, { signal: controller.signal });
  } catch (netErr) {
    clearTimeout(t);
    throw new Error(`Network error contacting API: ${netErr.message}`);
  }
  clearTimeout(t);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` → ${text}` : ""}`);
  }

  // Guard against invalid JSON
  try {
    return await res.json();
  } catch (_) {
    throw new Error("API returned non-JSON response");
  }
}

function renderWeather(data) {
  const now = document.getElementById("weatherNow");
  const ex  = document.getElementById("extremes");
  if (!now || !ex) return;

  if (!data || data.error) {
    now.textContent = "Couldn't load weather.";
    ex.textContent = "";
    return;
  }

  const city    = data.city || "—";
  const country = data.country ? `, ${data.country}` : "";
  const temp    = data.temperature ?? data.temp ?? "—";
  const units   = data.units || ((document.getElementById("unitSelect")?.value || "imperial") === "metric" ? "C" : "F");
  const cond    = data.condition || data.description || "";

  now.innerHTML = `<strong>${city}${country}</strong><br>${temp}°${units}, ${cond}`;

  if (data.high != null && data.low != null) {
    ex.textContent = `Today: High ${data.high}°${units}, Low ${data.low}°${units}`;
  } else {
    ex.textContent = "";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const data = await fetchWeather("Houston", "imperial");
    renderWeather(data);
  } catch (e) {
    console.error(e);
    renderWeather({ error: true });
  }
});

document.getElementById("weatherForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const city  = document.getElementById("cityInput")?.value.trim() || "Houston";
  const units = (document.getElementById("unitSelect")?.value || "imperial").toLowerCase();
  try {
    const data = await fetchWeather(city, units);
    renderWeather(data);
  } catch (e) {
    console.error(e);
    renderWeather({ error: true });
  }
});
async function fetchTopNews() {
  const res = await fetch(`${API_BASE}/news/`);
  if (!res.ok) throw new Error(`News fetch failed: HTTP ${res.status}`);
  return res.json(); // backend returns an ARRAY of articles
}

// Render news articles into #newsList
function renderNewsArray(articles = []) {
  const list = document.getElementById("newsList");
  if (!list) return;

  if (!Array.isArray(articles) || articles.length === 0) {
    list.innerHTML = "<p>No news found.</p>";
    return;
  }

  // Build article cards
  list.innerHTML = articles.map(a => `
    <article class="news-item">
      <h3>${a.title || "Untitled"}</h3>
      ${a.source ? `<div class="news-source">${a.source}</div>` : ""}
      ${a.description ? `<p>${a.description}</p>` : ""}
      ${a.url ? `<a href="${a.url}" target="_blank" rel="noopener">Read More</a>` : ""}
    </article>
  `).join("");
}

// Load headlines when the page is ready
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const articles = await fetchTopNews();
    renderNewsArray(articles);
  } catch (e) {
    console.error(e);
    renderNewsArray([]);
  }
});

const imgEl   = document.getElementById("slide");
const titleEl = document.getElementById("s-title");
const dotsEl  = document.getElementById("dots");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

let slides = [];   // [{src, alt, title, link?}, ...]
let idx = 0;

function renderDots() {
  if (!dotsEl) return;
  dotsEl.innerHTML = slides.map((_, i) =>
    `<button class="dot" data-i="${i}" aria-label="Go to slide ${i+1}"></button>`
  ).join("");

  dotsEl.addEventListener("click", (e) => {
    const b = e.target.closest(".dot");
    if (!b) return;
    show(Number(b.dataset.i));
  });
}

function setActiveDot(i) {
  if (!dotsEl) return;
  [...dotsEl.querySelectorAll(".dot")].forEach((d, k) => {
    d.classList.toggle("active", k === i);
  });
}

function show(i) {
  if (!slides.length) return;
  idx = (i + slides.length) % slides.length;
  const s = slides[idx];

  imgEl.classList.remove("loaded");
  const tmp = new Image();
  tmp.onload = () => {
    imgEl.src = s.src;
    imgEl.alt = s.alt || "";
    requestAnimationFrame(() => imgEl.classList.add("loaded"));
  };
  tmp.src = s.src;

  if (titleEl) titleEl.textContent = s.title || "Gallery";
  setActiveDot(idx);
}

function next() { show(idx + 1); }
function prev() { show(idx - 1); }

prevBtn?.addEventListener("click", prev);
nextBtn?.addEventListener("click", next);

// Called by art loader
function setSlides(newSlides = []) {
  slides = newSlides.filter(s => s && s.src);
  renderDots();
  if (slides.length) show(0);
}
// ===== end slideshow glue =====


async function fetchArt(query, limit = 8) {
  const url = new URL(`${API_BASE}/art/${encodeURIComponent(query)}`);
  url.searchParams.set("limit", String(limit)); // harmless if backend ignores it
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Art fetch failed: HTTP ${res.status}`);
  return res.json(); // could be single object, array, or {items:[...]}
}

// Accept: array | {items: array} | single object | null
function normalizeArtPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.items)) return payload.items;
  if (payload && typeof payload === "object") return [payload]; // <-- your current backend
  return [];
}

function toSlides(items) {
  return items
    .map(a => ({
      src: a.primaryImageSmall || a.primaryImage || a.image || "",
      alt: `${a.title || "Artwork"}${a.artist ? " — " + a.artist : ""}`,
      title: `${a.title || "Artwork"}${a.date ? " (" + a.date + ")" : ""}`,
      link: a.metPage || a.objectURL || "#",
    }))
    .filter(s => s.src); // only keep entries that actually have an image URL
}

async function loadArtToSlideshow(query = "van gogh", limit = 8) {
  try {
    const raw = await fetchArt(query, limit);
    const items = normalizeArtPayload(raw);
    const mapped = toSlides(items);

    if (!mapped.length) {
      setSlides([{ src: "", alt: "No artworks found", title: "No artworks found" }]);
      return;
    }
    setSlides(mapped);
  } catch (e) {
    console.error(e);
    setSlides([{ src: "", alt: "Error loading art", title: "Error loading art" }]);
  }
}

// Run after DOM ready
document.addEventListener("DOMContentLoaded", () => {
  loadArtToSlideshow("impressionism", 8);
});