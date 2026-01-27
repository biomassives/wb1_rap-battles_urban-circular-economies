/**
 * Form Storage Utility
 * Auto-saves form data to localStorage to prevent data loss
 * Restores form data when user returns
 */
/*  */
class FormStorage {
  constructor() {
    this.prefix = 'form_data_';
    this.autosaveInterval = 30000; // 30 seconds
    this.autosaveTimers = new Map();
  }

  /**
   * Get storage key for a form
   */
  getKey(formId) {
    const wallet = window.walletManager?.connectedWallet || 'anonymous';
    return `${this.prefix}${formId}_${wallet}`;
  }

  /**
   * Save form data to localStorage
   */
  saveForm(formId) {
    const form = document.getElementById(formId);
    if (!form) {
      console.warn(`Form ${formId} not found`);
      return false;
    }

    const formData = new FormData(form);
    const data = {
      timestamp: new Date().toISOString(),
      fields: {}
    };

    // Collect all form field values
    for (const [key, value] of formData.entries()) {
      data.fields[key] = value;
    }

    // Also handle checkboxes (they don't appear in FormData if unchecked)
    form.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      data.fields[checkbox.name || checkbox.id] = checkbox.checked;
    });

    // Handle radio buttons
    form.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
      data.fields[radio.name] = radio.value;
    });

    // Save to localStorage
    try {
      localStorage.setItem(this.getKey(formId), JSON.stringify(data));
      console.log(`Form ${formId} saved to localStorage`);
      return true;
    } catch (error) {
      console.error(`Error saving form ${formId}:`, error);
      return false;
    }
  }

  /**
   * Load form data from localStorage
   */
  loadForm(formId) {
    const key = this.getKey(formId);
    const savedData = localStorage.getItem(key);

    if (!savedData) {
      return null;
    }

    try {
      const data = JSON.parse(savedData);
      const form = document.getElementById(formId);

      if (!form) {
        console.warn(`Form ${formId} not found`);
        return null;
      }

      // Restore form field values
      Object.entries(data.fields).forEach(([name, value]) => {
        const field = form.querySelector(`[name="${name}"], #${name}`);

        if (field) {
          if (field.type === 'checkbox') {
            field.checked = value === true || value === 'true';
          } else if (field.type === 'radio') {
            const radio = form.querySelector(`input[name="${name}"][value="${value}"]`);
            if (radio) radio.checked = true;
          } else {
            field.value = value;
          }
        }
      });

      console.log(`Form ${formId} loaded from localStorage (saved ${data.timestamp})`);
      return data;
    } catch (error) {
      console.error(`Error loading form ${formId}:`, error);
      return null;
    }
  }

  /**
   * Clear saved form data
   */
  clearForm(formId) {
    const key = this.getKey(formId);
    localStorage.removeItem(key);
    console.log(`Form ${formId} cleared from localStorage`);
  }

  /**
   * Enable auto-save for a form
   */
  enableAutosave(formId, interval = this.autosaveInterval) {
    const form = document.getElementById(formId);
    if (!form) {
      console.warn(`Form ${formId} not found for autosave`);
      return;
    }

    // Clear any existing timer
    this.disableAutosave(formId);

    // Save immediately on any input change
    const saveHandler = () => this.saveForm(formId);

    form.addEventListener('input', saveHandler);
    form.addEventListener('change', saveHandler);

    // Also save periodically
    const timer = setInterval(() => this.saveForm(formId), interval);
    this.autosaveTimers.set(formId, { timer, saveHandler });

    console.log(`Autosave enabled for form ${formId} (interval: ${interval}ms)`);
  }

  /**
   * Disable auto-save for a form
   */
  disableAutosave(formId) {
    const data = this.autosaveTimers.get(formId);
    if (data) {
      clearInterval(data.timer);

      const form = document.getElementById(formId);
      if (form && data.saveHandler) {
        form.removeEventListener('input', data.saveHandler);
        form.removeEventListener('change', data.saveHandler);
      }

      this.autosaveTimers.delete(formId);
      console.log(`Autosave disabled for form ${formId}`);
    }
  }

  /**
   * Check if form has saved data
   */
  hasSavedData(formId) {
    const key = this.getKey(formId);
    return localStorage.getItem(key) !== null;
  }

  /**
   * Show restore prompt
   */
  showRestorePrompt(formId, onRestore, onDiscard) {
    if (!this.hasSavedData(formId)) {
      return false;
    }

    const savedData = JSON.parse(localStorage.getItem(this.getKey(formId)));
    const date = new Date(savedData.timestamp);
    const timeAgo = this.getTimeAgo(date);

    const message = `Found saved form data from ${timeAgo}. Would you like to restore it?`;

    if (confirm(message)) {
      this.loadForm(formId);
      if (onRestore) onRestore(savedData);
    } else {
      this.clearForm(formId);
      if (onDiscard) onDiscard();
    }

    return true;
  }

  /**
   * Get human-readable time ago
   */
  getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  }

  /**
   * Clear all saved forms for current wallet
   */
  clearAllForms() {
    const wallet = window.walletManager?.connectedWallet || 'anonymous';
    const prefix = `${this.prefix}`;

    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(prefix) && key.endsWith(`_${wallet}`)) {
        localStorage.removeItem(key);
      }
    });

    console.log('All forms cleared from localStorage');
  }

  /**
   * Pushes the locally stored form data to the server API
   */
  async pushToServer(formId, endpoint = '/api/profile/upsert') {
    const key = this.getKey(formId);
    const savedData = JSON.parse(localStorage.getItem(key));

    if (!savedData) return { success: false, error: 'No local data found' };

    const walletAddress = window.walletManager?.connectedWallet;
    if (!walletAddress) return { success: false, error: 'No wallet connected' };

    try {
      // 1. Prepare the payload to match your Nile DB schema
      const payload = {
        walletAddress: walletAddress,
        username: savedData.fields.username || null,
        email: savedData.fields.email || null,
        bio: savedData.fields.bio || null,
        location: savedData.fields.location || null,
        // Convert array to stringified JSON for the Postgres JSONB column
        favoriteAnimals: JSON.stringify(this.getMultiSelects(formId, 'favoriteAnimals')),
        themePreference: savedData.fields.themeMode || 'auto',
        notificationSettings: JSON.stringify({
          emailDigest: savedData.fields.emailDigest || 'weekly',
          marketing: !!savedData.fields.notifyKakumaImpact
        })
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json', // MUST MATCH API CHECK
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return { success: true, profile: result.profile };
      } else {
        return { success: false, error: result.message || 'Server error' };
      }
    } catch (error) {
      console.error("Network/Sync error:", error);
      return { success: false, error: error.message };
    }
  }




  /**
   * Helper to grab multiple checkboxes for the JSONB field
   */
  getMultiSelects(formId, name) {
    const form = document.getElementById(formId);
    return Array.from(form.querySelectorAll(`input[name="${name}"]:checked`))
      .map(cb => cb.value);
  }




  /**
   * Get all saved forms for current wallet
   */
  getSavedForms() {
    const wallet = window.walletManager?.connectedWallet || 'anonymous';
    const prefix = `${this.prefix}`;
    const forms = [];

    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(prefix) && key.endsWith(`_${wallet}`)) {
        const formId = key.replace(prefix, '').replace(`_${wallet}`, '');
        const data = JSON.parse(localStorage.getItem(key));
        forms.push({
          formId,
          timestamp: data.timestamp,
          fieldCount: Object.keys(data.fields).length
        });
      }
    });

    return forms;
  }
}

// Initialize global instance
window.formStorage = new FormStorage();

// Helper: Auto-initialize forms with data-autosave attribute
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('form[data-autosave]').forEach(form => {
    const formId = form.id;
    if (!formId) {
      console.warn('Form with data-autosave must have an id attribute');
      return;
    }

    // Show restore prompt if data exists
    window.formStorage.showRestorePrompt(formId);

    // Enable autosave
    const interval = parseInt(form.dataset.autosave) || 30000;
    window.formStorage.enableAutosave(formId, interval);

    // Clear on successful submission
    form.addEventListener('submit', (e) => {
      // Give the form a moment to submit, then clear
      setTimeout(() => {
        window.formStorage.clearForm(formId);
      }, 1000);
    });
  });
});

console.log('FormStorage utility loaded');
