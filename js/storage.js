/**
 * Local Storage Management for Classrooms, Name Lists and Settings
 */
const STORAGE_KEY_CLASSES = 'won_classroom_lists_v2';
const STORAGE_KEY_ACTIVE_CLASS = 'won_active_class_id_v2';
const STORAGE_KEY_SETTINGS = 'won_settings_v2';

const DEFAULT_NAMES = [
  'กิตติศักดิ์ สมบูรณ์',
  'จิราพร แสงจันทร์',
  'ณัฐวุฒิ สุขสวัสดิ์',
  'ธนภัทร วัฒนา',
  'ปิยดา วงศ์สุวรรณ',
  'พรสวรรค์ เจริญสุข',
  'มนตรี ฤทธิ์เดช',
  'วิภาดา เกียรติคุณ',
  'ศิรินภา ศรีสยาม',
  'อนุชา มีชัย',
  'อภิสิทธิ์ พัฒนพงศ์',
  'เกศรา ชัยชนะ'
];

const DEFAULT_CLASSES = [
  {
    id: 'class_1',
    name: 'มัธยมศึกษาปีที่ 1/1',
    names: [...DEFAULT_NAMES]
  },
  {
    id: 'class_2',
    name: 'มัธยมศึกษาปีที่ 1/2',
    names: [
      'กิตติพงษ์', 'จินตนา', 'ชานนท์', 'ทักษิณา',
      'บุษบา', 'ประวิทย์', 'พรรณวิภา', 'ยุทธนา',
      'ลลิตา', 'วัชระ', 'สิตานันท์', 'อธิป'
    ]
  },
  {
    id: 'class_3',
    name: 'กลุ่มกิจกรรมชุมนุม',
    names: [
      'ต้นกล้า', 'ข้าวหอม', 'ภูผา', 'ฟ้าใส',
      'สายธาร', 'ตะวัน', 'ไออุ่น', 'น้ำเพชร'
    ]
  }
];

const DEFAULT_SETTINGS = {
  spinDuration: 6, // seconds
  soundEnabled: true,
  confettiEnabled: true,
  autoRemoveWinner: false,
  highContrast: false
};

class StorageManager {
  constructor() {
    this.classes = this.loadClasses();
    this.activeClassId = this.loadActiveClassId();
    this.settings = this.loadSettings();
  }

  loadClasses() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_CLASSES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load classes from storage:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_CLASSES));
  }

  saveClasses() {
    try {
      localStorage.setItem(STORAGE_KEY_CLASSES, JSON.stringify(this.classes));
    } catch (e) {
      console.error('Failed to save classes:', e);
    }
  }

  loadActiveClassId() {
    try {
      const id = localStorage.getItem(STORAGE_KEY_ACTIVE_CLASS);
      if (id && this.classes.some(c => c.id === id)) return id;
    } catch (e) {
      console.warn('Failed to load active class ID:', e);
    }
    return this.classes[0]?.id || 'class_1';
  }

  setActiveClassId(id) {
    this.activeClassId = id;
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_CLASS, id);
    } catch (e) {
      console.error('Failed to save active class ID:', e);
    }
  }

  getActiveClass() {
    let cls = this.classes.find(c => c.id === this.activeClassId);
    if (!cls) {
      cls = this.classes[0];
      this.activeClassId = cls ? cls.id : null;
    }
    return cls;
  }

  updateActiveNames(namesArray) {
    const cls = this.getActiveClass();
    if (cls) {
      cls.names = namesArray;
      this.saveClasses();
    }
  }

  addClass(name, namesArray = []) {
    const newClass = {
      id: 'class_' + Date.now(),
      name: name.trim() || `ห้องเรียน ${this.classes.length + 1}`,
      names: namesArray.length > 0 ? namesArray : ['นักเรียน 1', 'นักเรียน 2', 'นักเรียน 3', 'นักเรียน 4']
    };
    this.classes.push(newClass);
    this.setActiveClassId(newClass.id);
    this.saveClasses();
    return newClass;
  }

  renameClass(id, newName) {
    const cls = this.classes.find(c => c.id === id);
    if (cls && newName.trim()) {
      cls.name = newName.trim();
      this.saveClasses();
    }
  }

  deleteClass(id) {
    if (this.classes.length <= 1) {
      alert('ต้องมีห้องเรียนอย่างน้อย 1 ห้อง');
      return false;
    }
    this.classes = this.classes.filter(c => c.id !== id);
    if (this.activeClassId === id) {
      this.activeClassId = this.classes[0].id;
      this.setActiveClassId(this.activeClassId);
    }
    this.saveClasses();
    return true;
  }

  loadSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
    return { ...DEFAULT_SETTINGS };
  }

  saveSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(this.settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }
}

export const storage = new StorageManager();
