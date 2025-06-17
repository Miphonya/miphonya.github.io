// script.js

// ---------------------------
// 1. Récupération des données
// ---------------------------
async function fetchForecast(lat, lon) {
  const url = `https://www.7timer.info/bin/astro.php?lon=${lon}&lat=${lat}&ac=0&unit=metric&output=json&tzshift=0`;
  const res = await fetch(url);
  const data = await res.json();
  return data.dataseries;
}

// ---------------------------
// 2. Formatage de l’heure
// ---------------------------
function formatDateHour(baseDate, hoursToAdd) {
  const d = new Date(baseDate);
  d.setUTCHours(0, 0, 0, 0);
  d.setHours(d.getHours() + hoursToAdd);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  return `${day}/${month} ${hour}:00`;
}

// ---------------------------
// 3. Affichage des données actuelles
// ---------------------------
function renderCurrent(data) {
  document.getElementById('cloudcover-value').textContent = Math.round((data.cloudcover / 9) * 100) + '%';
  document.getElementById('seeing-value').textContent = `${data.seeing}/5`;
  document.getElementById('transparency-value').textContent = `${data.transparency}/5`;
  document.getElementById('wind-value').textContent = `${data.wind10m.direction} ${data.wind10m.speed} m/s`;
  document.getElementById('temp-value').textContent = `${data.temp2m}°C`;
  document.getElementById('humidity-value').textContent = `${data.rh2m}%`;
}

// ---------------------------
// 4. Création des graphiques
// ---------------------------
function createChart(ctx, label, labels, data, unit = '') {
  const annotations = [];
  let lastDay = null;

  labels.forEach((labelText, index) => {
    const dayStr = labelText.length > 5 ? labelText.split(' ')[0] : null;
    if (dayStr && dayStr !== lastDay) {
      lastDay = dayStr;
      annotations.push({
        type: 'line',
        scaleID: 'x',
        value: index,
        borderColor: 'rgba(255, 99, 132, 0.7)',
        borderWidth: 2,
        borderDash: [6, 6],
        label: { enabled: false }
      });
    }
  });

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: label,
        data: data,
        fill: true,
        backgroundColor: 'rgba(0, 119, 204, 0.2)',
        borderColor: 'rgba(0, 119, 204, 1)',
        tension: 0.3,
        pointRadius: 3,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: val => val + unit
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          labels: { font: { size: 14 } }
        },
        annotation: {
          annotations: annotations
        }
      }
    },
    plugins: [Chart.registry.getPlugin('annotation')]
  });
}

// ---------------------------
// 5. Affichage des graphiques
// ---------------------------
function renderCharts(data) {
  const container = document.getElementById('charts-container');
  container.innerHTML = '';

  const now = new Date();
  const fullLabels = data.map(d => formatDateHour(now, d.timepoint));

  const labels = [];
  let lastDay = null;
  fullLabels.forEach(label => {
    const [day, hour] = label.split(' ');
    if (day !== lastDay) {
      labels.push(label);
      lastDay = day;
    } else {
      labels.push(hour);
    }
  });

  const cloudData = data.map(d => Math.round((d.cloudcover / 9) * 100));
  const seeingData = data.map(d => d.seeing);
  const transpData = data.map(d => d.transparency);
  const windSpeedData = data.map(d => d.wind10m.speed);
  const tempData = data.map(d => d.temp2m);
  const rhData = data.map(d => d.rh2m);

  const chartsInfo = [
    { id: 'cloud-chart', label: 'Nuages (%)', data: cloudData, unit: '%' },
    { id: 'seeing-chart', label: 'Seeing', data: seeingData },
    { id: 'transp-chart', label: 'Transparence', data: transpData },
    { id: 'wind-chart', label: 'Vent (m/s)', data: windSpeedData },
    { id: 'temp-chart', label: 'Température (°C)', data: tempData, unit: '°C' },
    { id: 'rh-chart', label: 'Humidité (%)', data: rhData, unit: '%' },
  ];

  chartsInfo.forEach(({ id, label, data, unit }) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'chart-wrapper';
    const canvas = document.createElement('canvas');
    canvas.id = id;
    wrapper.appendChild(canvas);
    container.appendChild(wrapper);
    createChart(canvas.getContext('2d'), label, labels, data, unit || '');
  });
}

// ---------------------------
// 6. Mode nuit / jour
// ---------------------------
function toggleTheme() {
  document.body.classList.toggle('dark');
  const btn = document.getElementById('theme-toggle');
  btn.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
}
document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

// ---------------------------
// 7. Chargement par géoloc
// ---------------------------
navigator.geolocation.getCurrentPosition(async (position) => {
  const { latitude, longitude } = position.coords;
  loadForecastForCoords(latitude, longitude);
}, async () => {
  const defaultLat = 46.2, defaultLon = 6.15;
  loadForecastForCoords(defaultLat, defaultLon);
});

// ---------------------------
// 8. Gestion recherche
// ---------------------------
const locationInput = document.getElementById('location-search');
const useLocationBtn = document.getElementById('use-location-btn');
const suggestionsList = document.getElementById('suggestions-list');
const coordsDisplay = document.getElementById('coords-display');

let currentSuggestions = [];

function showCoordinates(lat, lon) {
  coordsDisplay.textContent = `Latitude : ${lat.toFixed(5)}, Longitude : ${lon.toFixed(5)}`;
}

async function fetchSuggestions(query) {
  if (!query) return [];
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'astronomie-app/1.0' }
    });
    const results = await res.json();
    return results.map(result => ({
      name: result.display_name,
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon)
    }));
  } catch (error) {
    console.error("Erreur récupération suggestions :", error);
    return [];
  }
}

async function searchLocation(query) {
  const suggestions = await fetchSuggestions(query);
  return suggestions.length ? suggestions[0] : null;
}

async function loadForecastForCoords(lat, lon) {
  const forecast = await fetchForecast(lat, lon);
  renderCurrent(forecast[0]);
  renderCharts(forecast);
  showCoordinates(lat, lon);
}

locationInput.addEventListener('input', async () => {
  const query = locationInput.value.trim();
  if (query.length < 3) {
    suggestionsList.innerHTML = '';
    return;
  }

  const suggestions = await fetchSuggestions(query);
  currentSuggestions = suggestions;
  suggestionsList.innerHTML = '';

  suggestions.forEach(s => {
    const li = document.createElement('li');
    li.textContent = s.name;
    li.classList.add('suggestion-item');
    li.addEventListener('click', () => {
      locationInput.value = s.name;
      suggestionsList.innerHTML = '';
      loadForecastForCoords(s.lat, s.lon);
    });
    suggestionsList.appendChild(li);
  });
});

locationInput.addEventListener('keydown', async (event) => {
  if (event.key === 'Enter') {
    const coords = await searchLocation(locationInput.value);
    if (coords) {
      loadForecastForCoords(coords.lat, coords.lon);
      suggestionsList.innerHTML = '';
    } else {
      alert("Lieu non trouvé.");
    }
  }
});

useLocationBtn.addEventListener('click', () => {
  navigator.geolocation.getCurrentPosition(
    pos => loadForecastForCoords(pos.coords.latitude, pos.coords.longitude),
    () => alert("Impossible d'obtenir votre position.")
  );
});

