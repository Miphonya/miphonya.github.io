// Nouvelle fonction formatTime qui arrondit le temps sans décimale
function formatTime(minutes) {
  minutes = Math.round(minutes);  // arrondi au nombre entier le plus proche
  let hours = Math.floor(minutes / 60);
  let mins = minutes % 60;
  return hours > 0 ? `${hours}h${mins.toString().padStart(2, '0')}min` : `${mins}min`;
}

/* ================================
       1. LOGIQUE DE PLANIFICATION
   ================================ */
let pilots = ['P1', 'P2', 'P3', 'P4'];
const sections = 6;
const sectionDuration = 60; // en minutes
let schedule = JSON.parse(localStorage.getItem('schedule')) || Array.from({ length: sections }, () => [...pilots]);

function generateSchedule() {
  const table = document.getElementById("scheduleTable");
  table.innerHTML = "";

  // Ligne d'en-tête indiquant l'intervalle de changement
  let headerRow = table.insertRow();
  schedule.forEach((sectionPilots) => {
    let th = document.createElement("th");
    th.colSpan = 4;
    th.textContent = "Changement toutes les " + formatTime(sectionDuration / sectionPilots.length) + ".";
    headerRow.appendChild(th);
  });

  // Ligne des pilotes
  let pilotRow = table.insertRow();
  schedule.forEach((sectionPilots, sectionIndex) => {
    for (let i = 0; i < 4; i++) {
      let td = pilotRow.insertCell();
      if (sectionPilots[i]) {
        td.textContent = sectionPilots[i];
        td.onclick = function() { confirmRemovePilot(sectionPilots[i], sectionIndex); };
      } else {
        let addButton = document.createElement("button");
        addButton.textContent = "Ajouter un pilote";
        addButton.onclick = function() { addPilotToSegment(sectionIndex); };
        td.appendChild(addButton);
      }
    }
  });

  // Ligne des horaires de changement
  let timeRow = table.insertRow();
  schedule.forEach((sectionPilots, sectionIndex) => {
    let interval = sectionDuration / sectionPilots.length;
    for (let j = 0; j < 4; j++) {
      let td = timeRow.insertCell();
      if (j < sectionPilots.length) {
        td.textContent = formatTime(sectionIndex * sectionDuration + j * interval);
      } else {
        td.textContent = "";
      }
    }
  });
  localStorage.setItem('schedule', JSON.stringify(schedule));
}

function confirmRemovePilot(pilot, segmentIndex) {
  if (confirm(`Voulez-vous vraiment supprimer ${pilot} à partir de la section ${segmentIndex + 1} ?`)) {
    removePilotFromSegment(pilot, segmentIndex);
  }
}

function removePilotFromSegment(pilot, segmentIndex) {
  for (let i = segmentIndex; i < sections; i++) {
    schedule[i] = schedule[i].filter(p => p !== pilot);
  }
  generateSchedule();
}

function addPilotToSegment(segmentIndex) {
  let newPilot = prompt("Entrez le nom du nouveau pilote :");
  if (newPilot) {
    for (let i = segmentIndex; i < sections; i++) {
      if (schedule[i].length < 4) {
        schedule[i].push(newPilot);
      }
    }
    generateSchedule();
  }
}

/* ================================
       2. MINUTEUR ET CHRONOMÈTRE
       ================================ */
const timerDuration = 6 * 3600; // 6 heures en secondes

let timerEndTime = localStorage.getItem("timerEndTime") ? parseInt(localStorage.getItem("timerEndTime")) : null;
let pausedTimerRemaining = localStorage.getItem("pausedTimerRemaining") ? parseInt(localStorage.getItem("pausedTimerRemaining")) : null;
let stopwatchStartTime = localStorage.getItem("stopwatchStartTime") ? parseInt(localStorage.getItem("stopwatchStartTime")) : null;
let stopwatchElapsed = localStorage.getItem("stopwatchElapsed") ? parseInt(localStorage.getItem("stopwatchElapsed")) : 0;
let triggeredEvents = localStorage.getItem("triggeredEvents") ? JSON.parse(localStorage.getItem("triggeredEvents")) : [];
let isPaused = localStorage.getItem("isPaused") === "true";

function updateClock() {
  let now = new Date();
  let hours = now.getHours().toString().padStart(2, '0');
  let minutes = now.getMinutes().toString().padStart(2, '0');
  let seconds = now.getSeconds().toString().padStart(2, '0');
  document.getElementById('clock').textContent = `${hours}:${minutes}:${seconds}`;
}
setInterval(updateClock, 1000);
updateClock();

function updateTimer() {
  let remaining;
  if (isPaused && pausedTimerRemaining !== null) {
    remaining = pausedTimerRemaining;
  } else if (timerEndTime) {
    let now = Math.floor(Date.now() / 1000);
    remaining = timerEndTime - now;
    if (remaining <= 0) {
      remaining = 0;
      timerEndTime = null;
      localStorage.removeItem("timerEndTime");
      alert("Le minuteur est terminé !");
    }
  } else {
    remaining = timerDuration;
  }
  let hours = Math.floor(remaining / 3600).toString().padStart(2, '0');
  let minutes = Math.floor((remaining % 3600) / 60).toString().padStart(2, '0');
  let seconds = (remaining % 60).toString().padStart(2, '0');
  document.getElementById('timer').textContent = `${hours}:${minutes}:${seconds}`;
}
setInterval(updateTimer, 1000);
updateTimer();

function updateStopwatch() {
  let displayTime;
  if (!isPaused && stopwatchStartTime) {
    let now = Math.floor(Date.now() / 1000);
    displayTime = stopwatchElapsed + (now - stopwatchStartTime);
  } else {
    displayTime = stopwatchElapsed;
  }

  // Déclenchement du son 2 minutes avant chaque changement de pilote
  schedule.forEach((sectionPilots, sectionIndex) => {
    let pilotCount = sectionPilots.length;
    if (pilotCount > 0) {
      let interval = sectionDuration / pilotCount; // en minutes
      for (let j = 0; j < pilotCount; j++) {
        let eventTimeMinutes = sectionIndex * sectionDuration + j * interval;
        let eventTimeSec = Math.floor(eventTimeMinutes * 60);
        if (displayTime === eventTimeSec - 120 && !triggeredEvents.includes(eventTimeSec)) {
          triggeredEvents.push(eventTimeSec);
          localStorage.setItem("triggeredEvents", JSON.stringify(triggeredEvents));
          document.getElementById('alertSound').play();
        }
      }
    }
  });

  let hours = Math.floor(displayTime / 3600).toString().padStart(2, '0');
  let minutes = Math.floor((displayTime % 3600) / 60).toString().padStart(2, '0');
  let seconds = (displayTime % 60).toString().padStart(2, '0');
  document.getElementById('stopwatch').textContent = `${hours}:${minutes}:${seconds}`;
}
setInterval(updateStopwatch, 1000);
updateStopwatch();

// Démarrer minuteur & chrono
document.getElementById("startCombinedButton").addEventListener("click", function() {
  let now = Math.floor(Date.now() / 1000);
  if (!timerEndTime && !pausedTimerRemaining) {
    timerEndTime = now + timerDuration;
    localStorage.setItem("timerEndTime", timerEndTime);
  }
  if (!stopwatchStartTime) {
    stopwatchStartTime = now;
    localStorage.setItem("stopwatchStartTime", stopwatchStartTime);
  }
  this.disabled = true;
});
if (timerEndTime || stopwatchStartTime || pausedTimerRemaining) {
  document.getElementById("startCombinedButton").disabled = true;
}

// Pause / Resume
function togglePauseResume() {
  let now = Math.floor(Date.now() / 1000);
  if (!isPaused) {
    // Mettre en pause
    if (timerEndTime) {
      pausedTimerRemaining = timerEndTime - now;
      localStorage.setItem("pausedTimerRemaining", pausedTimerRemaining);
      timerEndTime = null;
      localStorage.removeItem("timerEndTime");
    }
    if (stopwatchStartTime) {
      stopwatchElapsed += (now - stopwatchStartTime);
      localStorage.setItem("stopwatchElapsed", stopwatchElapsed);
      stopwatchStartTime = null;
      localStorage.removeItem("stopwatchStartTime");
    }
    isPaused = true;
    localStorage.setItem("isPaused", "true");
    document.getElementById("pauseResumeButton").textContent = "Reprendre";
  } else {
    // Reprendre
    if (pausedTimerRemaining !== null) {
      timerEndTime = now + pausedTimerRemaining;
      localStorage.setItem("timerEndTime", timerEndTime);
      pausedTimerRemaining = null;
      localStorage.removeItem("pausedTimerRemaining");
    }
    stopwatchStartTime = now;
    localStorage.setItem("stopwatchStartTime", stopwatchStartTime);
    isPaused = false;
    localStorage.setItem("isPaused", "false");
    document.getElementById("pauseResumeButton").textContent = "Pause";
    
    // Re-synchronisation du prochain changement lors de la reprise
    updateBatteryDisplay();
  }
}

// Persister le chrono avant déchargement
window.addEventListener("beforeunload", function(){
  let now = Math.floor(Date.now() / 1000);
  if (!isPaused && stopwatchStartTime) {
    stopwatchElapsed += (now - stopwatchStartTime);
    localStorage.setItem("stopwatchElapsed", stopwatchElapsed);
    stopwatchStartTime = now;
    localStorage.setItem("stopwatchStartTime", stopwatchStartTime);
  }
});

// Réinitialisation générale incluant le planning, les timers et l'état des batteries
function resetSchedule() {
  if (confirm("Voulez-vous vraiment réinitialiser le planning, le minuteur, le chronomètre et l'état des batteries ?")) {
    // Réinitialisation du planning
    schedule = Array.from({ length: sections }, () => [...pilots]);
    localStorage.removeItem('schedule');
    generateSchedule();

    // Réinitialisation des timers
    timerEndTime = null;
    pausedTimerRemaining = null;
    localStorage.removeItem("timerEndTime");
    localStorage.removeItem("pausedTimerRemaining");
    document.getElementById('timer').textContent = "06:00:00";

    stopwatchStartTime = null;
    stopwatchElapsed = 0;
    localStorage.removeItem("stopwatchStartTime");
    localStorage.removeItem("stopwatchElapsed");
    document.getElementById('stopwatch').textContent = "00:00:00";

    triggeredEvents = [];
    localStorage.removeItem("triggeredEvents");

    isPaused = false;
    localStorage.setItem("isPaused", "false");
    document.getElementById("pauseResumeButton").textContent = "Pause";

    document.getElementById("startCombinedButton").disabled = false;

    // Réinitialisation de l'état des batteries
    battery1.setAttribute('data-value', '4400');
    battery2.setAttribute('data-value', '6000');
    battery3.setAttribute('data-value', '6000');
    localStorage.removeItem('batteryState');
    updateBatteryDisplay();

    // === Réinitialisation de l'état des hydrosticks ===
    hydrostick = Array.from({ length: 22 }, (_, i) => 'H' + (i + 1));
    localStorage.removeItem("hydrostickState");
    generateHydrostickSchedule();
  }
}

/* ======================
       3. AFFICHER / CACHER LA SIDEBAR
   ====================== */
function toggleSidebar() {
  let sidebar = document.getElementById("sidebar");
  if (sidebar.style.display === "none" || sidebar.style.display === "") {
    sidebar.style.display = "block";
  } else {
    sidebar.style.display = "none";
  }
}

// Initialisation du planning
generateSchedule();

/* ======================
       4. BATTERIE
   ====================== */

// Récupération des éléments DOM
const batterySlicerContainer = document.getElementById('batterySlicerContainer');
const batterySlicer = document.getElementById('batterySlicer');
const handle1 = document.getElementById('handle1');
const handle2 = document.getElementById('handle2');
const battery1 = document.getElementById('battery1');
const battery2 = document.getElementById('battery2');
const battery3 = document.getElementById('battery3');

// Capacité totale initiale basée sur les valeurs par défaut
let totalCapacity = 4400 + 6000 + 6000;

// Fonction de formatage pour convertir un nombre de secondes en format "HH:MM:SS"
function formatSeconds(seconds) {
  let h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  let m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  let s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// Sauvegarde de l'état des batteries dans le localStorage
function saveBatteryState() {
  const state = {
    battery1: battery1.getAttribute('data-value'),
    battery2: battery2.getAttribute('data-value'),
    battery3: battery3.getAttribute('data-value')
  };
  localStorage.setItem('batteryState', JSON.stringify(state));
}

// Chargement de l'état des batteries depuis le localStorage
function loadBatteryState() {
  const savedState = localStorage.getItem('batteryState');
  if (savedState) {
    const state = JSON.parse(savedState);
    battery1.setAttribute('data-value', state.battery1);
    battery2.setAttribute('data-value', state.battery2);
    battery3.setAttribute('data-value', state.battery3);
  }
}

// Mise à jour de l'affichage des batteries et sauvegarde de l'état
function updateBatteryDisplay() {
  // Récupération des valeurs actuelles de chaque batterie
  const b1 = parseInt(battery1.getAttribute('data-value'));
  const b2 = parseInt(battery2.getAttribute('data-value'));
  const b3 = parseInt(battery3.getAttribute('data-value'));

  // Capacité totale actuelle (peut varier selon le réglage)
  const currentTotalCapacity = b1 + b2 + b3;
  // Durée totale de la course en secondes (6 heures)
  const totalRaceTime = 6 * 3600; // 21600 secondes

  // Calcul de la durée allouée à chaque batterie en fonction de leur proportion
  const duration1 = Math.round((b1 / currentTotalCapacity) * totalRaceTime);
  const duration2 = Math.round((b2 / currentTotalCapacity) * totalRaceTime);
  const duration3 = totalRaceTime - duration1 - duration2; // pour garantir que la somme fasse 21600 sec

  // Affichage du temps directement dans chaque barre de batterie
  battery1.textContent = formatSeconds(duration1);
  battery2.textContent = formatSeconds(duration2);
  battery3.textContent = formatSeconds(duration3);

  // Récupération du temps écoulé depuis le chronomètre (format "HH:MM:SS")
  let stopwatchStr = document.getElementById('stopwatch').textContent;
  let parts = stopwatchStr.split(':');
  let elapsedSec = parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);

  // Calcul des durées cumulées pour déterminer la batterie en cours
  let cumulative1 = duration1;
  let cumulative2 = duration1 + duration2;
  let cumulative3 = totalRaceTime; // durée totale de la course

  // Détermine le temps restant jusqu'au prochain changement
  let nextDuration = 0;
  if (elapsedSec < cumulative1) {
    // La course est dans la première batterie
    nextDuration = cumulative1 - elapsedSec;
  } else if (elapsedSec < cumulative2) {
    // La course est passée dans la deuxième batterie
    nextDuration = cumulative2 - elapsedSec;
  } else if (elapsedSec < cumulative3) {
    // La course est dans la troisième batterie
    nextDuration = cumulative3 - elapsedSec;
  } else {
    nextDuration = 0; // La course est terminée
  }

  // Calcul et affichage du prochain changement en fonction du temps restant
  const now = new Date();
  const nextChange = new Date(now.getTime() + nextDuration * 1000);
  document.getElementById('nextChange').textContent = nextDuration > 0 
    ? nextChange.toTimeString().substr(0, 8)
    : "Fin course";

  // Mise à jour de la largeur des batteries et de la position des poignées
  adjustBatteryWidths();
  updateHandlePositions();

  // Sauvegarde de l'état courant des batteries
  saveBatteryState();
}

function updateHandlePositions() {
  const b1 = (parseInt(battery1.getAttribute('data-value')) / totalCapacity) * 100;
  const b2 = (parseInt(battery2.getAttribute('data-value')) / totalCapacity) * 100;
  // La première poignée se place à la fin de battery1
  handle1.style.left = `${b1}%`;
  // La deuxième poignée se place à la fin de battery1 + battery2
  handle2.style.left = `${b1 + b2}%`;
}

function adjustRemainingTime(newB1) {
  // Calcul de la capacité restante à répartir entre les batteries 2 et 3
  let remaining = totalCapacity - newB1;
  let newB2 = Math.round(remaining / 2);
  let newB3 = remaining - newB2;

  battery2.setAttribute('data-value', newB2);
  battery3.setAttribute('data-value', newB3);

  adjustBatteryWidths();
  updateBatteryDisplay();
}

function adjustBatteryWidths() {
  // Ajuste les largeurs en pourcentage en fonction de la capacité de chaque batterie
  const b1 = (parseInt(battery1.getAttribute('data-value')) / totalCapacity) * 100;
  const b2 = (parseInt(battery2.getAttribute('data-value')) / totalCapacity) * 100;
  const b3 = (parseInt(battery3.getAttribute('data-value')) / totalCapacity) * 100;

  battery1.style.width = `${b1}%`;
  battery2.style.width = `${b2}%`;
  battery3.style.width = `${b3}%`;
}

// Gestion du déplacement de la première poignée
handle1.addEventListener('mousedown', (e) => {
  function onMouseMove(event) {
    const totalWidth = batterySlicerContainer.offsetWidth;
    // Calcul de la nouvelle valeur en fonction de la position de la souris
    let newWidth = ((event.clientX - batterySlicer.offsetLeft) / totalWidth) * totalCapacity;

    if (newWidth > 1000 && newWidth < totalCapacity - 2000) {
      battery1.setAttribute('data-value', Math.round(newWidth));
      adjustRemainingTime(newWidth);
    }
  }

  function onMouseUp() {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
});

// Gestion du déplacement de la deuxième poignée
handle2.addEventListener('mousedown', (e) => {
  function onMouseMove(event) {
    const totalWidth = batterySlicerContainer.offsetWidth;
    // Calcul de la nouvelle valeur de la batterie 2
    let newWidth = ((event.clientX - handle1.offsetLeft) / totalWidth) * totalCapacity;

    if (newWidth > 1000 && newWidth < totalCapacity - 1000) {
      battery2.setAttribute('data-value', Math.round(newWidth));
      battery3.setAttribute('data-value', Math.round(totalCapacity - parseInt(battery1.getAttribute('data-value')) - newWidth));
      adjustBatteryWidths();
      updateBatteryDisplay();
    }
  }

  function onMouseUp() {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
});

// Chargement de l'état sauvegardé dès le chargement de la page
loadBatteryState();
// Initialisation de l'affichage des batteries
updateBatteryDisplay();


/* ======================
       4. Hydrogène
   ====================== */
let hydrostick = Array.from({ length: 22 }, (_, i) => 'H' + (i + 1));

function loadHydrostickState() {
  const savedState = localStorage.getItem("hydrostickState");
  if (savedState) {
    hydrostick = JSON.parse(savedState);
  }
}

function generateHydrostickSchedule() {
  const table = document.getElementById("hydrostickTable");
  table.innerHTML = "";
  
  // Durée totale de la section hydrogène (en minutes)
  const duration = 360;
  // Intervalle de changement en fonction du nombre de hydrosticks actuels
  const interval = duration / hydrostick.length;
  
  // === Ligne d'en-tête ===
  let headerRow = table.insertRow();
  let headerCell = document.createElement("th");
  headerCell.colSpan = hydrostick.length;
  headerCell.textContent = "Changement toutes les " + formatTime(interval) + ".";
  headerRow.appendChild(headerCell);

  // === Ligne des hydrosticks ===
  let hydrosRow = table.insertRow();
  hydrostick.forEach((hs, index) => {
    let cell = hydrosRow.insertCell();
    cell.textContent = hs;
    cell.style.cursor = 'pointer'; // Indique que la cellule est cliquable
    // Au clic, demande confirmation pour supprimer l'hydrostick
    cell.onclick = function() {
      if (confirm(`Voulez-vous vraiment supprimer ${hs} ?`)) {
        hydrostick.splice(index, 1);
        generateHydrostickSchedule();
      }
    };
  });
  
  // === Ligne des horaires ===
  let timeRow = table.insertRow();
  hydrostick.forEach((_, index) => {
    let cell = timeRow.insertCell();
    cell.textContent = formatTime(index * interval);
  });
  
  // Sauvegarde de l'état actuel des hydrosticks
  localStorage.setItem("hydrostickState", JSON.stringify(hydrostick));
}

loadHydrostickState();
generateHydrostickSchedule();


/* ======================
      5. Darkmode
   ====================== */
function themeSombre() {
  const currentTheme = document.querySelector('link[rel="stylesheet"]');
  if (currentTheme.getAttribute('href') === 'styles.css') {
    currentTheme.setAttribute('href', 'styles_dark.css');
  } else {
    currentTheme.setAttribute('href', 'styles.css');
  }
}
