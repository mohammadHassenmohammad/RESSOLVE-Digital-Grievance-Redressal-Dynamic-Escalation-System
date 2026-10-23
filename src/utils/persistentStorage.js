import {
  SEED_DEPARTMENTS,
  SEED_CATEGORIES,
  SEED_ROLES,
  SEED_WORKFLOWS,
  SEED_USERS,
  INITIAL_COMPLAINTS_SEED,
  INITIAL_AUDIT_LOGS_SEED,
  INITIAL_NOTIFICATIONS_SEED,
} from '../data/seedData';

const KEYS = {
  USERS: 'ressolve_users_v2',
  COMPLAINTS: 'ressolve_complaints_v2',
  WORKFLOWS: 'ressolve_workflows_v2',
  DEPARTMENTS: 'ressolve_departments_v2',
  CATEGORIES: 'ressolve_categories_v2',
  ROLES: 'ressolve_roles_v2',
  AUDIT_LOGS: 'ressolve_audit_logs_v2',
  NOTIFICATIONS: 'ressolve_notifications_v2',
  ACTIVE_USER: 'ressolve_active_user_v2',
  SETTINGS: 'ressolve_settings_v2',
};

const safeGet = (key, fallback) => {
  try {
    const val = localStorage.getItem(key);
    if (!val) return fallback;
    return JSON.parse(val);
  } catch (e) {
    console.warn(`Storage get error for ${key}:`, e);
    return fallback;
  }
};

const safeSet = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
    // Dispatch a custom event so other components can react instantly
    window.dispatchEvent(new CustomEvent('ressolve_storage_update', { detail: { key } }));
  } catch (e) {
    console.warn(`Storage set error for ${key}:`, e);
  }
};

// Initialize default data if not present
export const initPersistentStore = () => {
  if (!localStorage.getItem(KEYS.DEPARTMENTS)) safeSet(KEYS.DEPARTMENTS, SEED_DEPARTMENTS);
  if (!localStorage.getItem(KEYS.CATEGORIES)) safeSet(KEYS.CATEGORIES, SEED_CATEGORIES);
  if (!localStorage.getItem(KEYS.ROLES)) safeSet(KEYS.ROLES, SEED_ROLES);
  if (!localStorage.getItem(KEYS.WORKFLOWS)) safeSet(KEYS.WORKFLOWS, SEED_WORKFLOWS);
  if (!localStorage.getItem(KEYS.USERS)) safeSet(KEYS.USERS, SEED_USERS);
  if (!localStorage.getItem(KEYS.COMPLAINTS)) safeSet(KEYS.COMPLAINTS, INITIAL_COMPLAINTS_SEED);
  if (!localStorage.getItem(KEYS.AUDIT_LOGS)) safeSet(KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS_SEED);
  if (!localStorage.getItem(KEYS.NOTIFICATIONS)) safeSet(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS_SEED);
};

export const getStoredDepartments = () => safeGet(KEYS.DEPARTMENTS, SEED_DEPARTMENTS);
export const getStoredCategories = () => safeGet(KEYS.CATEGORIES, SEED_CATEGORIES);
export const getStoredRoles = () => safeGet(KEYS.ROLES, SEED_ROLES);

export const getStoredWorkflows = () => safeGet(KEYS.WORKFLOWS, SEED_WORKFLOWS);
export const saveStoredWorkflows = (list) => safeSet(KEYS.WORKFLOWS, list);

export const getStoredUsers = () => safeGet(KEYS.USERS, SEED_USERS);
export const saveStoredUsers = (list) => safeSet(KEYS.USERS, list);

export const getStoredComplaints = () => safeGet(KEYS.COMPLAINTS, INITIAL_COMPLAINTS_SEED);
export const saveStoredComplaints = (list) => safeSet(KEYS.COMPLAINTS, list);

export const getStoredAuditLogs = () => safeGet(KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS_SEED);
export const saveStoredAuditLogs = (list) => safeSet(KEYS.AUDIT_LOGS, list);

export const getStoredNotifications = () => safeGet(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS_SEED);
export const saveStoredNotifications = (list) => safeSet(KEYS.NOTIFICATIONS, list);

export const getActiveUserSession = () => safeGet(KEYS.ACTIVE_USER, null);
export const setActiveUserSession = (user) => safeSet(KEYS.ACTIVE_USER, user);
export const clearActiveUserSession = () => {
  try {
    localStorage.removeItem(KEYS.ACTIVE_USER);
    window.dispatchEvent(new CustomEvent('ressolve_storage_update', { detail: { key: KEYS.ACTIVE_USER } }));
  } catch (e) {
    console.warn(e);
  }
};
