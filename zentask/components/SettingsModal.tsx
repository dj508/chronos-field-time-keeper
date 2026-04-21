
import React from 'react';
import { ReminderSettings } from '../types';
import { X, Bell, Volume2, Clock, ShieldCheck, AlertCircle } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ReminderSettings;
  onUpdate: (settings: ReminderSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onUpdate }) => {
  if (!isOpen) return null;

  const requestPermission = async () => {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      onUpdate({ ...settings, notificationsEnabled: true });
    }
  };

  const leadTimeOptions = [
    { label: 'At time of event', value: 0 },
    { label: '5 minutes before', value: 5 },
    { label: '10 minutes before', value: 10 },
    { label: '15 minutes before', value: 15 },
    { label: '30 minutes before', value: 30 },
    { label: '1 hour before', value: 60 },
    { label: '1 day before', value: 1440 },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200 border border-transparent dark:border-slate-800">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Reminder Settings</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Notifications Permission */}
          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
            <div className="flex items-start gap-3">
              <ShieldCheck className="text-indigo-600 dark:text-indigo-400 shrink-0" size={20} />
              <div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">System Permissions</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-3">
                  Browser notifications must be enabled for ZenTask to alert you of upcoming tasks.
                </p>
                {Notification.permission === 'granted' ? (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck size={14} />
                    Permissions Granted
                  </div>
                ) : (
                  <button 
                    onClick={requestPermission}
                    className="text-xs font-bold text-white bg-indigo-600 dark:bg-indigo-500 px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Request Permission
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Main Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell size={18} className="text-slate-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Enable Reminders</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Get push notifications for tasks</p>
                </div>
              </div>
              <button 
                onClick={() => onUpdate({ ...settings, notificationsEnabled: !settings.notificationsEnabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  settings.notificationsEnabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 size={18} className="text-slate-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Reminder Sound</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Play a chime when notified</p>
                </div>
              </div>
              <button 
                onClick={() => onUpdate({ ...settings, soundEnabled: !settings.soundEnabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  settings.soundEnabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

          {/* Lead Time Dropdown */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Clock size={18} className="text-slate-400" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Lead Time</p>
            </div>
            <select 
              value={settings.leadTimeMinutes}
              onChange={(e) => onUpdate({ ...settings, leadTimeMinutes: parseInt(e.target.value) })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer"
            >
              {leadTimeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
              <AlertCircle size={10} />
              Notifications are checked every 30 seconds.
            </p>
          </div>

          <div className="pt-4">
            <button 
              onClick={onClose}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 dark:bg-indigo-600 text-white text-sm font-semibold hover:bg-slate-900 dark:hover:bg-indigo-700 transition-all"
            >
              Save & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
