
import React from 'react';
import { ViewType } from '../types';
import { 
  Calendar, 
  CheckCircle2, 
  ListTodo, 
  BarChart3,
  Plus,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onAddTask: () => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onViewChange, 
  onAddTask, 
  isCollapsed, 
  onToggle 
}) => {
  const navItems = [
    { id: 'all', label: 'All Tasks', icon: ListTodo },
    { id: 'today', label: 'Today', icon: Calendar },
    { id: 'upcoming', label: 'Upcoming', icon: Calendar },
    { id: 'completed', label: 'Completed', icon: CheckCircle2 },
    { id: 'stats', label: 'Dashboard', icon: BarChart3 },
  ];

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen flex flex-col sticky top-0 transition-all duration-300 ease-in-out z-30`}>
      <div className="p-4 flex flex-col h-full">
        {/* Header & Toggle */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-8 mt-2 px-2`}>
          {!isCollapsed && (
            <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
              <div className="bg-indigo-600 p-1.5 rounded-lg shrink-0">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">ZenTask</h1>
            </div>
          )}
          <button 
            onClick={onToggle}
            className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
        </div>

        {/* Action Button */}
        <button 
          onClick={onAddTask}
          className={`flex items-center justify-center gap-2 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-200 dark:shadow-none mb-8 ${
            isCollapsed ? 'w-12 h-12 p-0 mx-auto' : 'w-full py-3 px-4'
          }`}
          title="New Task"
        >
          <Plus size={24} />
          {!isCollapsed && <span className="overflow-hidden whitespace-nowrap">New Task</span>}
        </button>

        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id as ViewType)}
                title={isCollapsed ? item.label : ""}
                className={`w-full flex items-center gap-3 rounded-lg text-sm font-medium transition-all ${
                  isCollapsed ? 'justify-center p-3' : 'px-4 py-3'
                } ${
                  isActive 
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon size={20} className="shrink-0" />
                {!isCollapsed && <span className="overflow-hidden whitespace-nowrap">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer Area */}
        <div className="mt-auto">
          {!isCollapsed ? (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 transition-all">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Pro Plan</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Get unlimited AI task parsing and analytics.</p>
              <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">Upgrade Now &rarr;</button>
            </div>
          ) : (
            <div className="flex justify-center pb-4">
               <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
