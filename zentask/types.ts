/**
 * ZenTask AI Reminder - Type Definitions
 */

/**
 * Task priority levels
 */
export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

/**
 * Task categories for organization
 */
export enum Category {
  WORK = 'Work',
  PERSONAL = 'Personal',
  HOME = 'Home',
  HEALTH = 'Health',
  FINANCE = 'Finance',
  OTHER = 'Other'
}

/**
 * Task interface representing a todo item
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string; // ISO string
  priority: Priority;
  category: Category;
  completed: boolean;
  createdAt: string;
  reminderOffset?: number | null; // minutes before due date, null means use global default
}

/**
 * User preferences for task reminders
 */
export interface ReminderSettings {
  notificationsEnabled: boolean;
  leadTimeMinutes: number;
  soundEnabled: boolean;
}

/**
 * Statistics about tasks for dashboard display
 */
export interface TaskStats {
  completed: number;
  pending: number;
  byCategory: { name: string; count: number }[];
}

/**
 * Available view types in the application
 */
export type ViewType = 'all' | 'today' | 'upcoming' | 'completed' | 'stats';
