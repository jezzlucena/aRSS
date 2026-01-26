import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { applyAccentPalette } from '@/lib/colors';

type Theme = 'light' | 'dark' | 'system';
type Layout = 'list' | 'cards' | 'magazine';
type ArticleView = 'split' | 'overlay' | 'full';
type FontSize = 'small' | 'medium' | 'large';

interface UIState {
  theme: Theme;
  layout: Layout;
  articleView: ArticleView;
  accentColor: string;
  fontSize: FontSize;
  focusMode: boolean;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  setTheme: (theme: Theme) => void;
  setLayout: (layout: Layout) => void;
  setArticleView: (view: ArticleView) => void;
  setAccentColor: (color: string) => void;
  setFontSize: (size: FontSize) => void;
  toggleFocusMode: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapsed: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      layout: 'list',
      articleView: 'split',
      accentColor: '#3b82f6',
      fontSize: 'medium',
      focusMode: false,
      sidebarOpen: true,
      sidebarCollapsed: false,

      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },

      setLayout: (layout) => set({ layout }),

      setArticleView: (articleView) => set({ articleView }),

      setAccentColor: (accentColor) => {
        set({ accentColor });
        applyAccentColor(accentColor);
      },

      setFontSize: (fontSize) => set({ fontSize }),

      toggleFocusMode: () => set((state) => ({ focusMode: !state.focusMode })),

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

      toggleSidebarCollapsed: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: 'arss-ui',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.theme);
          applyAccentColor(state.accentColor);
        }
      },
    }
  )
);

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

function applyAccentColor(hex: string) {
  // Generate and apply the full color palette
  applyAccentPalette(hex);
}

// Listen for system theme changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const state = useUIStore.getState();
    if (state.theme === 'system') {
      applyTheme('system');
    }
  });
}
