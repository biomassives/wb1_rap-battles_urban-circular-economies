/**
 * metabolic-logic.js - Updated for Mission Control UX
 * Bridges System Health with the Carousel and Messaging Feed
 */



// Add this to your existing metabolic-logic.js
function injectFollowUp(type, title, description) {
  const list = document.getElementById('activity-list');
  const timestamp = new Date().toLocaleTimeString();
  
  const html = `
    <li class="p-3 bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] message-item" data-type="${type.toLowerCase()}">
      <div class="flex justify-between items-start mb-1">
        <span class="bg-black text-white text-[8px] px-1 font-bold">${type}</span>
        <span class="text-[9px] font-bold">${timestamp}</span>
      </div>
      <h4 class="font-black text-sm uppercase">${title}</h4>
      <p class="text-xs leading-tight">${description}</p>
      <div class="mt-2 flex gap-2">
        <button class="text-[9px] font-bold border border-black px-1 hover:bg-black hover:text-white">[ FOLLOW_UP ]</button>
        <button class="text-[9px] font-bold border border-black px-1 hover:bg-black hover:text-white">[ DISMISS ]</button>
      </div>
    </li>
  `;
  list.insertAdjacentHTML('afterbegin', html);
}

// Inside your updateMetabolicUX 'try' block:
if (data.nitrates > 10) {
  injectFollowUp("RESEARCH", "NITRATE_SPIKE_DETECTED", "Bio-filter throughput is low. Verify aquatic plant health in Section 4.");
}


async function updateMetabolicUX() {
  const syncLabel = document.getElementById('sync-status');
  const activityList = document.getElementById('activity-list');
  
  if (syncLabel) {
    syncLabel.innerText = "◆ FETCHING_BIO_FACTS...";
    syncLabel.classList.add('blink');
  }

  try {
    const response = await fetch('/api/metabolic/system-health');
    const data = await response.json();

    // 1. Update UI Values
    updateElement('nitrate-val', data.nitrates);
    updateElement('o2-val', `${data.dissolved_oxygen}%`);
    updateElement('ph-val', data.ph);
    updateElement('harvest-val', data.suggested_harvest);

    // 2. Hazard Detection & Logic-Driven UI
    const nitrateIssue = applyHealthStyle('card-nitrates', data.nitrates, 0, 10);
    const o2Issue = applyHealthStyle('card-o2', data.dissolved_oxygen, 85, 100);
    const phIssue = applyHealthStyle('card-ph', data.ph, 6.5, 7.5);

    const hasCriticalIssue = nitrateIssue || o2Issue || phIssue;

    // 3. Dynamic Message Injection (Transparency Feed)
    if (hasCriticalIssue && activityList) {
      injectSystemAlert(activityList, "CRITICAL_HYDROPONIC_IMBALANCE", "Immediate water polishing or nutrient adjustment required.");
    }

    // 4. Update Global Sync Status
    if (syncLabel) {
      if (hasCriticalIssue) {
        syncLabel.innerText = "⚠️ SYSTEM_HALT_REQUIRED";
        syncLabel.classList.add('text-red-500');
        // If a carousel exists, we could snap it to the first slide here
      } else {
        syncLabel.innerText = "◆ SYSTEM_STABLE";
        syncLabel.classList.remove('text-red-500', 'blink');
        syncLabel.classList.add('text-green-400');
      }
    }
  } catch (error) {
    console.error("METABOLIC_SYNC_ERROR:", error);
    if (syncLabel) syncLabel.innerText = "✖ CONNECTION_OFFLINE";
  }
}

// Helper to handle missing elements gracefully (Teachable approach)
function updateElement(id, val) {
  const el = document.getElementById(id);
  if (el) el.innerText = val || '--';
}

function injectSystemAlert(container, title, message) {
  // Check if alert already exists to prevent duplication
  if (document.getElementById('critical-alert-item')) return;

  const alertHtml = `
    <li id="critical-alert-item" class="message-item p-3 bg-red-900/20 border-l-4 border-red-600 animate-pulse" data-type="system">
      <div class="flex justify-between">
        <span class="text-[9px] font-bold text-red-500 uppercase">⚠️ ${title}</span>
        <span class="text-[9px] text-gray-600">JUST_NOW</span>
      </div>
      <p class="text-sm mt-1 text-white">${message}</p>
    </li>
  `;
  container.insertAdjacentHTML('afterbegin', alertHtml);
}

function applyHealthStyle(cardId, value, min, max) {
  const card = document.getElementById(cardId);
  if (!card) return false;

  const num = parseFloat(value);
  const isOutOfRange = (num < min || num > max);

  if (isOutOfRange) {
    card.classList.add('border-red-600', 'animate-pulse');
    card.classList.remove('border-green-900');
    return true; // Returns true if there is a hazard
  } else {
    card.classList.remove('border-red-600', 'animate-pulse');
    card.classList.add('border-green-900');
    return false;
  }
}

// Initial pull
updateMetabolicUX();
