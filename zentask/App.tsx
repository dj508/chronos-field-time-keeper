
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Task, ViewType, Priority, Category, ReminderSettings } from './types';
import { parseSmartTask, getDailyInspiration } from './services/geminiService';
import Sidebar from './components/Sidebar';
import TaskCard from './components/TaskCard';
import Dashboard from './components/Dashboard';
import SettingsModal from './components/SettingsModal';
import { Sparkles, Search, Bell, Settings, X, Loader2, BrainCircuit, ListTodo, Filter, Sun, Moon, Calendar as CalendarIcon, Tag, AlertCircle, Type as TypeIcon, BellRing } from 'lucide-react';

const REMINDER_INTERVALS = [
  { label: 'Use Global Default', value: 'default' },
  { label: 'None', value: 'none' },
  { label: 'At time of event', value: 0 },
  { label: '5 minutes before', value: 5 },
  { label: '15 minutes before', value: 15 },
  { label: '30 minutes before', value: 30 },
  { label: '1 hour before', value: 60 },
  { label: '1 day before', value: 1440 },
];

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentView, setCurrentView] = useState<ViewType>('all');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [modalMode, setModalMode] = useState<'smart' | 'manual'>('smart');
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('zentask_theme');
    return (saved as 'light' | 'dark') || 'light';
  });
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(() => {
    const saved = localStorage.getItem('zentask_reminder_settings');
    return saved ? JSON.parse(saved) : {
      notificationsEnabled: false,
      leadTimeMinutes: 10,
      soundEnabled: true
    };
  });
  const [inspiration, setInspiration] = useState('');
  const [smartInput, setSmartInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Manual Form State
  const [manualTask, setManualTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    dueDate: new Date().toISOString().slice(0, 16),
    priority: Priority.MEDIUM,
    category: Category.PERSONAL,
    reminderOffset: undefined
  });

  const lastNotifiedTaskIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('zentask_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('zentask_reminder_settings', JSON.stringify(reminderSettings));
  }, [reminderSettings]);

  useEffect(() => {
    const savedTasks = localStorage.getItem('zentask_tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    } else {
      const mock: Task[] = [
        {
          id: '1',
          title: 'Design ZenTask landing page',
          description: 'Focus on clean minimal aesthetics',
          dueDate: new Date(Date.now() + 3600000).toISOString(),
          priority: Priority.HIGH,
          category: Category.WORK,
          completed: false,
          createdAt: new Date().toISOString()
        }
      ];
      setTasks(mock);
    }

    const fetchInspiration = async () => {
      const msg = await getDailyInspiration(tasks.length);
      setInspiration(msg);
    };
    fetchInspiration();
  }, []);

  useEffect(() => {
    localStorage.setItem('zentask_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    const checkReminders = () => {
      if (!reminderSettings.notificationsEnabled) return;
      if (Notification.permission !== 'granted') return;

      const now = Date.now();
      
      tasks.forEach(task => {
        if (task.completed) return;
        if (lastNotifiedTaskIds.current.has(task.id)) return;

        // Determine offset: per-task or global
        let offset = reminderSettings.leadTimeMinutes;
        if (task.reminderOffset === -1) return; // Special value for 'None'
        if (task.reminderOffset !== undefined && task.reminderOffset !== null) {
          offset = task.reminderOffset;
        }

        const taskTime = new Date(task.dueDate).getTime();
        const reminderTime = taskTime - (offset * 60 * 1000);

        if (now >= reminderTime && now < taskTime) {
          new Notification(`Reminder: ${task.title}`, {
            body: offset === 0 ? "Due now!" : `Due in ${offset} minutes.`,
            icon: '/favicon.ico'
          });
          
          if (reminderSettings.soundEnabled) {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play().catch(() => {});
          }

          lastNotifiedTaskIds.current.add(task.id);
        }
      });
    };

    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [tasks, reminderSettings]);

  const filteredTasks = useMemo(() => {
    let result = tasks;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (currentView) {
      case 'today':
        result = result.filter(t => new Date(t.dueDate) >= today && new Date(t.dueDate) < tomorrow);
        break;
      case 'upcoming':
        result = result.filter(t => new Date(t.dueDate) >= tomorrow);
        break;
      case 'completed':
        result = result.filter(t => t.completed);
        break;
    }

    if (selectedCategory !== 'All') {
      result = result.filter(t => t.category === selectedCategory);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }

    return result.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [tasks, currentView, searchQuery, selectedCategory]);

  const handleToggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setManualTask({
      title: task.title,
      description: task.description,
      dueDate: new Date(task.dueDate).toISOString().slice(0, 16),
      priority: task.priority,
      category: task.category,
      reminderOffset: task.reminderOffset
    });
    setModalMode('manual');
    setIsModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setEditingTask(null);
    setManualTask({
      title: '',
      description: '',
      dueDate: new Date().toISOString().slice(0, 16),
      priority: Priority.MEDIUM,
      category: Category.PERSONAL,
      reminderOffset: undefined
    });
    setModalMode('smart');
    setIsModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (modalMode === 'smart' && smartInput.trim()) {
      setIsParsing(true);
      const result = await parseSmartTask(smartInput);
      setIsParsing(false);
      if (result) {
        const newTask: Task = {
          id: crypto.randomUUID(),
          title: result.title,
          description: result.description || '',
          dueDate: result.dueDate,
          priority: result.priority as Priority,
          category: result.category as Category,
          completed: false,
          createdAt: new Date().toISOString(),
          reminderOffset: undefined
        };
        setTasks(prev => [newTask, ...prev]);
        setSmartInput('');
        setIsModalOpen(false);
      }
    } else if (modalMode === 'manual') {
      if (!manualTask.title) return;

      if (editingTask) {
        setTasks(prev => prev.map(t => t.id === editingTask.id ? {
          ...t,
          title: manualTask.title!,
          description: manualTask.description!,
          dueDate: new Date(manualTask.dueDate!).toISOString(),
          priority: manualTask.priority as Priority,
          category: manualTask.category as Category,
          reminderOffset: manualTask.reminderOffset
        } : t));
      } else {
        const newTask: Task = {
          id: crypto.randomUUID(),
          title: manualTask.title!,
          description: manualTask.description!,
          dueDate: new Date(manualTask.dueDate!).toISOString(),
          priority: manualTask.priority as Priority,
          category: manualTask.category as Category,
          completed: false,
          createdAt: new Date().toISOString(),
          reminderOffset: manualTask.reminderOffset
        };
        setTasks(prev => [newTask, ...prev]);
      }
      setIsModalOpen(false);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        onAddTask={handleOpenAddModal}
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <main className="flex-1 px-8 py-6 max-w-6xl mx-auto overflow-y-auto h-screen transition-all duration-300">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {currentView === 'all' && 'My Tasks'}
              {currentView === 'today' && 'Today\'s Focus'}
              {currentView === 'upcoming' && 'Upcoming Tasks'}
              {currentView === 'completed' && 'History'}
              {currentView === 'stats' && 'Productivity Dashboard'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{inspiration}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-48 lg:w-64 transition-all"
              />
            </div>
            
            <button 
              onClick={toggleTheme}
              className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
              <Bell size={20} />
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            >
              <Settings size={20} />
            </button>
          </div>
        </header>

        {currentView === 'stats' ? (
          <Dashboard tasks={tasks} />
        ) : (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2 group focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
              <div className="p-2 text-indigo-500 dark:text-indigo-400">
                <BrainCircuit size={20} />
              </div>
              <input 
                type="text" 
                value={smartInput}
                onChange={(e) => setSmartInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTask(e)}
                placeholder="Try 'Personal: Buy groceries Friday 6pm'..."
                className="flex-1 py-2 text-sm focus:outline-none text-slate-700 dark:text-slate-200 bg-transparent"
              />
              <button 
                onClick={handleSaveTask}
                disabled={isParsing || !smartInput.trim()}
                className="bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-md shadow-indigo-100 dark:shadow-none"
              >
                {isParsing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                <span className="hidden sm:inline">Smart Add</span>
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              <Filter size={16} className="text-slate-400 shrink-0" />
              <button
                onClick={() => setSelectedCategory('All')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                  selectedCategory === 'All'
                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 dark:border-indigo-500 shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600'
                }`}
              >
                All Categories
              </button>
              {Object.values(Category).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 dark:border-indigo-500 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onToggle={handleToggleTask}
                  onDelete={handleDeleteTask}
                  onEdit={handleEditClick}
                />
              ))}
              
              {filteredTasks.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                  <div className="bg-slate-100 dark:bg-slate-900 p-6 rounded-full mb-4">
                    <ListTodo size={40} />
                  </div>
                  <p className="font-medium">No tasks found in this view.</p>
                  <button onClick={handleOpenAddModal} className="mt-4 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                    Create your first task
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Task Creation/Editing Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200 border border-transparent dark:border-slate-800">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {editingTask ? 'Edit Task' : 'New Task'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              {!editingTask && (
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6">
                  <button 
                    onClick={() => setModalMode('smart')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all ${modalMode === 'smart' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Sparkles size={16} /> AI Smart Add
                  </button>
                  <button 
                    onClick={() => setModalMode('manual')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all ${modalMode === 'manual' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <ListTodo size={16} /> Manual Entry
                  </button>
                </div>
              )}

              <form onSubmit={handleSaveTask} className="space-y-4">
                {modalMode === 'smart' ? (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Natural Language Input</label>
                    <textarea 
                      autoFocus
                      value={smartInput}
                      onChange={(e) => setSmartInput(e.target.value)}
                      placeholder="Describe your task (e.g., 'Team lunch tomorrow at 1pm at Italian Bistro')"
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 flex items-start gap-1.5">
                      <AlertCircle size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                      AI will extract the title, date, priority, and category automatically.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        <TypeIcon size={14} /> Title
                      </label>
                      <input 
                        type="text"
                        required
                        value={manualTask.title}
                        onChange={(e) => setManualTask({...manualTask, title: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="Task title"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Description (Optional)
                      </label>
                      <textarea 
                        value={manualTask.description}
                        onChange={(e) => setManualTask({...manualTask, description: e.target.value})}
                        rows={2}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="Extra details..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          <CalendarIcon size={14} /> Due Date
                        </label>
                        <input 
                          type="datetime-local"
                          required
                          value={manualTask.dueDate}
                          onChange={(e) => setManualTask({...manualTask, dueDate: e.target.value})}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          <AlertCircle size={14} /> Priority
                        </label>
                        <select 
                          value={manualTask.priority}
                          onChange={(e) => setManualTask({...manualTask, priority: e.target.value as Priority})}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          {Object.values(Priority).map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          <Tag size={14} /> Category
                        </label>
                        <select 
                          value={manualTask.category}
                          onChange={(e) => setManualTask({...manualTask, category: e.target.value as Category})}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          <BellRing size={14} /> Reminder
                        </label>
                        <select 
                          value={manualTask.reminderOffset === undefined ? 'default' : (manualTask.reminderOffset === -1 ? 'none' : manualTask.reminderOffset)}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'default') setManualTask({...manualTask, reminderOffset: undefined});
                            else if (val === 'none') setManualTask({...manualTask, reminderOffset: -1});
                            else setManualTask({...manualTask, reminderOffset: parseInt(val)});
                          }}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          {REMINDER_INTERVALS.map(opt => (
                            <option key={opt.label} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-6 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isParsing || (modalMode === 'smart' && !smartInput.trim())}
                    className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 dark:shadow-none"
                  >
                    {isParsing ? <Loader2 size={18} className="animate-spin" /> : (editingTask ? 'Update Task' : 'Create Task')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={reminderSettings}
        onUpdate={setReminderSettings}
      />
    </div>
  );
};

export default App;
