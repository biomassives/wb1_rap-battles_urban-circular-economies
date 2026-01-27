/**
 * profile-ui.js - THE COMMANDER'S INTERFACE
 * Handles tab switching, role-theming, and form integration.
 */

const ProfileUI = {
  init() {
    this.bindTabs();
    this.initFormSync();
    console.log("█ MISSION_CONTROL_UI: ONLINE");
  },

  bindTabs() {
    const tabs = document.querySelectorAll('.mission-tab');
    const sections = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-tab');

        // 1. UI Feedback: Update Button States
        tabs.forEach(t => {
          t.classList.remove('active', 'bg-green-900/20', 'border-green-500');
          t.classList.add('border-green-900'); // Reset to dim border
        });
        tab.classList.add('active', 'bg-green-900/20', 'border-green-500');
        tab.classList.remove('border-green-900');

        // 2. Section Visibility
        sections.forEach(s => s.style.display = 'none');
        const activeSection = document.getElementById(`tab-${target}`);
        if (activeSection) {
          activeSection.style.display = 'block';
          // Trigger a subtle CRT flicker on entry
          activeSection.classList.add('scanline-flicker');
        }

        // 3. Auto-Save trigger
        // When switching away, we force a save of any active form
        this.saveAllActiveForms();
      });
    });
  },

  initFormSync() {
    // Look for any form inside the tabs and enable the "Restore" logic
    document.querySelectorAll('form[data-mission-form]').forEach(form => {
      const id = form.id;
      if (window.formStorage.hasSavedData(id)) {
        console.log(`[SYSTEM] Local cache found for ${id}.`);
        // You can use your existing showRestorePrompt here
        window.formStorage.showRestorePrompt(id);
      }
    });
  },

  saveAllActiveForms() {
    document.querySelectorAll('form[data-mission-form]').forEach(form => {
      window.formStorage.saveForm(form.id);
    });
  },

  // This bridges to your pushToServer method in form-storage.js
  async syncTabToServer(formId) {
    const btn = document.querySelector(`button[data-sync="${formId}"]`);
    if (btn) btn.innerText = "█ SYNCING...";
    
    const result = await window.formStorage.pushToServer(formId);
    
    if (result.success) {
      btn.innerText = "█ SYNC_COMPLETE";
      btn.classList.add('text-green-400');
    } else {
      btn.innerText = "█ SYNC_ERROR";
      btn.classList.add('text-red-500');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => ProfileUI.init());
