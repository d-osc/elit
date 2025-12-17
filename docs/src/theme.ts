import { createState } from 'elit';

export type Theme = 'dark' | 'light';

// Get theme from localStorage or default to dark
const getInitialTheme = (): Theme => {
  const stored = localStorage.getItem('elit-theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return 'dark';
};

// Create reactive theme state
export const currentTheme = createState<Theme>(getInitialTheme());

// Apply theme to document
const applyTheme = (theme: Theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('elit-theme', theme);
};

// Initialize theme on load
applyTheme(currentTheme.value);

// Toggle theme function
export const toggleTheme = () => {
  currentTheme.value = currentTheme.value === 'dark' ? 'light' : 'dark';
  applyTheme(currentTheme.value);
};
