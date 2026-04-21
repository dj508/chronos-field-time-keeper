
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Customer, Project, TimeEntry, AppView, EntryStep, ThemeMode, Technician } from './types';
import { StorageService } from './services/storage';
import { IconHome, IconPlus, IconHistory, IconUser, IconSettings, IconEdit, IconCloud, IconClock, IconChevronDown, IconSparkles, IconTrash, IconLogout } from './components/Icons';

declare var XLSX: any;

const WORKDAY_TARGET_MS = 8.5 * 60 * 60 * 1000; // 8:00 - 16:30 is 8.5h
const OT_ROUNDING_MS = 15 * 60 * 1000; // 15 Minutes

// Utility for safe UUID generation with fallback
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const BRAND_PALETTE = [
  { name: 'Indigo', color: '#6366f1' },
  { name: 'Sky', color: '#0ea5e9' },
  { name: 'Emerald', color: '#10b981' },
  { name: 'Amber', color: '#f59e0b' },
  { name: 'Rose', color: '#f43f5e' },
  { name: 'Violet', color: '#8b5cf6' },
  { name: 'Orange', color: '#f97316' },
  { name: 'Cyan', color: '#06b6d4' },
  { name: 'Crimson', color: '#991b1b' },
  { name: 'Lime', color: '#84cc16' }
];

const BG_PALETTE = [
  { name: 'Midnight', color: '#020617' },
  { name: 'OLED', color: '#000000' },
  { name: 'Slate', color: '#0f172a' },
  { name: 'Charcoal', color: '#121212' },
  { name: 'Deep Sea', color: '#04162e' },
  { name: 'Forest', color: '#021a02' }
];

const SURFACE_PALETTE = [
  { name: 'Glass', color: 'rgba(30, 41, 59, 0.5)' },
  { name: 'Solid', color: '#1e293b' },
  { name: 'Obsidian', color: '#0f172a' },
  { name: 'Steel', color: '#334155' },
  { name: 'Soft', color: 'rgba(255, 255, 255, 0.03)' }
];

const TEXT_PALETTE = [
  { name: 'Cloud', color: '#f8fafc' },
  { name: 'Silver', color: '#e2e8f0' },
  { name: 'Ghost', color: '#94a3b8' },
  { name: 'Amber Glow', color: '#fde68a' },
  { name: 'Mint', color: '#d1fae5' },
  { name: 'Rose Petal', color: '#ffe4e6' },
  { name: 'Lavender', color: '#f5f3ff' },
  { name: 'Arctic Blue', color: '#e0f2fe' },
  { name: 'Cyber Yellow', color: '#fef9c3' },
  { name: 'Peach Fuzz', color: '#ffedd5' },
  { name: 'Golden Hour', color: '#fbbf24' },
  { name: 'High-Viz Cyan', color: '#22d3ee' },
  { name: 'Neon Pink', color: '#fbcfe8' },
  { name: 'Electric Lime', color: '#d9f99d' },
  { name: 'Deep Steel', color: '#64748b' }
];

const THEME_PRESETS = [
  {
    name: 'Cyberpunk',
    accent: '#f43f5e',
    bg: '#000000',
    surface: 'rgba(244, 63, 94, 0.05)',
    text: '#f8fafc'
  },
  {
    name: 'Emerald City',
    accent: '#10b981',
    bg: '#021a02',
    surface: 'rgba(16, 185, 129, 0.05)',
    text: '#ecfdf5'
  },
  {
    name: 'Oceanside',
    accent: '#0ea5e9',
    bg: '#04162e',
    surface: 'rgba(14, 165, 233, 0.05)',
    text: '#f0f9ff'
  },
  {
    name: 'Stealth',
    accent: '#6366f1',
    bg: '#020617',
    surface: '#0f172a',
    text: '#f8fafc'
  }
];

const calculateTimeSplit = (start: number, end: number) => {
  const date = new Date(start);
  const normalStart = new Date(date).setHours(8, 0, 0, 0);
  const normalEnd = new Date(date).setHours(16, 30, 0, 0);

  const normalMs = Math.max(0, Math.min(end, normalEnd) - Math.max(start, normalStart));
  const otBeforeRaw = Math.max(0, Math.min(end, normalStart) - start);
  const roundedOtBefore = Math.floor(otBeforeRaw / OT_ROUNDING_MS) * OT_ROUNDING_MS;
  const otAfterRaw = Math.max(0, end - Math.max(start, normalEnd));
  const roundedOtAfter = Math.ceil(otAfterRaw / OT_ROUNDING_MS) * OT_ROUNDING_MS;

  return { normalMs, overtimeMs: roundedOtBefore + roundedOtAfter };
};

const formatTime = (ms?: number) => {
  if (!ms) return '--:--';
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDuration = (ms: number) => {
  if (ms < 0) return '0h 0m 0s';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}h ${m}m ${sec}s`;
};

const toDateTimeLocal = (ms: number) => {
  const date = new Date(ms);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(ms - offset).toISOString().slice(0, 16);
};

const fromDateTimeLocal = (val: string) => {
  return new Date(val).getTime();
};

const GlassCard = ({ children, className = "", style = {}, onClick, customBg, customBorderColor }: any) => {
  const borderStyle = customBorderColor ? { borderLeft: `6px solid ${customBorderColor}` } : {};
  return (
    <div 
      onClick={onClick}
      className={`backdrop-blur-2xl rounded-[2rem] p-5 border border-white/5 shadow-2xl transition-all ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''} ${className}`}
      style={{ backgroundColor: customBg || 'rgba(15, 23, 42, 0.6)', ...style, ...borderStyle }}
    >
      {children}
    </div>
  );
};

const IconButton = ({ icon: Icon, onClick, active, color }: any) => (
  <button 
    type="button"
    onClick={onClick}
    className={`p-4 rounded-[1.2rem] transition-all active:scale-90 ${active ? 'text-white shadow-xl' : 'text-slate-400 dark:text-slate-600'}`}
    style={active ? { backgroundColor: color, boxShadow: `0 10px 25px -5px ${color}66` } : {}}
  >
    <Icon className="w-6 h-6" />
  </button>
);

const InputField = ({ label, id, placeholder, defaultValue, type = "text", className = "", onChange, value, textColor }: any) => (
  <div className={`space-y-1.5 ${className}`}>
    <label htmlFor={id} className="text-[10px] font-black uppercase opacity-40 ml-1 tracking-wider">{label}</label>
    <input 
      id={id} 
      type={type}
      defaultValue={defaultValue} 
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-black/20 border-2 border-transparent focus:border-indigo-500 rounded-2xl p-4 text-sm font-black outline-none transition-all placeholder:opacity-20"
      style={{ color: textColor }}
    />
  </div>
);

export default function App() {
  const [isAppLoaded, setIsAppLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState<Technician | null>(() => StorageService.getTechSession());
  const [rememberMe, setRememberMe] = useState(() => StorageService.getRememberMe());
  
  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [settingsTab, setSettingsTab] = useState<'appearance' | 'data'>('appearance');
  const [isEnrollmentMode, setIsEnrollmentMode] = useState(false);

  // Core Data State
  const [customers, setCustomers] = useState<Customer[]>(() => StorageService.getCustomers());
  const [projects, setProjects] = useState<Project[]>(() => StorageService.getProjects());
  const [entries, setEntries] = useState<TimeEntry[]>(() => StorageService.getEntries());
  const [activeSession, setActiveSession] = useState<TimeEntry | null>(() => StorageService.getActiveSession());
  const [lastBackup, setLastBackup] = useState<number>(() => StorageService.getLastBackup());
  
  // Enhanced Color State
  const [themeColor, setThemeColor] = useState(() => StorageService.getThemeColor());
  const [textColor, setTextColor] = useState(() => StorageService.getTextColor() || '#f8fafc');
  const [bgColor, setBgColor] = useState(() => StorageService.getBgColor() || '#020617');
  const [cardColor, setCardColor] = useState(() => StorageService.getCardColor() || 'rgba(30, 41, 59, 0.5)');
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => StorageService.getThemeMode());
  const [phaseLabels, setPhaseLabels] = useState<string[]>(() => StorageService.getPhaseLabels());

  // UI State
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  const [expandedAssetIds, setExpandedAssetIds] = useState<Set<string>>(new Set());
  const [registrySearch, setRegistrySearch] = useState('');
  const [selectedFilterCustomerId, setSelectedFilterCustomerId] = useState<string>('');
  const importInputRef = useRef<HTMLInputElement>(null);

  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<{type: 'client' | 'asset', data?: any, isEdit?: boolean} | null>(null);
  const [isEditLogOpen, setIsEditLogOpen] = useState<TimeEntry | null>(null);
  const [, setTick] = useState(0);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [selectedClient, setSelectedClient] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('');

  const [loginId, setLoginId] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [enrollName, setEnrollName] = useState('');
  const [enrollEmail, setEnrollEmail] = useState('');
  const [loginError, setLoginError] = useState('');

  const [technicianRegistry, setTechnicianRegistry] = useState<Technician[]>(() => StorageService.getLocalTechnicians());

  useEffect(() => {
    if (technicianRegistry.length === 0) {
      fetch('./technicians.json').then(res => res.json()).then(data => {
        setTechnicianRegistry(data);
        StorageService.saveLocalTechnicians(data);
      }).catch(err => console.error("Initial tech registry load failed", err));
    }
    const timer = setTimeout(() => setIsAppLoaded(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    StorageService.saveCustomers(customers);
    StorageService.saveProjects(projects);
    StorageService.saveEntries(entries);
    StorageService.saveActiveSession(activeSession);
    StorageService.saveThemeColor(themeColor);
    StorageService.saveTextColor(textColor);
    StorageService.saveBgColor(bgColor);
    StorageService.saveCardColor(cardColor);
    StorageService.saveThemeMode(themeMode);
    StorageService.savePhaseLabels(phaseLabels);
    StorageService.saveLastBackup(lastBackup);
    document.documentElement.classList.toggle('dark', themeMode === 'dark');
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, [customers, projects, entries, activeSession, themeColor, textColor, bgColor, cardColor, themeMode, currentUser, phaseLabels, lastBackup]);

  const applyPreset = (preset: typeof THEME_PRESETS[0]) => {
    setThemeColor(preset.accent);
    setBgColor(preset.bg);
    setCardColor(preset.surface);
    setTextColor(preset.text);
  };

  const resetAppearance = () => {
    setThemeColor('#6366f1');
    setBgColor('#020617');
    setCardColor('rgba(30, 41, 59, 0.5)');
    setTextColor('#f8fafc');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const tech = technicianRegistry.find(t => t.id === loginId && t.pin === loginPin);
    if (tech) {
      setCurrentUser(tech);
      StorageService.saveTechSession(tech, rememberMe);
    } else { 
      setLoginError('Invalid Technician ID or Security PIN.'); 
    }
  };

  const handleEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginId || !loginPin || !enrollName || !enrollEmail) { 
      setLoginError('All fields (ID, PIN, Name, Email) are mandatory.'); 
      return; 
    }
    if (technicianRegistry.some(t => t.id === loginId)) {
      setLoginError('Technician ID already exists.');
      return;
    }
    const newTech: Technician = { id: loginId, name: enrollName, email: enrollEmail, pin: loginPin };
    const updated = [...technicianRegistry, newTech];
    setTechnicianRegistry(updated);
    StorageService.saveLocalTechnicians(updated);
    setCurrentUser(newTech);
    StorageService.saveTechSession(newTech, rememberMe);
    setIsEnrollmentMode(false);
  };

  const handleLogout = () => { 
    if (window.confirm("Confirm termination of session?")) { 
      setCurrentUser(null); 
      StorageService.saveTechSession(null, false); 
      setLoginId(''); setLoginPin(''); setLoginError(''); 
    } 
  };

  const toggleAssetExpansion = (assetId: string) => {
    const next = new Set(expandedAssetIds);
    if (next.has(assetId)) next.delete(assetId);
    else next.add(assetId);
    setExpandedAssetIds(next);
  };

  const exportData = (format: 'json' | 'xlsx' | 'html', type: 'clients' | 'jobs') => {
    const dateStr = new Date().toISOString().split('T')[0];
    const timestamp = Date.now();
    const fileName = `Chronos_${type}_${dateStr}_${timestamp}`;
    
    if (type === 'clients') {
      const data = customers.map(c => {
        const clientAssets = projects.filter(p => p.customerId === c.id);
        return {
          'id': c.id,
          'Company Name': c.name,
          'Representative': c.representative || '',
          'Address': c.address || '',
          'Contact': c.contact || '',
          'Registry Color': c.color,
          'Asset Count': clientAssets.length,
          'Asset List': clientAssets.map(a => `${a.name} (${a.mcMake})`).join('; ')
        };
      });
      
      if (format === 'json') {
        triggerDownload(new Blob([JSON.stringify({ customers, assets: projects }, null, 2)], { type: 'application/json' }), `${fileName}.json`);
      } else if (format === 'xlsx') {
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Customers");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(projects), "RawAssets");
        XLSX.writeFile(wb, `${fileName}.xlsx`);
      } else if (format === 'html') {
        triggerDownload(new Blob([generateProfessionalHtml(data, "CUSTOMER REGISTRY", dateStr)], { type: 'text/html' }), `${fileName}.html`);
      }
    } else {
      const data = entries.map(e => {
        const customer = customers.find(c => c.id === e.customerId);
        const project = projects.find(p => p.id === e.projectId);
        return {
          'Internal ID': e.id,
          'Job ID': e.jobId,
          'Technician': e.technicianName || 'N/A',
          'Tech Email': e.technicianEmail || 'N/A',
          'Customer': customer?.name || 'Unknown',
          'Asset Serial': project?.name || 'N/A',
          'Machine Make': project?.mcMake || 'N/A',
          'Check In': new Date(e.checkIn).toLocaleString(),
          'Check Out': e.checkOut ? new Date(e.checkOut).toLocaleString() : 'Ongoing',
          'Duration MS': e.checkOut ? e.checkOut - e.checkIn : 0,
          'Duration Readable': e.checkOut ? formatDuration(e.checkOut - e.checkIn) : 'Ongoing',
          [`Phase 1 (${phaseLabels[0]}) Notes`]: e.steps[0].description,
          [`Phase 1 Start`]: e.steps[0].startTime ? new Date(e.steps[0].startTime).toLocaleTimeString() : '',
          [`Phase 1 End`]: e.steps[0].endTime ? new Date(e.steps[0].endTime).toLocaleTimeString() : '',
          [`Phase 2 (${phaseLabels[1]}) Notes`]: e.steps[1].description,
          [`Phase 2 Start`]: e.steps[1].startTime ? new Date(e.steps[1].startTime).toLocaleTimeString() : '',
          [`Phase 2 End`]: e.steps[1].endTime ? new Date(e.steps[1].endTime).toLocaleTimeString() : '',
          [`Phase 3 (${phaseLabels[2]}) Notes`]: e.steps[2].description,
          [`Phase 3 Start`]: e.steps[2].startTime ? new Date(e.steps[2].startTime).toLocaleTimeString() : '',
          [`Phase 3 End`]: e.steps[2].endTime ? new Date(e.steps[2].endTime).toLocaleTimeString() : '',
        };
      });

      if (format === 'json') {
        triggerDownload(new Blob([JSON.stringify({ entries, technician: currentUser?.name }, null, 2)], { type: 'application/json' }), `${fileName}.json`);
      } else if (format === 'xlsx') {
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Workbooks");
        XLSX.writeFile(wb, `${fileName}.xlsx`);
      } else if (format === 'html') {
        triggerDownload(new Blob([generateProfessionalHtml(data, "WORKBOOK BACKUP", dateStr)], { type: 'text/html' }), `${fileName}.html`);
      }
    }
    setLastBackup(Date.now());
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    const isXlsx = file.name.endsWith('.xlsx');
    reader.onload = (event) => {
      try {
        let imported: any = {};
        if (isXlsx) {
          const wb = XLSX.read(event.target?.result, { type: 'binary' });
          const firstSheet = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(firstSheet);
          if (rows.length > 0) {
            const keys = Object.keys(rows[0] as object);
            if (keys.some(k => k.toLowerCase().includes('job'))) {
              imported.entries = rows.map((r: any) => ({
                id: r.id || r['Internal ID'] || generateUUID(),
                jobId: r['Job ID'] || r.jobId || `JC-${Math.random().toString(36).substring(7).toUpperCase()}`,
                customerId: r.customerId || customers.find(c => c.name === r.Customer)?.id || '',
                checkIn: r['Check In'] ? new Date(r['Check In']).getTime() : Date.now(),
                steps: [
                  { activityId: 'act-1', description: r[`Phase 1 (${phaseLabels[0]}) Notes`] || '' },
                  { activityId: 'act-2', description: r[`Phase 2 (${phaseLabels[1]}) Notes`] || '' },
                  { activityId: 'act-3', description: r[`Phase 3 (${phaseLabels[2]}) Notes`] || '' }
                ]
              }));
            } else if (keys.some(k => k.toLowerCase().includes('company'))) {
              imported.customers = rows.map((r: any) => ({
                id: r.id || generateUUID(),
                name: r['Company Name'] || r.name,
                representative: r.Representative || '',
                address: r.Address || '',
                contact: r.Contact || '',
                color: themeColor
              }));
            }
          }
        } else { imported = JSON.parse(event.target?.result as string); }
        let stats = { c: 0, a: 0, e: 0 };
        if (imported.customers) {
          setCustomers(prev => {
            const next = [...prev];
            imported.customers.forEach((c: any) => {
              const i = next.findIndex(x => x.id === c.id);
              if (i > -1) next[i] = { ...next[i], ...c }; else next.push(c);
              stats.c++;
            });
            return next;
          });
        }
        if (imported.assets || imported.projects) {
          setProjects(prev => {
            const next = [...prev];
            (imported.assets || imported.projects).forEach((a: any) => {
              const i = next.findIndex(x => x.id === a.id);
              if (i > -1) next[i] = { ...next[i], ...a }; else next.push(a);
              stats.a++;
            });
            return next;
          });
        }
        if (imported.entries) {
          setEntries(prev => {
            const next = [...prev];
            imported.entries.forEach((en: any) => {
              const validSteps: [EntryStep, EntryStep, EntryStep] = [
                en.steps?.[0] || { activityId: 'act-1', description: '' },
                en.steps?.[1] || { activityId: 'act-2', description: '' },
                en.steps?.[2] || { activityId: 'act-3', description: '' }
              ];
              const entry = { ...en, id: en.id || generateUUID(), steps: validSteps };
              const i = next.findIndex(x => x.id === entry.id);
              if (i > -1) next[i] = { ...next[i], ...entry }; else next.push(entry);
              stats.e++;
            });
            return next;
          });
        }
        alert(`Synchronized:\n- ${stats.c} Customers\n- ${stats.a} Assets\n- ${stats.e} Logs.`);
      } catch (err) { alert("Sync failed: Check file structure."); console.error(err); }
      e.target.value = '';
    };
    if (isXlsx) reader.readAsBinaryString(file); else reader.readAsText(file);
  };

  const generateProfessionalHtml = (data: any[], title: string, date: string) => {
    if (data.length === 0) return `<html><body><h1>No data</h1></body></html>`;
    const headers = Object.keys(data[0]);
    return `<!DOCTYPE html><html><head><style>body{font-family:'Segoe UI',sans-serif;padding:40px;background:${bgColor};color:${textColor}}header{border-bottom:3px solid ${themeColor};padding-bottom:15px;margin-bottom:30px}table{width:100%;border-collapse:collapse;background:${cardColor};border-radius:12px;overflow:hidden}th{background:${themeColor};color:white;text-align:left;padding:14px;font-size:11px;text-transform:uppercase}td{padding:14px;border-bottom:1px solid rgba(255,255,255,0.05);font-size:12px;color:${textColor}cc}</style></head><body><header><h1>${title}</h1><p>EXTRACT DATE: ${date}</p></header><table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${data.map(r => `<tr>${headers.map(h => `<td>${r[h] || ''}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`;
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const dailyStats = useMemo(() => {
    const today = new Date().toDateString();
    let n = 0, o = 0;
    const proc = (e: TimeEntry) => {
      if (e.steps[1].startTime) {
        const split = calculateTimeSplit(e.steps[1].startTime, e.steps[1].endTime || Date.now());
        n += split.normalMs; o += split.overtimeMs;
      }
    };
    entries.filter(e => new Date(e.checkIn).toDateString() === today).forEach(proc);
    if (activeSession && new Date(activeSession.checkIn).toDateString() === today) proc(activeSession);
    return { n, o };
  }, [entries, activeSession, setTick]);

  const weeklyGraphData = useMemo(() => {
    const data = [];
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
    monday.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday); d.setDate(monday.getDate() + i);
      let ms = 0;
      const proc = (e: TimeEntry) => { if (e.steps[1].startTime) ms += ((e.steps[1].endTime || Date.now()) - e.steps[1].startTime); };
      entries.filter(e => new Date(e.checkIn).toDateString() === d.toDateString()).forEach(proc);
      if (d.toDateString() === now.toDateString() && activeSession) proc(activeSession);
      data.push({ label: d.toLocaleDateString([], { weekday: 'narrow' }), ms, isToday: d.toDateString() === now.toDateString() });
    }
    return data;
  }, [entries, activeSession, setTick]);

  const shiftStatus = useMemo(() => {
    const now = new Date();
    const t = now.getHours() * 60 + now.getMinutes();
    return (t < 480 || t >= 990) ? 'OVERTIME' : 'NORMAL';
  }, [setTick]);

  const isBackupNeeded = useMemo(() => {
    if (!lastBackup) return true;
    const lastDate = new Date(lastBackup).toDateString();
    const today = new Date().toDateString();
    return lastDate !== today;
  }, [lastBackup]);

  const beginShift = () => {
    if (!selectedClient || !currentUser) return;
    const session: TimeEntry = {
      id: generateUUID(),
      jobId: `JC-${Math.random().toString(36).substring(7).toUpperCase()}`,
      customerId: selectedClient,
      projectId: selectedAsset || undefined,
      checkIn: Date.now(),
      technicianName: currentUser.name,
      technicianEmail: currentUser.email,
      steps: [
        { activityId: 'act-1', description: '', startTime: Date.now() },
        { activityId: 'act-2', description: '' },
        { activityId: 'act-3', description: '' }
      ]
    };
    setActiveSession(session);
    setIsCheckInOpen(false);
    setSelectedClient(''); setSelectedAsset('');
  };

  const updateStepDescription = (i: number, d: string) => {
    if (!activeSession) return;
    const steps = [...activeSession.steps] as [EntryStep, EntryStep, EntryStep];
    steps[i].description = d;
    setActiveSession({ ...activeSession, steps });
  };

  const nextPhase = (i: number) => {
    if (!activeSession) return;
    const steps = [...activeSession.steps] as [EntryStep, EntryStep, EntryStep];
    steps[i].endTime = Date.now();
    if (i < 2) steps[i + 1].startTime = Date.now();
    setActiveSession({ ...activeSession, steps });
  };

  const finishShift = () => {
    if (!activeSession) return;
    const now = Date.now();
    const finalSteps = [...activeSession.steps] as [EntryStep, EntryStep, EntryStep];
    if (finalSteps[2].startTime && !finalSteps[2].endTime) finalSteps[2].endTime = now;
    else if (finalSteps[1].startTime && !finalSteps[1].endTime) finalSteps[1].endTime = now;
    setEntries(prev => [{ ...activeSession, checkOut: now, steps: finalSteps }, ...prev]);
    setActiveSession(null);
  };

  const enhanceWithAi = async () => {
    if (!activeSession || !activeSession.steps[1].description) return;
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Formalize these technical maintenance notes: "${activeSession.steps[1].description}"`,
      });
      if (res.text) updateStepDescription(1, res.text.trim());
    } finally { setIsAiLoading(false); }
  };

  const saveLogAdjustments = () => {
    if (!isEditLogOpen) return;
    setEntries(prev => prev.map(e => e.id === isEditLogOpen.id ? isEditLogOpen : e));
    setIsEditLogOpen(null);
  };

  const updateEntryStepDirectly = (entryId: string, stepIdx: number, newDesc: string) => {
    setEntries(prev => prev.map(e => {
      if (e.id === entryId) {
        const steps = [...e.steps] as [EntryStep, EntryStep, EntryStep];
        steps[stepIdx].description = newDesc;
        return { ...e, steps };
      }
      return e;
    }));
  };

  const deleteCustomer = (id: string) => {
    if (window.confirm("Permanently remove this Entity and ALL its associated Assets?")) {
      setCustomers(prev => prev.filter(c => c.id !== id));
      setProjects(prev => prev.filter(p => p.customerId !== id));
      if (expandedCustomerId === id) setExpandedCustomerId(null);
      if (selectedFilterCustomerId === id) setSelectedFilterCustomerId('');
    }
  };

  const deleteAsset = (id: string) => {
    if (window.confirm("Permanently remove this Machine Asset?")) {
      setProjects(prev => prev.filter(p => p.id !== id));
      setExpandedAssetIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const deleteHistoryEntry = (id: string) => {
    if (window.confirm("Archive log permanently?")) {
      setEntries(prev => prev.filter(x => x.id !== id));
      if (expandedLogId === id) setExpandedLogId(null);
    }
  };

  const renderDashboard = () => {
    const progressPercent = Math.min(Math.round((dailyStats.n / WORKDAY_TARGET_MS) * 100), 100);
    
    return (
      <div className="space-y-4 animate-in fade-in duration-700">
        <div className="flex justify-between items-end">
          <div><h1 className="text-4xl font-black uppercase tracking-tighter" style={{ color: textColor }}>Ops.</h1><p className="text-[10px] font-black uppercase opacity-30" style={{ color: textColor }}>Shift Intelligence System</p></div>
          <div className="text-right">
            <p className="text-[8px] font-black uppercase opacity-40" style={{ color: textColor }}>Field Hours</p>
            <div className="flex items-baseline justify-end gap-2">
              <p className="text-xl font-black tabular-nums" style={{ color: textColor }}>
                {formatDuration(dailyStats.n).split(' ')[0]} {formatDuration(dailyStats.n).split(' ')[1]}
              </p>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white/10" style={{ color: themeColor }}>
                {progressPercent}%
              </span>
            </div>
          </div>
        </div>
        
        {isBackupNeeded && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex justify-between items-center gap-4 animate-in slide-in-from-top duration-500">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500"><IconCloud className="w-5 h-5" /></div>
               <div>
                 <p className="text-[10px] font-black uppercase tracking-wider text-amber-500">Data Integrity Warning</p>
                 <p className="text-[8px] font-bold uppercase opacity-60 text-amber-500">Daily maintenance backup required</p>
               </div>
             </div>
             <button onClick={() => setActiveView('settings')} className="text-[8px] font-black uppercase bg-amber-500 text-black px-4 py-2 rounded-lg active:scale-95 transition-all">Secure Data</button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-indigo-500/10 rounded-2xl p-3 border border-indigo-500/10"><p className="text-[7px] font-black uppercase opacity-40 mb-1" style={{ color: textColor }}>Standard</p><p className="text-lg font-black" style={{ color: themeColor }}>{formatDuration(dailyStats.n)}</p></div>
          <div className="bg-rose-500/10 rounded-2xl p-3 border border-rose-500/10"><p className="text-[7px] font-black uppercase opacity-40 mb-1" style={{ color: textColor }}>Overtime</p><p className="text-lg font-black text-rose-500">{formatDuration(dailyStats.o)}</p></div>
        </div>
        <div className="bg-black/20 rounded-[1.5rem] p-4 border border-white/5">
           <div className="flex items-end justify-between h-14 gap-1">{weeklyGraphData.map((d, i) => (<div key={i} className="flex-1 flex flex-col items-center"><div className="w-full relative flex flex-col justify-end h-10 mb-1"><div className="w-full rounded-t-sm transition-all" style={{ height: d.ms > 0 ? `${Math.min((d.ms / 36000000) * 100, 100)}%` : '2px', backgroundColor: d.isToday ? themeColor : `${themeColor}44` }} /></div><span className={`text-[7px] font-black uppercase ${d.isToday ? 'opacity-100' : 'opacity-20'}`} style={{ color: textColor }}>{d.label}</span></div>))}</div>
        </div>
        {activeSession ? (
          <GlassCard customBg={cardColor} customBorderColor={shiftStatus === 'OVERTIME' ? '#f43f5e' : themeColor}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 min-w-0 pr-2">
                <h2 className="text-xl font-black uppercase truncate" style={{ color: textColor }}>{customers.find(c => c.id === activeSession.customerId)?.name}</h2>
                {activeSession.projectId && (
                  <div className="mt-1 flex flex-col gap-0.5 border-l-2 pl-2" style={{ borderLeftColor: `${themeColor}44` }}>
                    <p className="text-[10px] font-black uppercase" style={{ color: themeColor }}>
                      {projects.find(p => p.id === activeSession.projectId)?.mcMake || 'Make N/A'}
                    </p>
                    <p className="text-[9px] font-bold uppercase opacity-40 tracking-widest" style={{ color: textColor }}>
                      SN: {projects.find(p => p.id === activeSession.projectId)?.name || 'N/A'}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: themeColor }}></span><p className="text-[10px] font-black opacity-60" style={{ color: textColor }}>LIVE</p></div>
            </div>
            <div className="space-y-1.5">{activeSession.steps.map((s, i) => {
              const active = s.startTime && !s.endTime;
              const completed = s.endTime;
              return (
                <div key={i} className={`p-3 rounded-xl border transition-all ${active ? 'text-white' : completed ? 'opacity-40' : 'opacity-10'}`} style={active ? { backgroundColor: shiftStatus === 'OVERTIME' ? '#f43f5e' : themeColor, borderColor: 'transparent' } : { borderColor: 'rgba(255,255,255,0.05)' }}>
                  <div className="flex justify-between items-center">
                    <p className="text-[8px] font-black uppercase tracking-widest">{phaseLabels[i]}</p>
                    {completed ? (
                      <p className="text-[7px] font-mono opacity-40">{formatDuration(s.endTime! - s.startTime!)}</p>
                    ) : active ? (
                      <p className="text-[7px] font-mono opacity-100 animate-pulse">{formatDuration(Date.now() - s.startTime!)}</p>
                    ) : null}
                  </div>
                  {active && i === 1 && (
                    <div className="relative mt-3">
                      <textarea value={s.description} onChange={e => updateStepDescription(i, e.target.value)} className="w-full bg-white/10 rounded-lg p-3 text-[10px] h-20 outline-none resize-none placeholder:text-white/20" placeholder="Activity intelligence..." />
                      <button onClick={enhanceWithAi} className={`absolute bottom-2.5 right-2.5 p-2 rounded-lg transition-all ${isAiLoading ? 'animate-spin bg-white/30' : 'bg-white/20'}`} disabled={isAiLoading || !s.description}><IconSparkles className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                  {active && <button onClick={() => nextPhase(i)} className="w-full mt-3 py-2.5 bg-white/10 rounded-lg font-black uppercase text-[8px] tracking-[0.2em]">Next Segment</button>}
                </div>
              );
            })}</div>
            {activeSession.steps[2].endTime && <button onClick={finishShift} className="w-full mt-6 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase active:scale-95 transition-all">Submit Deployment</button>}
          </GlassCard>
        ) : (
          <GlassCard className="py-16 text-center border-dashed border-2 flex flex-col items-center justify-center opacity-60" customBg={cardColor}>
            <IconClock className="w-16 h-16 mb-6 opacity-10" style={{ color: themeColor }} />
            <h3 className="text-xl font-black uppercase" style={{ color: textColor }}>Terminal Idle</h3>
            <button onClick={() => setIsCheckInOpen(true)} className="px-12 py-5 bg-white text-black rounded-2xl font-black uppercase mt-6 shadow-2xl active:scale-95 transition-all">Start Shift</button>
          </GlassCard>
        )}
      </div>
    );
  };

  const renderRegistry = () => (
    <div className="space-y-4 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-6xl font-black uppercase tracking-tighter" style={{ color: textColor }}>Entities.</h1>
        <button onClick={() => setIsAddModalOpen({ type: 'client' })} className="p-4 bg-white text-black rounded-[1.5rem] shadow-xl active:scale-90 transition-transform"><IconPlus /></button>
      </div>

      <div className="space-y-3">
        <div className="space-y-3 mb-6">
          <p className="text-[10px] font-black uppercase opacity-30 ml-4 tracking-[0.2em]" style={{ color: textColor }}>Asset Intelligence Filter</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative group">
              <select 
                className="w-full appearance-none bg-black/30 p-6 pr-14 rounded-[1.8rem] outline-none text-xs font-black uppercase border border-white/5 focus:border-indigo-500/50 transition-all cursor-pointer"
                value={selectedFilterCustomerId}
                onChange={(e) => setSelectedFilterCustomerId(e.target.value)}
                style={{ color: textColor }}
              >
                <option value="">Filter By Operational Entity (All)</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-20 group-hover:opacity-100 transition-opacity" style={{ color: textColor }}>
                <IconChevronDown className="w-5 h-5" />
              </div>
            </div>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search Asset Tags..." 
                className="w-full bg-black/30 p-6 pl-14 rounded-[1.8rem] outline-none text-xs font-black uppercase border border-white/5 focus:border-indigo-500/50 transition-all placeholder:opacity-20" 
                value={registrySearch} 
                onChange={e => setRegistrySearch(e.target.value)} 
                style={{ color: textColor }}
              />
              <IconUser className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 opacity-20" style={{ color: textColor }} />
            </div>
          </div>
        </div>

        {customers
          .filter(c => {
            const matchesId = selectedFilterCustomerId ? c.id === selectedFilterCustomerId : true;
            const matchesSearch = c.name.toLowerCase().includes(registrySearch.toLowerCase());
            return matchesId && matchesSearch;
          })
          .map(c => {
            const isExpanded = expandedCustomerId === c.id;
            const clientAssets = projects.filter(p => p.customerId === c.id);
            return (
              <GlassCard key={c.id} className={`transition-all ${isExpanded ? 'ring-2 shadow-indigo-500/10' : ''}`} style={{ borderLeftColor: c.color || themeColor }} customBg={cardColor} customBorderColor={c.color || themeColor}>
                <div className="flex justify-between items-center">
                  <div className="flex-1 cursor-pointer py-2" onClick={() => setExpandedCustomerId(isExpanded ? null : c.id)}>
                    <h4 className="text-2xl font-black uppercase tracking-tight" style={{ color: textColor }}>{c.name}</h4>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setIsAddModalOpen({ type: 'client', data: c, isEdit: true }); }} 
                      className="p-3 opacity-60 hover:opacity-100 transition-opacity" 
                      style={{ color: textColor }}
                      aria-label="Edit Entity"
                    >
                      <IconEdit className="w-5 h-5" />
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); deleteCustomer(c.id); }} 
                      className="p-3 text-rose-500 opacity-60 hover:opacity-100 transition-opacity"
                      aria-label="Delete Entity"
                    >
                      <IconTrash className="w-5 h-5" />
                    </button>
                    <div 
                      className={`p-3 transition-transform duration-300 opacity-20 cursor-pointer ${isExpanded ? 'rotate-180' : ''}`} 
                      style={{ color: textColor }}
                      onClick={() => setExpandedCustomerId(isExpanded ? null : c.id)}
                    >
                      <IconChevronDown className="w-5 h-5" />
                    </div>
                  </div>
                </div>
                {isExpanded && (
                  <div className="mt-6 pt-6 border-t border-white/5 space-y-6 animate-in slide-in-from-top duration-300">
                    <div className="pt-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: textColor }}>Asset Inventory ({clientAssets.length})</p>
                        <button onClick={(e) => { e.stopPropagation(); setIsAddModalOpen({ type: 'asset', data: { customerId: c.id } }); }} className="text-[8px] font-black uppercase px-3 py-1.5 rounded-lg border active:scale-95 transition-all" style={{ backgroundColor: `${themeColor}1a`, borderColor: `${themeColor}33`, color: themeColor }}>New Asset</button>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {clientAssets.map(p => {
                          const assetExpanded = expandedAssetIds.has(p.id);
                          return (
                            <div key={p.id} className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden transition-all duration-300">
                              <div className="p-4 flex justify-between items-center group active:bg-white/5">
                                <div className="flex-1 cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleAssetExpansion(p.id); }}>
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-black uppercase" style={{ color: themeColor }}>{p.mcMake || 'Make N/A'}</p>
                                    <span className="text-[9px] font-bold opacity-20 uppercase tracking-tighter" style={{ color: textColor }}>SN: {p.name}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button type="button" onClick={(e) => { e.stopPropagation(); setIsAddModalOpen({ type: 'asset', data: p, isEdit: true }); }} className="p-3 opacity-60 hover:opacity-100 transition-opacity" style={{ color: textColor }}><IconEdit className="w-4 h-4"/></button>
                                  <button type="button" onClick={(e) => { e.stopPropagation(); deleteAsset(p.id); }} className="p-3 text-rose-500 opacity-60 hover:opacity-100 transition-opacity"><IconTrash className="w-4 h-4"/></button>
                                  <div 
                                    className={`p-3 transition-transform duration-300 opacity-20 cursor-pointer ${assetExpanded ? 'rotate-180' : ''}`} 
                                    style={{ color: textColor }}
                                    onClick={(e) => { e.stopPropagation(); toggleAssetExpansion(p.id); }}
                                  >
                                    <IconChevronDown className="w-4 h-4" />
                                  </div>
                                </div>
                              </div>
                              {assetExpanded && (
                                <div className="px-4 pb-4 animate-in slide-in-from-top duration-200">
                                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                                    <div className="bg-black/40 p-2 rounded-lg">
                                      <p className="text-[7px] font-black uppercase opacity-20" style={{ color: textColor }}>Type</p>
                                      <p className="text-[9px] font-black truncate" style={{ color: textColor }}>{p.mcType || '-'}</p>
                                    </div>
                                    <div className="bg-black/40 p-2 rounded-lg">
                                      <p className="text-[7px] font-black uppercase opacity-20" style={{ color: textColor }}>Year</p>
                                      <p className="text-[9px] font-black" style={{ color: textColor }}>{p.yearOfMfg || '-'}</p>
                                    </div>
                                    <div className="bg-black/40 p-2 rounded-lg">
                                      <p className="text-[7px] font-black uppercase opacity-20" style={{ color: textColor }}>Hours</p>
                                      <p className="text-[9px] font-black" style={{ color: textColor }}>{p.runningHours || '-'}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {clientAssets.length === 0 && <p className="text-[9px] font-black opacity-20 italic text-center py-4 uppercase" style={{ color: textColor }}>No Machines Recorded</p>}
                      </div>
                    </div>
                  </div>
                )}
              </GlassCard>
            );
          })}
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-4 animate-in fade-in duration-500 pb-20">
      <h1 className="text-6xl font-black uppercase tracking-tighter" style={{ color: textColor }}>History.</h1>
      {entries.length === 0 ? (
        <p className="text-center py-20 font-black uppercase opacity-20 tracking-widest" style={{ color: textColor }}>Terminal Log Empty</p>
      ) : entries.map(e => {
        const isExpanded = expandedLogId === e.id;
        const project = projects.find(p => p.id === e.projectId);
        const customer = customers.find(c => c.id === e.customerId);
        return (
          <GlassCard key={e.id} customBg={cardColor} customBorderColor={themeColor}>
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0 pr-4 cursor-pointer" onClick={() => setExpandedLogId(isExpanded ? null : e.id)}>
                <p className="text-[9px] font-black opacity-30 uppercase mb-1" style={{ color: textColor }}>{new Date(e.checkIn).toLocaleDateString()} • {e.jobId}</p>
                <h4 className="text-xl font-black uppercase tracking-tight leading-tight truncate" style={{ color: textColor }}>{customer?.name || 'Unknown Entity'}</h4>
                {project && (
                  <div className="mt-1.5 flex flex-col gap-0.5 border-l-2 pl-2" style={{ borderLeftColor: `${themeColor}44` }}>
                    <p className="text-[10px] font-black uppercase" style={{ color: themeColor }}>
                      {project.mcMake || 'Make N/A'}
                    </p>
                    <p className="text-[9px] font-bold uppercase opacity-40 tracking-widest" style={{ color: textColor }}>
                      Tag: {project.name || 'N/A'}
                    </p>
                  </div>
                )}
                <p className="text-[10px] font-black tabular-nums opacity-60 uppercase mt-3" style={{ color: textColor }}>{e.checkOut ? formatDuration(e.checkOut - e.checkIn) : 'Ongoing'}</p>
              </div>
              <div className="flex gap-1">
                <button 
                  type="button"
                  onClick={ev => { ev.stopPropagation(); setIsEditLogOpen(e); }} 
                  className="p-3 opacity-60 hover:opacity-100 transition-opacity" 
                  style={{ color: textColor }}
                  aria-label="Edit Log"
                >
                  <IconEdit className="w-5 h-5" />
                </button>
                <button 
                  type="button"
                  onClick={ev => { ev.stopPropagation(); deleteHistoryEntry(e.id); }} 
                  className="p-3 text-rose-500 opacity-60 hover:opacity-100 transition-opacity"
                  aria-label="Delete Log"
                >
                  <IconTrash className="w-5 h-5" />
                </button>
              </div>
            </div>
            {isExpanded && (
              <div className="mt-6 pt-6 border-t border-white/5 space-y-4 animate-in slide-in-from-top duration-300">
                {e.steps.map((s, idx) => (
                  <div key={idx} className="bg-black/20 p-4 rounded-2xl border border-white/5 space-y-3">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-[8px] font-black opacity-30 uppercase tracking-widest" style={{ color: textColor }}>{phaseLabels[idx]}</p>
                      {s.startTime && s.endTime && (
                         <p className="text-[7px] font-mono opacity-20" style={{ color: textColor }}>[{formatTime(s.startTime)} - {formatTime(s.endTime)}]</p>
                      )}
                    </div>
                    <div className="relative">
                      <textarea 
                        className="w-full bg-black/20 border border-white/5 text-[11px] leading-relaxed italic outline-none focus:border-indigo-500/30 rounded-xl p-3 resize-none transition-all placeholder:opacity-10"
                        value={s.description}
                        rows={3}
                        onClick={(ev) => ev.stopPropagation()}
                        onChange={(ev) => updateEntryStepDirectly(e.id, idx, ev.target.value)}
                        placeholder="Log detailed field observations..."
                        style={{ color: textColor }}
                      />
                      <div className="absolute top-2 right-2 opacity-10 pointer-events-none" style={{ color: textColor }}>
                        <IconEdit className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        );
      })}
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <h1 className="text-6xl font-black uppercase tracking-tighter" style={{ color: textColor }}>System.</h1>
      <div className="flex p-1 bg-black/40 rounded-[2rem]">
        <button onClick={() => setSettingsTab('appearance')} className={`flex-1 py-4 text-[9px] font-black uppercase rounded-[1.5rem] transition-all ${settingsTab === 'appearance' ? 'bg-white/10 shadow-lg' : 'opacity-40'}`} style={{ color: textColor }}>Identity</button>
        <button onClick={() => setSettingsTab('data')} className={`flex-1 py-4 text-[9px] font-black uppercase rounded-[1.5rem] transition-all ${settingsTab === 'data' ? 'bg-white/10 shadow-lg' : 'opacity-40'}`} style={{ color: textColor }}>Engine</button>
      </div>
      {settingsTab === 'appearance' ? (
        <div className="space-y-6">
          <GlassCard className="space-y-10" customBg={cardColor}>
            <div className="space-y-6">
              <p className="text-[10px] font-black uppercase opacity-30 tracking-widest" style={{ color: textColor }}>Theme Presets</p>
              <div className="grid grid-cols-2 gap-3">
                {THEME_PRESETS.map(p => (
                  <button key={p.name} onClick={() => applyPreset(p)} className="p-4 rounded-2xl border border-white/5 text-left active:scale-95 transition-all overflow-hidden relative" style={{ backgroundColor: p.bg }}>
                    <div className="absolute top-0 right-0 w-8 h-full opacity-20" style={{ backgroundColor: p.accent }} />
                    <p className="text-[10px] font-black uppercase" style={{ color: p.text }}>{p.name}</p>
                    <div className="flex gap-1 mt-2">
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.accent }} />
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.surface }} />
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.text }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-8 border-t border-white/5">
              <p className="text-[10px] font-black uppercase opacity-30 tracking-widest" style={{ color: textColor }}>Brand Accent Synthesis</p>
              <div className="grid grid-cols-5 gap-3">{BRAND_PALETTE.map(t => (<button key={t.color} onClick={() => setThemeColor(t.color)} className={`aspect-square rounded-2xl border-4 transition-transform ${themeColor === t.color ? 'border-white scale-110 shadow-xl' : 'border-transparent opacity-50'}`} style={{ backgroundColor: t.color }} />))}</div>
            </div>

            <div className="space-y-4 pt-8 border-t border-white/5">
              <p className="text-[10px] font-black uppercase opacity-30 tracking-widest" style={{ color: textColor }}>Background Tint</p>
              <div className="grid grid-cols-6 gap-2">{BG_PALETTE.map(t => (<button key={t.color} onClick={() => setBgColor(t.color)} className={`aspect-square rounded-xl border-2 transition-transform ${bgColor === t.color ? 'border-white scale-110' : 'border-transparent opacity-50'}`} style={{ backgroundColor: t.color }} />))}</div>
            </div>

            <div className="space-y-4 pt-8 border-t border-white/5">
              <p className="text-[10px] font-black uppercase opacity-30 tracking-widest" style={{ color: textColor }}>Surface Intensity</p>
              <div className="grid grid-cols-5 gap-2">{SURFACE_PALETTE.map(t => (<button key={t.name} onClick={() => setCardColor(t.color)} className={`aspect-square rounded-xl border-2 transition-transform ${cardColor === t.color ? 'border-white scale-110' : 'border-transparent opacity-50'}`} style={{ backgroundColor: t.color.includes('rgba') ? '#1e293b' : t.color, opacity: t.color.includes('rgba') ? 0.8 : 1 }} />))}</div>
            </div>

            <div className="space-y-4 pt-8 border-t border-white/5">
              <p className="text-[10px] font-black uppercase opacity-30 tracking-widest" style={{ color: textColor }}>Typography Glow</p>
              <div className="grid grid-cols-5 gap-2">{TEXT_PALETTE.map(t => (<button key={t.color} onClick={() => setTextColor(t.color)} className={`aspect-square rounded-xl border-2 transition-transform ${textColor === t.color ? 'border-white scale-110' : 'border-transparent opacity-50'}`} style={{ backgroundColor: t.color }} />))}</div>
            </div>

            <div className="space-y-5 pt-8 border-t border-white/5">
              <p className="text-[10px] font-black uppercase opacity-30 tracking-widest" style={{ color: textColor }}>Shift Segment Labels</p>
              {phaseLabels.map((l, i) => (
                <InputField key={i} label={`Segment ${i+1}`} defaultValue={l} textColor={textColor} onChange={(e: any) => {
                  const newLabels = [...phaseLabels];
                  newLabels[i] = e.target.value;
                  setPhaseLabels(newLabels);
                }} />
              ))}
            </div>

            <button onClick={resetAppearance} className="w-full py-4 text-[10px] font-black uppercase opacity-40 hover:opacity-100 transition-opacity border border-white/5 rounded-2xl" style={{ color: textColor }}>Reset Identity Defaults</button>
          </GlassCard>
        </div>
      ) : (
        <div className="space-y-6 pb-20">
          <GlassCard customBg={cardColor} className="space-y-6" customBorderColor={themeColor}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${themeColor}1a`, color: themeColor }}><IconUser className="w-5 h-5" /></div>
              <h4 className="text-[11px] font-black uppercase tracking-widest" style={{ color: textColor }}>Registry Intelligence Backup</h4>
            </div>
            <p className="text-[9px] font-bold opacity-30 uppercase" style={{ color: textColor }}>Secure your client database and asset inventory</p>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => exportData('xlsx', 'clients')} className="py-4 bg-white text-black rounded-xl font-black uppercase text-[8px] active:scale-95 transition-all">XLSX</button>
              <button onClick={() => exportData('json', 'clients')} className="py-4 bg-slate-800 rounded-xl font-black uppercase text-[8px] active:scale-95 transition-all" style={{ color: textColor }}>JSON</button>
              <button onClick={() => exportData('html', 'clients')} className="py-4 bg-slate-800 rounded-xl font-black uppercase text-[8px] active:scale-95 transition-all" style={{ color: textColor }}>HTML</button>
            </div>
          </GlassCard>
          <GlassCard customBg={cardColor} className="space-y-6" customBorderColor="#10b981">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><IconHistory className="w-5 h-5" /></div>
              <h4 className="text-[11px] font-black uppercase tracking-widest" style={{ color: textColor }}>Shift Workbook Backup</h4>
            </div>
            <p className="text-[9px] font-bold opacity-30 uppercase" style={{ color: textColor }}>Full audit log of all time entries and field operations</p>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => exportData('xlsx', 'jobs')} className="py-4 bg-white text-black rounded-xl font-black uppercase text-[8px] active:scale-95 transition-all">XLSX</button>
              <button onClick={() => exportData('json', 'jobs')} className="py-4 bg-slate-800 rounded-xl font-black uppercase text-[8px] active:scale-95 transition-all" style={{ color: textColor }}>JSON</button>
              <button onClick={() => exportData('html', 'jobs')} className="py-4 bg-slate-800 rounded-xl font-black uppercase text-[8px] active:scale-95 transition-all" style={{ color: textColor }}>HTML</button>
            </div>
          </GlassCard>
          <GlassCard customBg={cardColor} className="space-y-4">
             <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${themeColor}1a`, color: themeColor }}><IconCloud className="w-5 h-5" /></div>
              <h4 className="text-[11px] font-black uppercase tracking-widest" style={{ color: textColor }}>Database Restoration</h4>
            </div>
            <button onClick={() => importInputRef.current?.click()} className="w-full py-5 border-2 rounded-2xl font-black uppercase text-[10px] active:scale-95 transition-all" style={{ color: themeColor, borderColor: `${themeColor}33` }}>Synchronized Upload</button>
          </GlassCard>
          <input type="file" ref={importInputRef} onChange={handleImport} className="hidden" accept=".json,.xlsx" />
        </div>
      )}
    </div>
  );

  if (!isAppLoaded) return <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center animate-in fade-in duration-1000"><div className="w-24 h-24 bg-indigo-500 rounded-[2.5rem] flex items-center justify-center font-black text-5xl shadow-2xl animate-pulse">C</div></div>;
  
  if (!currentUser) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-950/30 via-slate-950 to-slate-950">
      <div className="w-full max-sm:max-w-sm space-y-10 animate-in zoom-in-95 duration-700">
        <div className="text-center"><div className="w-24 h-24 bg-indigo-500 rounded-[2rem] mx-auto flex items-center justify-center font-black text-5xl mb-8 shadow-2xl shadow-indigo-500/20">C</div><h1 className="text-5xl font-black uppercase tracking-tighter">Chronos</h1><p className="text-[11px] font-black uppercase opacity-30 tracking-[0.4em] mt-4">{isEnrollmentMode ? 'Identity Registration' : 'Terminal Access'}</p></div>
        <form onSubmit={isEnrollmentMode ? handleEnroll : handleLogin} className="space-y-5">
          {isEnrollmentMode && (
            <div className="space-y-4 animate-in slide-in-from-top duration-500">
              <input type="text" value={enrollName} onChange={e => setEnrollName(e.target.value)} placeholder="Full Technician Name" className="w-full bg-white/5 p-6 rounded-[1.8rem] text-sm font-black outline-none border border-white/10 focus:border-indigo-500 transition-all" />
              <input type="email" value={enrollEmail} onChange={e => setEnrollEmail(e.target.value)} placeholder="Institutional Email" className="w-full bg-white/5 p-6 rounded-[1.8rem] text-sm font-black outline-none border border-white/10 focus:border-indigo-500 transition-all" />
            </div>
          )}
          <input type="text" value={loginId} onChange={e => setLoginId(e.target.value)} placeholder="Technician ID" className="w-full bg-white/5 p-6 rounded-[1.8rem] text-sm font-black outline-none border border-white/10 focus:border-indigo-500 transition-all" />
          <input type="password" value={loginPin} onChange={e => setLoginPin(e.target.value)} placeholder="Security PIN" className="w-full bg-white/5 p-6 rounded-[1.8rem] text-sm font-black outline-none border border-white/10 focus:border-indigo-500 transition-all" />
          <div className="flex items-center gap-3 px-3">
            <input type="checkbox" id="rem" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="w-5 h-5 rounded-lg accent-indigo-500" />
            <label htmlFor="rem" className="text-[10px] font-black uppercase opacity-40 cursor-pointer tracking-wider">Maintain Link</label>
          </div>
          {loginError && <p className="text-rose-500 text-[10px] font-black uppercase text-center bg-rose-500/10 py-4 rounded-2xl border border-rose-500/20">{loginError}</p>}
          <button type="submit" className="w-full py-6 bg-indigo-600 text-white rounded-[2.2rem] font-black uppercase tracking-[0.3em] active:scale-[0.98] transition-all mt-6 shadow-2xl shadow-indigo-500/20">
            {isEnrollmentMode ? 'Engage Identity' : 'Verify Access'}
          </button>
        </form>
        <button onClick={() => { setIsEnrollmentMode(!isEnrollmentMode); setLoginError(''); }} className="w-full text-[10px] font-black opacity-30 uppercase tracking-[0.3em] hover:opacity-100 transition-opacity">
          {isEnrollmentMode ? 'Return to Access' : 'Create Technician Profile'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col transition-all duration-500" style={{ backgroundColor: bgColor, color: textColor }}>
      <div className="flex-1 max-w-xl mx-auto w-full px-6 pt-10 pb-40">
        <header className="flex justify-between items-center mb-12 animate-in slide-in-from-top duration-700">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[1.5rem] flex items-center justify-center text-white font-black text-2xl shadow-2xl" style={{ backgroundColor: themeColor, boxShadow: `0 10px 30px -5px ${themeColor}66` }}>C</div>
            <div className="leading-tight"><span className="block font-black text-base uppercase tracking-wider">{currentUser.name}</span><span className="text-[10px] font-bold opacity-30 uppercase tracking-[0.5em]">{currentUser.id}</span></div>
          </div>
          <button onClick={handleLogout} className="p-4 bg-white/5 rounded-[1.5rem] text-rose-500 shadow-xl active:scale-90 transition-transform"><IconLogout className="w-6 h-6" /></button>
        </header>
        <main>{activeView === 'dashboard' && renderDashboard()}{activeView === 'customers' && renderRegistry()}{activeView === 'history' && renderHistory()}{activeView === 'settings' && renderSettings()}</main>
      </div>
      <nav className="fixed bottom-0 left-0 right-0 z-[80] backdrop-blur-3xl px-8 pb-12 pt-5 flex justify-around border-t border-white/5 shadow-[0_-15px_50px_rgba(0,0,0,0.6)]" style={{ backgroundColor: `${bgColor}cc` }}>
        <IconButton icon={IconHome} active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} color={themeColor} />
        <IconButton icon={IconUser} active={activeView === 'customers'} onClick={() => setActiveView('customers')} color={themeColor} />
        <IconButton icon={IconHistory} active={activeView === 'history'} onClick={() => setActiveView('history')} color={themeColor} />
        <IconButton icon={IconSettings} active={activeView === 'settings'} onClick={() => setActiveView('settings')} color={themeColor} />
      </nav>
      {isCheckInOpen && (
         <div className="fixed inset-0 z-[100] flex items-end p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
           <GlassCard className="w-full max-w-md mx-auto mb-10" customBg={cardColor}>
            <h3 className="text-4xl font-black uppercase mb-10 tracking-tighter" style={{ color: textColor }}>Shift Initiation</h3>
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase opacity-30 ml-4 tracking-widest" style={{ color: textColor }}>Target Operational Entity</label>
                <select className="w-full bg-black/40 p-6 rounded-[2rem] text-sm font-black outline-none border border-white/10 focus:border-indigo-500 shadow-xl transition-all" value={selectedClient} onChange={e => setSelectedClient(e.target.value)} style={{ color: textColor }}>
                  <option value="">Awaiting Entity Selection...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              {selectedClient && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase opacity-30 ml-4 tracking-widest" style={{ color: textColor }}>Specific Asset Deployment</label>
                  <select className="w-full bg-black/40 p-6 rounded-[2rem] text-sm font-black outline-none border border-white/10 focus:border-indigo-500 shadow-xl transition-all" value={selectedAsset} onChange={e => setSelectedAsset(e.target.value)} style={{ color: textColor }}>
                    <option value="">General Service (No Asset)</option>
                    {projects.filter(p => p.customerId === selectedClient).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}
              <button disabled={!selectedClient} onClick={beginShift} className="w-full py-7 bg-white text-black rounded-[2.5rem] font-black uppercase tracking-[0.4em] disabled:opacity-20 shadow-2xl active:scale-[0.98] transition-all text-sm">Activate Shift</button>
              <button onClick={() => setIsCheckInOpen(false)} className="w-full py-2 text-[10px] font-black uppercase opacity-20 tracking-[0.5em]" style={{ color: textColor }}>Abort Engagement</button>
            </div>
         </GlassCard></div>
      )}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <GlassCard className="w-full max-w-md mx-auto mb-10 max-h-[90vh] overflow-y-auto" customBg={cardColor}>
            <h3 className="text-3xl font-black uppercase mb-8 tracking-tighter" style={{ color: textColor }}>
              {isAddModalOpen.isEdit ? 'Refine' : 'New'} {isAddModalOpen.type === 'client' ? 'Entity' : 'Asset'}
            </h3>
            <div className="space-y-4">
              {isAddModalOpen.type === 'client' ? (
                <>
                  <InputField id="modal-name" label="Legal Entity Name" defaultValue={isAddModalOpen.data?.name} textColor={textColor} />
                  <InputField id="modal-rep" label="Representative" defaultValue={isAddModalOpen.data?.representative} textColor={textColor} />
                  <InputField id="modal-contact" label="Contact Identifier" defaultValue={isAddModalOpen.data?.contact} textColor={textColor} />
                  <InputField id="modal-address" label="Field Address" defaultValue={isAddModalOpen.data?.address} textColor={textColor} />
                </>
              ) : (
                <>
                  <InputField id="modal-asset-name" label="Asset Serial / Identifier" defaultValue={isAddModalOpen.data?.name} textColor={textColor} />
                  <InputField id="modal-asset-make" label="Machine Make" defaultValue={isAddModalOpen.data?.mcMake} textColor={textColor} />
                  <InputField id="modal-asset-type" label="Machine Classification" defaultValue={isAddModalOpen.data?.mcType} textColor={textColor} />
                  <InputField id="modal-asset-year" label="Year of Mfg" defaultValue={isAddModalOpen.data?.yearOfMfg} textColor={textColor} />
                  <InputField id="modal-asset-hrs" label="Current Running Hours" defaultValue={isAddModalOpen.data?.runningHours} textColor={textColor} />
                </>
              )}
              <button onClick={() => {
                if (isAddModalOpen.type === 'client') {
                  const n = (document.getElementById('modal-name') as HTMLInputElement).value;
                  const rep = (document.getElementById('modal-rep') as HTMLInputElement).value;
                  const contact = (document.getElementById('modal-contact') as HTMLInputElement).value;
                  const addr = (document.getElementById('modal-address') as HTMLInputElement).value;
                  if (!n) return;
                  if (isAddModalOpen.isEdit) setCustomers(prev => prev.map(c => c.id === isAddModalOpen.data.id ? { ...c, name: n, representative: rep, contact, address: addr } : c));
                  else setCustomers(prev => [...prev, { id: generateUUID(), name: n, representative: rep, contact, address: addr, color: themeColor }]);
                } else {
                  const n = (document.getElementById('modal-asset-name') as HTMLInputElement).value;
                  const make = (document.getElementById('modal-asset-make') as HTMLInputElement).value;
                  const type = (document.getElementById('modal-asset-type') as HTMLInputElement).value;
                  const year = (document.getElementById('modal-asset-year') as HTMLInputElement).value;
                  const hrs = (document.getElementById('modal-asset-hrs') as HTMLInputElement).value;
                  if (!n) return;
                  if (isAddModalOpen.isEdit) setProjects(prev => prev.map(p => p.id === isAddModalOpen.data.id ? { ...p, name: n, mcMake: make, mcType: type, yearOfMfg: year, runningHours: hrs } : p));
                  else setProjects(prev => [...prev, { id: generateUUID(), customerId: isAddModalOpen.data.customerId, name: n, mcMake: make, mcType: type, yearOfMfg: year, runningHours: hrs }]);
                }
                setIsAddModalOpen(null);
              }} className="w-full py-6 bg-white text-black rounded-[2rem] font-black uppercase tracking-[0.3em] shadow-2xl active:scale-[0.98] transition-all mt-6 text-sm">Commit Record</button>
              <button onClick={() => setIsAddModalOpen(null)} className="w-full py-2 text-[10px] font-black uppercase opacity-30 tracking-[0.4em]" style={{ color: textColor }}>Cancel Entry</button>
            </div>
          </GlassCard>
        </div>
      )}
      {isEditLogOpen && (
        <div className="fixed inset-0 z-[100] flex items-end p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <GlassCard className="w-full max-w-md mx-auto mb-10 max-h-[90vh] overflow-y-auto" customBg={cardColor}>
            <div className="mb-8">
              <h3 className="text-3xl font-black uppercase tracking-tighter leading-none" style={{ color: textColor }}>Log Correction</h3>
              <div className="mt-2 flex flex-col gap-1">
                <p className="text-[11px] font-black uppercase" style={{ color: themeColor }}>
                  {customers.find(c => c.id === isEditLogOpen.customerId)?.name || 'Unknown Entity'}
                </p>
                {projects.find(p => p.id === isEditLogOpen.projectId) && (
                  <p className="text-[10px] font-bold uppercase opacity-50 tracking-widest" style={{ color: textColor }}>
                    {projects.find(p => p.id === isEditLogOpen.projectId)?.mcMake} (SN: {projects.find(p => p.id === isEditLogOpen.projectId)?.name})
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Session Start" type="datetime-local" value={toDateTimeLocal(isEditLogOpen.checkIn)} textColor={textColor} onChange={(e: any) => setIsEditLogOpen({...isEditLogOpen, checkIn: fromDateTimeLocal(e.target.value)})} />
                <InputField label="Session End" type="datetime-local" value={isEditLogOpen.checkOut ? toDateTimeLocal(isEditLogOpen.checkOut) : ''} textColor={textColor} onChange={(e: any) => setIsEditLogOpen({...isEditLogOpen, checkOut: fromDateTimeLocal(e.target.value)})} />
              </div>
              <div className="space-y-6 pt-4 border-t border-white/5">
                <p className="text-[10px] font-black uppercase opacity-40" style={{ color: textColor }}>Segment Adjustment</p>
                {isEditLogOpen.steps.map((s, idx) => (
                  <div key={idx} className="bg-black/20 p-4 rounded-2xl space-y-4">
                    <p className="text-[8px] font-black uppercase opacity-60" style={{ color: themeColor }}>{phaseLabels[idx]}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <InputField label="Start" type="datetime-local" value={s.startTime ? toDateTimeLocal(s.startTime) : ''} textColor={textColor} onChange={(e: any) => {
                        const steps = [...isEditLogOpen.steps];
                        steps[idx].startTime = fromDateTimeLocal(e.target.value);
                        setIsEditLogOpen({...isEditLogOpen, steps: steps as any});
                      }} />
                      <InputField label="End" type="datetime-local" value={s.endTime ? toDateTimeLocal(s.endTime) : ''} textColor={textColor} onChange={(e: any) => {
                        const steps = [...isEditLogOpen.steps];
                        steps[idx].endTime = fromDateTimeLocal(e.target.value);
                        setIsEditLogOpen({...isEditLogOpen, steps: steps as any});
                      }} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase opacity-40 ml-1 tracking-wider">Phase Notes</label>
                      <textarea 
                        className="w-full bg-black/20 rounded-xl p-4 text-sm font-black outline-none resize-none border-2 border-transparent focus:border-indigo-500 transition-all h-24 placeholder:opacity-20"
                        placeholder="Detail phase activities..."
                        value={s.description}
                        onChange={(e) => {
                          const steps = [...isEditLogOpen.steps];
                          steps[idx].description = e.target.value;
                          setIsEditLogOpen({...isEditLogOpen, steps: steps as any});
                        }}
                        style={{ color: textColor }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={saveLogAdjustments} className="w-full py-6 bg-emerald-500 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] shadow-2xl active:scale-[0.98] transition-all mt-4 text-sm">Update Workbook</button>
              <button onClick={() => setIsEditLogOpen(null)} className="w-full py-2 text-[10px] font-black uppercase opacity-30 tracking-[0.4em]" style={{ color: textColor }}>Discard Changes</button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
