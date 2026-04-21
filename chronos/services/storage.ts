/**
 * Chronos Field Timekeeper - Storage Service
 * Handles all localStorage operations with type safety and error handling
 */

import { Customer, TimeEntry, Project, Task, ActivityType, ThemeMode, Technician } from '../types';

/**
 * Storage key constants for consistent localStorage access
 */
const STORAGE_KEYS = {
  CUSTOMERS: 'chronos_customers',
  PROJECTS: 'chronos_projects',
  TASKS: 'chronos_tasks',
  ENTRIES: 'chronos_entries',
  ACTIVE_SESSION: 'chronos_active_session',
  ACTIVITY_TYPES: 'chronos_activity_types',
  REQUEST_TYPES: 'chronos_request_types',
  THEME_COLOR: 'chronos_theme_color',
  THEME_TEXT_COLOR: 'chronos_theme_text_color',
  THEME_BG_COLOR: 'chronos_theme_bg_color',
  THEME_CARD_COLOR: 'chronos_theme_card_color',
  THEME_NAV_COLOR: 'chronos_theme_nav_color',
  THEME_MODE: 'chronos_theme_mode',
  TECH_NAME: 'chronos_tech_name',
  TECH_EMAIL: 'chronos_tech_email',
  LOGGED_IN_TECH: 'chronos_logged_in_tech',
  REMEMBER_ME: 'chronos_remember_me',
  TECHNICIANS: 'chronos_local_technicians',
  PHASE_LABELS: 'chronos_phase_labels',
  LAST_BACKUP: 'chronos_last_backup'
} as const;

/**
 * Safely parse JSON from storage with error handling
 * @param key - The storage key to retrieve
 * @param defaultValue - Default value if parsing fails or key doesn't exist
 * @returns Parsed value or default
 */
const safeParse = <T>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(key) || sessionStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    console.error(`Error parsing storage key: ${key}`, e);
    return defaultValue;
  }
};

/**
 * Storage service for managing application state persistence
 */
export const StorageService = {
  /**
   * Save customers to localStorage
   */
  saveCustomers: (customers: Customer[]) => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  },
  
  /**
   * Retrieve customers from localStorage
   */
  getCustomers: (): Customer[] => {
    return safeParse(STORAGE_KEYS.CUSTOMERS, []);
  },
  
  /**
   * Save projects to localStorage
   */
  saveProjects: (projects: Project[]) => {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  },
  
  /**
   * Retrieve projects from localStorage
   */
  getProjects: (): Project[] => {
    return safeParse(STORAGE_KEYS.PROJECTS, []);
  },
  
  /**
   * Save time entries to localStorage
   */
  saveEntries: (entries: TimeEntry[]) => {
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
  },
  
  /**
   * Retrieve time entries from localStorage
   */
  getEntries: (): TimeEntry[] => {
    return safeParse(STORAGE_KEYS.ENTRIES, []);
  },
  
  /**
   * Save active session to localStorage
   */
  saveActiveSession: (entry: TimeEntry | null) => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(entry));
  },
  
  /**
   * Retrieve active session from localStorage
   */
  getActiveSession: (): TimeEntry | null => {
    return safeParse(STORAGE_KEYS.ACTIVE_SESSION, null);
  },
  
  /**
   * Save theme color preference
   */
  saveThemeColor: (color: string) => {
    localStorage.setItem(STORAGE_KEYS.THEME_COLOR, color);
  },
  
  /**
   * Retrieve theme color preference
   */
  getThemeColor: (): string => {
    return localStorage.getItem(STORAGE_KEYS.THEME_COLOR) || '#6366f1';
  },
  
  /**
   * Save text color preference
   */
  saveTextColor: (color: string) => {
    localStorage.setItem(STORAGE_KEYS.THEME_TEXT_COLOR, color);
  },
  
  /**
   * Retrieve text color preference
   */
  getTextColor: (): string => {
    return localStorage.getItem(STORAGE_KEYS.THEME_TEXT_COLOR) || ''; 
  },
  
  /**
   * Save background color preference
   */
  saveBgColor: (color: string) => {
    localStorage.setItem(STORAGE_KEYS.THEME_BG_COLOR, color);
  },
  
  /**
   * Retrieve background color preference
   */
  getBgColor: (): string => {
    return localStorage.getItem(STORAGE_KEYS.THEME_BG_COLOR) || ''; 
  },
  
  /**
   * Save card color preference
   */
  saveCardColor: (color: string) => {
    localStorage.setItem(STORAGE_KEYS.THEME_CARD_COLOR, color);
  },
  
  /**
   * Retrieve card color preference
   */
  getCardColor: (): string => {
    return localStorage.getItem(STORAGE_KEYS.THEME_CARD_COLOR) || '';
  },
  
  /**
   * Save theme mode (light/dark)
   */
  saveThemeMode: (mode: ThemeMode) => {
    localStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
  },
  
  /**
   * Retrieve theme mode
   */
  getThemeMode: (): ThemeMode => {
    return (localStorage.getItem(STORAGE_KEYS.THEME_MODE) as ThemeMode) || 'dark';
  },
  
  /**
   * Save technician session with remember me option
   */
  saveTechSession: (tech: Technician | null, remember: boolean) => {
    const storage = remember ? localStorage : sessionStorage;
    if (tech) {
      storage.setItem(STORAGE_KEYS.LOGGED_IN_TECH, JSON.stringify(tech));
      localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, JSON.stringify(remember));
    } else {
      localStorage.removeItem(STORAGE_KEYS.LOGGED_IN_TECH);
      sessionStorage.removeItem(STORAGE_KEYS.LOGGED_IN_TECH);
      localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
    }
  },
  
  /**
   * Retrieve technician session
   */
  getTechSession: (): Technician | null => {
    return safeParse(STORAGE_KEYS.LOGGED_IN_TECH, null);
  },
  
  /**
   * Retrieve remember me preference
   */
  getRememberMe: (): boolean => {
    return safeParse(STORAGE_KEYS.REMEMBER_ME, false);
  },
  
  /**
   * Save local technician registry
   */
  saveLocalTechnicians: (techs: Technician[]) => {
    localStorage.setItem(STORAGE_KEYS.TECHNICIANS, JSON.stringify(techs));
  },
  
  /**
   * Retrieve local technician registry
   */
  getLocalTechnicians: (): Technician[] => {
    return safeParse(STORAGE_KEYS.TECHNICIANS, []);
  },
  
  /**
   * Save custom phase labels
   */
  savePhaseLabels: (labels: string[]) => {
    localStorage.setItem(STORAGE_KEYS.PHASE_LABELS, JSON.stringify(labels));
  },
  
  /**
   * Retrieve custom phase labels
   */
  getPhaseLabels: (): string[] => {
    return safeParse(STORAGE_KEYS.PHASE_LABELS, ["Transit In", "Field Operations", "Transit Return"]);
  },
  
  /**
   * Save last backup timestamp
   */
  saveLastBackup: (timestamp: number) => {
    localStorage.setItem(STORAGE_KEYS.LAST_BACKUP, timestamp.toString());
  },
  
  /**
   * Retrieve last backup timestamp
   */
  getLastBackup: (): number => {
    return parseInt(localStorage.getItem(STORAGE_KEYS.LAST_BACKUP) || '0');
  }
};
