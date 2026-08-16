/**
 * History Manager for Tracked Winners
 */
const STORAGE_KEY_HISTORY = 'won_winner_history_v2';

class HistoryManager {
  constructor() {
    this.history = this.loadHistory();
    this.onUpdateCallback = null;
  }

  loadHistory() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to load history:', e);
    }
    return [];
  }

  saveHistory() {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(this.history));
    } catch (e) {
      console.error('Failed to save history:', e);
    }
    if (this.onUpdateCallback) {
      this.onUpdateCallback(this.history);
    }
  }

  addWinner(name, className = '') {
    const record = {
      id: Date.now(),
      name,
      className,
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      date: new Date().toLocaleDateString('th-TH')
    };
    this.history.unshift(record);
    this.saveHistory();
    return record;
  }

  clear() {
    this.history = [];
    this.saveHistory();
  }

  getAll() {
    return this.history;
  }

  onUpdate(cb) {
    this.onUpdateCallback = cb;
  }
}

export const history = new HistoryManager();
