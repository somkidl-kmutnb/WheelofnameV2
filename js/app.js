/**
 * Main Application Orchestrator
 */
import { WheelEngine } from './wheel.js';
import { sound } from './audio.js';
import { confetti } from './confetti.js';
import { storage } from './storage.js';
import { history } from './history.js';
import { generateGroups } from './groups.js';

class App {
  constructor() {
    this.currentWinner = null;
    this.currentWinnerIndex = -1;

    // Elements
    this.namesTextarea = document.getElementById('names-input');
    this.namesCountEl = document.getElementById('names-count');
    this.classSelectEl = document.getElementById('class-select');
    this.spinBtn = document.getElementById('spin-btn');
    this.centerSpinBtn = document.getElementById('center-spin-btn');
    this.quickPickBtn = document.getElementById('quick-pick-btn');
    this.shuffleBtn = document.getElementById('shuffle-btn');
    this.sortBtn = document.getElementById('sort-btn');
    this.clearNamesBtn = document.getElementById('clear-names-btn');

    // Modals
    this.winnerModal = document.getElementById('winner-modal');
    this.winnerNameDisplay = document.getElementById('winner-name');
    this.removeWinnerBtn = document.getElementById('remove-winner-btn');
    this.closeWinnerBtn = document.getElementById('close-winner-btn');

    // New Class Modal
    this.newClassModal = document.getElementById('new-class-modal');
    this.newClassNameInput = document.getElementById('new-class-name');
    this.saveNewClassBtn = document.getElementById('save-new-class-btn');

    // Group Generator Elements
    this.groupsModal = document.getElementById('groups-modal');
    this.openGroupsBtn = document.getElementById('open-groups-btn');
    this.generateGroupsBtn = document.getElementById('generate-groups-btn');
    this.groupCountSelect = document.getElementById('group-count-select');
    this.groupsResultGrid = document.getElementById('groups-result');

    // Settings & Controls
    this.settingsModal = document.getElementById('settings-modal');
    this.openSettingsBtn = document.getElementById('open-settings-btn');
    this.durationSelect = document.getElementById('duration-select');
    this.soundToggle = document.getElementById('sound-toggle');
    this.confettiToggle = document.getElementById('confetti-toggle');
    this.contrastToggle = document.getElementById('contrast-toggle');
    this.fullscreenBtn = document.getElementById('fullscreen-btn');
    this.exitFullscreenBtn = document.getElementById('exit-fullscreen-btn');

    // History Tab Elements
    this.historyListEl = document.getElementById('history-list');
    this.clearHistoryBtn = document.getElementById('clear-history-btn');

    // Initialize Canvas Wheel
    this.wheel = new WheelEngine('wheel-canvas', 'wheel-pointer');

    this.init();
  }

  init() {
    this.applySettings();
    this.populateClassSelect();
    this.loadActiveClassData();
    this.setupEventListeners();
    this.renderHistory();

    // Wheel Callbacks
    this.wheel.onSpinStart = () => {
      this.centerSpinBtn.classList.add('spinning');
      this.spinBtn.disabled = true;
      this.quickPickBtn.disabled = true;
    };

    this.wheel.onSpinComplete = (winnerName, index) => {
      this.centerSpinBtn.classList.remove('spinning');
      this.spinBtn.disabled = false;
      this.quickPickBtn.disabled = false;
      this.handleWinner(winnerName, index);
    };
  }

  applySettings() {
    const s = storage.settings;
    this.wheel.spinDuration = (s.spinDuration || 6) * 1000;
    sound.setMuted(!s.soundEnabled);

    if (this.durationSelect) this.durationSelect.value = s.spinDuration;
    if (this.soundToggle) this.soundToggle.checked = s.soundEnabled;
    if (this.confettiToggle) this.confettiToggle.checked = s.confettiEnabled;
    if (this.contrastToggle) {
      this.contrastToggle.checked = s.highContrast;
      if (s.highContrast) {
        document.body.classList.add('high-contrast');
      } else {
        document.body.classList.remove('high-contrast');
      }
    }
  }

  populateClassSelect() {
    if (!this.classSelectEl) return;
    this.classSelectEl.innerHTML = '';
    storage.classes.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      if (c.id === storage.activeClassId) {
        opt.selected = true;
      }
      this.classSelectEl.appendChild(opt);
    });
  }

  loadActiveClassData() {
    const activeClass = storage.getActiveClass();
    if (activeClass) {
      this.namesTextarea.value = activeClass.names.join('\n');
      this.updateWheelFromTextarea();
    }
  }

  getNamesArray() {
    return this.namesTextarea.value
      .split('\n')
      .map(n => n.trim())
      .filter(n => n.length > 0);
  }

  updateWheelFromTextarea(save = false) {
    const names = this.getNamesArray();
    this.wheel.setNames(names);
    if (this.namesCountEl) {
      this.namesCountEl.textContent = `${names.length} คน`;
    }
    if (save) {
      storage.updateActiveNames(names);
    }
  }

  setupEventListeners() {
    // Textarea input sync
    this.namesTextarea.addEventListener('input', () => {
      this.updateWheelFromTextarea(true);
    });

    // Class selection change
    this.classSelectEl.addEventListener('change', (e) => {
      storage.setActiveClassId(e.target.value);
      this.loadActiveClassData();
      this.showToast(`เปลี่ยนเป็น ${storage.getActiveClass()?.name}`);
    });

    // New Class Button
    document.getElementById('new-class-btn')?.addEventListener('click', () => {
      this.newClassNameInput.value = '';
      this.openModal(this.newClassModal);
      this.newClassNameInput.focus();
    });

    this.saveNewClassBtn?.addEventListener('click', () => {
      const name = this.newClassNameInput.value.trim();
      if (!name) {
        alert('กรุณาระบุชื่อห้องเรียน');
        return;
      }
      const newCls = storage.addClass(name);
      this.populateClassSelect();
      this.loadActiveClassData();
      this.closeModal(this.newClassModal);
      this.showToast(`สร้างห้องเรียน "${name}" สำเร็จ`);
    });

    // Delete Class Button
    document.getElementById('delete-class-btn')?.addEventListener('click', () => {
      const current = storage.getActiveClass();
      if (!current) return;
      if (confirm(`คุณต้องการลบห้อง "${current.name}" ใช่หรือไม่?`)) {
        if (storage.deleteClass(current.id)) {
          this.populateClassSelect();
          this.loadActiveClassData();
          this.showToast(`ลบห้องเรียนแล้ว`);
        }
      }
    });

    // Spin Triggers
    const triggerSpin = () => {
      const names = this.getNamesArray();
      if (names.length === 0) {
        this.showToast('⚠️ กรุณาเพิ่มรายชื่อนักเรียนก่อนสุ่ม');
        return;
      }
      this.wheel.spin();
    };

    this.spinBtn?.addEventListener('click', triggerSpin);
    this.centerSpinBtn?.addEventListener('click', triggerSpin);
    document.getElementById('wheel-canvas')?.addEventListener('click', (e) => {
      // Don't trigger if clicked on center hub button directly
      if (!this.wheel.isSpinning) {
        triggerSpin();
      }
    });

    // Spacebar to Spin
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
        if (!isTyping) {
          e.preventDefault();
          triggerSpin();
        }
      }
      if (e.key === 'Escape') {
        this.closeAllModals();
        if (document.body.classList.contains('fullscreen-mode')) {
          this.toggleFullscreen(false);
        }
      }
    });

    // Quick Pick (Instant Random)
    this.quickPickBtn?.addEventListener('click', () => {
      const names = this.getNamesArray();
      if (names.length === 0) {
        this.showToast('⚠️ กรุณาเพิ่มรายชื่อนักเรียน');
        return;
      }
      const randomIndex = Math.floor(Math.random() * names.length);
      const winner = names[randomIndex];
      this.handleWinner(winner, randomIndex);
    });

    // Shuffle Names
    this.shuffleBtn?.addEventListener('click', () => {
      const names = this.getNamesArray();
      if (names.length <= 1) return;
      for (let i = names.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [names[i], names[j]] = [names[j], names[i]];
      }
      this.namesTextarea.value = names.join('\n');
      this.updateWheelFromTextarea(true);
      this.showToast('🔀 สลับตำแหน่งรายชื่อแล้ว');
    });

    // Sort Names
    this.sortBtn?.addEventListener('click', () => {
      const names = this.getNamesArray();
      if (names.length <= 1) return;
      names.sort((a, b) => a.localeCompare(b, 'th'));
      this.namesTextarea.value = names.join('\n');
      this.updateWheelFromTextarea(true);
      this.showToast('📶 เรียงลำดับชื่อแล้ว');
    });

    // Clear Names
    this.clearNamesBtn?.addEventListener('click', () => {
      if (confirm('คุณต้องการล้างรายชื่อทั้งหมดในห้องนี้หรือไม่?')) {
        this.namesTextarea.value = '';
        this.updateWheelFromTextarea(true);
        this.showToast('ล้างรายชื่อแล้ว');
      }
    });

    // Winner Modal Actions
    this.removeWinnerBtn?.addEventListener('click', () => {
      if (this.currentWinner) {
        this.removeNameFromList(this.currentWinner);
        this.closeModal(this.winnerModal);
        this.showToast(`นำ "${this.currentWinner}" ออกจากวงล้อแล้ว`);
      }
    });

    this.closeWinnerBtn?.addEventListener('click', () => {
      this.closeModal(this.winnerModal);
    });

    // Sidebar Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tabId = btn.getAttribute('data-tab');
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(`tab-${tabId}`)?.classList.add('active');
      });
    });

    // Groups Generator Dialog
    this.openGroupsBtn?.addEventListener('click', () => {
      this.openModal(this.groupsModal);
      this.runGroupGeneration();
    });

    this.generateGroupsBtn?.addEventListener('click', () => {
      this.runGroupGeneration();
    });

    // Settings Modal
    this.openSettingsBtn?.addEventListener('click', () => {
      this.openModal(this.settingsModal);
    });

    document.getElementById('save-settings-btn')?.addEventListener('click', () => {
      const updated = {
        spinDuration: parseInt(this.durationSelect.value, 10) || 6,
        soundEnabled: this.soundToggle.checked,
        confettiEnabled: this.confettiToggle.checked,
        highContrast: this.contrastToggle.checked
      };
      storage.saveSettings(updated);
      this.applySettings();
      this.closeModal(this.settingsModal);
      this.showToast('⚙️ บันทึกการตั้งค่าแล้ว');
    });

    // Fullscreen Controls
    this.fullscreenBtn?.addEventListener('click', () => this.toggleFullscreen(true));
    this.exitFullscreenBtn?.addEventListener('click', () => this.toggleFullscreen(false));

    // History Clear
    this.clearHistoryBtn?.addEventListener('click', () => {
      if (confirm('ต้องการล้างประวัติการสุ่มทั้งหมดหรือไม่?')) {
        history.clear();
        this.renderHistory();
        this.showToast('ล้างประวัติแล้ว');
      }
    });

    // Modal Close Buttons
    document.querySelectorAll('.modal-close-btn, .modal-cancel-btn').forEach(btn => {
      btn.addEventListener('click', () => this.closeAllModals());
    });

    // Close on overlay backdrop click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.closeAllModals();
        }
      });
    });
  }

  handleWinner(name, index) {
    this.currentWinner = name;
    this.currentWinnerIndex = index;

    // Play Victory Sound Fanfare
    sound.playVictoryFanfare();

    // Trigger Confetti Celebration
    if (storage.settings.confettiEnabled) {
      confetti.fire(4000);
    }

    // Save to History
    const activeClass = storage.getActiveClass();
    history.addWinner(name, activeClass ? activeClass.name : '');
    this.renderHistory();

    // Show Winner Modal
    this.winnerNameDisplay.textContent = name;
    this.openModal(this.winnerModal);
  }

  removeNameFromList(nameToRemove) {
    let names = this.getNamesArray();
    const index = names.indexOf(nameToRemove);
    if (index !== -1) {
      names.splice(index, 1);
      this.namesTextarea.value = names.join('\n');
      this.updateWheelFromTextarea(true);
    }
  }

  runGroupGeneration() {
    const names = this.getNamesArray();
    if (names.length === 0) {
      this.groupsResultGrid.innerHTML = '<p style="color: #64748b; text-align: center; grid-column: 1/-1;">ไม่มีรายชื่อนักเรียน</p>';
      return;
    }

    const count = parseInt(this.groupCountSelect.value, 10) || 2;
    const groups = generateGroups(names, count, true);

    this.groupsResultGrid.innerHTML = '';
    groups.forEach(g => {
      const card = document.createElement('div');
      card.className = 'group-card';
      card.innerHTML = `
        <div class="group-card-header">
          <span>${g.name}</span>
          <span style="font-size: 0.85rem; background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 99px;">${g.members.length} คน</span>
        </div>
        <ul class="group-members-list">
          ${g.members.map(m => `<li class="group-member-item">${m}</li>`).join('')}
        </ul>
      `;
      this.groupsResultGrid.appendChild(card);
    });
  }

  renderHistory() {
    if (!this.historyListEl) return;
    const records = history.getAll();
    if (records.length === 0) {
      this.historyListEl.innerHTML = '<div style="text-align: center; color: #64748b; padding: 20px;">ยังไม่มีประวัติการสุ่ม</div>';
      return;
    }

    this.historyListEl.innerHTML = records.map((r, i) => `
      <div class="history-item">
        <span class="history-index">${records.length - i}</span>
        <span class="history-name">${r.name}</span>
        <span class="history-time">${r.timestamp}</span>
      </div>
    `).join('');
  }

  openModal(modal) {
    if (modal) modal.classList.add('active');
  }

  closeModal(modal) {
    if (modal) modal.classList.remove('active');
  }

  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  }

  toggleFullscreen(enable) {
    if (enable) {
      document.body.classList.add('fullscreen-mode');
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      document.body.classList.remove('fullscreen-mode');
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
    setTimeout(() => {
      this.wheel.initCanvasSize();
      this.wheel.draw();
    }, 150);
  }

  showToast(msg) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
