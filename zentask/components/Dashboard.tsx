
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Task, Category } from '../types';

interface DashboardProps {
  tasks: Task[];
}

const Dashboard: React.FC<DashboardProps> = ({ tasks }) => {
  const isDarkMode = document.documentElement.classList.contains('dark');
  const textColor = isDarkMode ? '#94a3b8' : '#64748b';
  const gridColor = isDarkMode ? '#1e293b' : '#f1f5f9';

  const completedCount = tasks.filter(t => t.completed).length;
  const pendingCount = tasks.length - completedCount;
  
  const categoryData = Object.values(Category).map(cat => ({
    name: cat,
    count: tasks.filter(t => t.category === cat).length
  })).filter(d => d.count > 0);

  const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Tasks</p>
          <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{tasks.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Completed</p>
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{completedCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Completion Rate</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{completionRate}%</p>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mb-2 overflow-hidden">
              <div 
                className="bg-indigo-600 dark:bg-indigo-500 h-full transition-all duration-1000" 
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6">Tasks by Category</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: textColor }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: textColor }} />
                <Tooltip 
                  cursor={{ fill: isDarkMode ? '#0f172a' : '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                    color: isDarkMode ? '#f1f5f9' : '#1e293b'
                  }}
                  itemStyle={{ color: isDarkMode ? '#f1f5f9' : '#1e293b' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6">Status Overview</h3>
          <div className="h-[300px] w-full flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Completed', value: completedCount },
                      { name: 'Pending', value: pendingCount }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#6366f1" />
                    <Cell fill={isDarkMode ? '#334155' : '#e2e8f0'} />
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                      color: isDarkMode ? '#f1f5f9' : '#1e293b'
                    }}
                  />
                </PieChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
