
/**
 * Chronos Field Timekeeper - Type Definitions
 */

/**
 * Represents a technician user in the system
 */
export interface Technician {
  id: string;
  name: string;
  email: string;
  pin: string;
}

/**
 * Customer information for field service management
 */
export interface Customer {
  id: string;
  name: string;
  representative?: string;
  address?: string;
  contact?: string;
  color: string;
}

/**
 * Project/Asset associated with a customer
 */
export interface Project {
  id: string;
  customerId: string;
  name: string; // Serial Number / Tag
  mcMake?: string;
  mcType?: string;
  yearOfMfg?: string;
  runningHours?: string;
}

/**
 * Task definition for time tracking
 */
export interface Task {
  id: string;
  name: string;
  description?: string;
  completed?: boolean;
}

/**
 * Activity type for categorizing work
 */
export interface ActivityType {
  id: string;
  name: string;
  color: string;
}

/**
 * Individual step within a time entry
 */
export interface EntryStep {
  activityId: string;
  description: string;
  startTime?: number;
  endTime?: number;
}

/**
 * Time entry record for tracking work sessions
 */
export interface TimeEntry {
  id: string;
  jobId: string;
  customerId: string;
  projectId?: string;
  steps: [EntryStep, EntryStep, EntryStep];
  checkIn: number;
  checkOut?: number;
  isSynced?: boolean;
  technicianName?: string;
  technicianEmail?: string;
}

/**
 * Application theme mode
 */
export type ThemeMode = 'light' | 'dark';

/**
 * Available application views
 */
export type AppView = 'dashboard' | 'customers' | 'history' | 'settings';
