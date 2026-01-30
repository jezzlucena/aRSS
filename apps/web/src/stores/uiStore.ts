import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { applyAccentPalette } from '@/lib/colors';

type Theme = 'light' | 'dark' | 'system';
type Layout = 'compact' | 'list' | 'cards' | 'magazine';
type ArticleView = 'split-horizontal' | 'split-vertical' | 'overlay' | 'full';
type FontSize = 'small' | 'medium' | 'large';
type ArticleWidth = 'narrow' | 'wide' | 'full';

interface UIState {
  theme: Theme;
  layout: Layout;
  articleView: ArticleView;
  accentColor: string;
  fontSize: FontSize;
  articleWidth: ArticleWidth;
  focusMode: boolean;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  splitPosition: number; // Percentage (0-100) for left panel width
  setTheme: (theme: Theme) => void;
  setLayout: (layout: Layout) => void;
  setArticleView: (view: ArticleView) => void;
  setAccentColor: (color: string) => void;
  setFontSize: (size: FontSize) => void;
  setArticleWidth: (width: ArticleWidth) => void;
  toggleFocusMode: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSplitPosition: (position: number) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      layout: 'list',
      articleView: 'overlay',
      accentColor: '#3b82f6',
      fontSize: 'medium',
      articleWidth: 'wide',
      focusMode: false,
      sidebarOpen: true,
      sidebarCollapsed: false,
      splitPosition: 50, // Default to 50% split

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

      setFontSize: (fontSize) => {
        set({ fontSize });
        applyFontSize(fontSize);
      },

      setArticleWidth: (articleWidth) => set({ articleWidth }),

      toggleFocusMode: () => set((state) => ({ focusMode: !state.focusMode })),

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

      toggleSidebarCollapsed: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

      setSplitPosition: (splitPosition) => {
        // Clamp between 20% and 80%
        const clamped = Math.max(20, Math.min(80, splitPosition));
        set({ splitPosition: clamped });
      },
    }),
    {
      name: 'arss-ui',
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Migrate legacy 'split' value to 'split-vertical' (side-by-side)
          if ((state.articleView as string) === 'split') {
            state.articleView = 'split-vertical';
          }
          applyTheme(state.theme);
          applyAccentColor(state.accentColor);
          applyFontSize(state.fontSize);
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

function applyFontSize(size: FontSize) {
  const root = document.documentElement;
  // Remove all font size classes first
  root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
  // Add the selected font size class
  root.classList.add(`font-size-${size}`);
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
