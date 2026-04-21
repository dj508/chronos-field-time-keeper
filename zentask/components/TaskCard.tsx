
import React from 'react';
import { Task, Priority } from '../types';
import { Clock, Calendar, MoreVertical, CheckCircle2, Circle, Pencil, Trash2 } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onToggle, onDelete, onEdit }) => {
  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.HIGH: return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-900/50';
      case Priority.MEDIUM: return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900/50';
      case Priority.LOW: return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900/50';
      default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const formattedDate = new Date(task.dueDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className={`group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 transition-all hover:shadow-md dark:hover:shadow-indigo-900/10 ${task.completed ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <button 
          onClick={() => onToggle(task.id)}
          className="mt-1 transition-colors"
        >
          {task.completed ? (
            <CheckCircle2 className="text-indigo-600 dark:text-indigo-400 fill-indigo-50 dark:fill-indigo-950/30" size={22} />
          ) : (
            <Circle className="text-slate-300 dark:text-slate-600 hover:text-indigo-400 dark:hover:text-indigo-500" size={22} />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wide ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
               <button 
                onClick={() => onEdit(task)} 
                className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                title="Edit Task"
               >
                  <Pencil size={14} />
               </button>
               <button 
                onClick={() => onDelete(task.id)} 
                className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                title="Delete Task"
               >
                  <Trash2 size={14} />
               </button>
            </div>
          </div>
          
          <h3 className={`font-semibold text-slate-800 dark:text-slate-100 truncate mb-1 ${task.completed ? 'line-through' : ''}`}>
            {task.title}
          </h3>
          
          {task.description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
              {task.description}
            </p>
          )}
          
          <div className="flex items-center gap-4 mt-auto">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Calendar size={14} />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">
              <span>{task.category}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
