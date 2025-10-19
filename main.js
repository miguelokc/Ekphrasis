
const $ = (s) => document.querySelector(s);


const API_BASE = "http://127.0.0.1:5000";  // Flask dev server

async function fetchWeather(city, units) {
  const url = `${API_BASE}/api/weather/${encodeURIComponent(city)}?units=${encodeURIComponent(units)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather fetch failed");
  return res.json();
}

function renderWeather(data) {
  const now = document.getElementById("weatherNow");
  const ex  = document.getElementById("extremes");

  if (!data || data.error) {
    now.textContent = "Couldn't load weather.";
    ex.textContent = "";
    return;
  }

 
  const city    = data.city || "—";
  const country = data.country ? `, ${data.country}` : "";
  const temp    = data.temperature ?? data.temp;   
  const units   = data.units || (document.getElementById("unitSelect").value === "metric" ? "C" : "F");
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
  }
});


document.getElementById("weatherForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const city  = document.getElementById("cityInput").value.trim() || "Houston";
  const units = (document.getElementById("unitSelect").value || "imperial").toLowerCase();
  try {
    const data = await fetchWeather(city, units);
    renderWeather(data);
  } catch (e) {
    console.error(e);
    renderWeather({ error: true });
  }
});