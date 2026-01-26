import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rss,
  Inbox,
  BookmarkCheck,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  LogOut,
  FileText,
  Sun,
  Moon,
  Monitor,
  Search,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { SearchInput } from '@/components/search';
import { useUIStore } from '@/stores/uiStore';
import { useFeedStore } from '@/stores/feedStore';
import { useAuthStore } from '@/stores/authStore';
import { useFeeds, useUpdatePreferences } from '@/hooks';
import { AddFeedModal } from '@/components/feeds';
import { CategoryTree } from '@/components/categories';
import { OPMLModal } from '@/components/settings';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  collapsed?: boolean;
  badge?: number;
  onClick?: () => void;
}

function NavItem({ icon, label, isActive, collapsed, badge, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
        'hover:bg-white/50 dark:hover:bg-gray-800/50',
        isActive && 'bg-accent-500/10 text-accent-600 dark:text-accent-400',
        !isActive && 'text-gray-600 dark:text-gray-300'
      )}
    >
      <span className="flex-shrink-0">{icon}</span>
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="flex-1 text-left text-sm font-medium truncate"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
      {!collapsed && badge !== undefined && badge > 0 && (
        <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-accent-500/20 text-accent-600 dark:text-accent-400 rounded-full">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}

export function Sidebar() {
  const [isAddFeedOpen, setIsAddFeedOpen] = useState(false);
  const [isOPMLOpen, setIsOPMLOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebarCollapsed, theme, setTheme } = useUIStore();
  const { selectedView, setView, selectFeed, selectedFeedId, setSearchQuery, searchQuery } = useFeedStore();
  const { logout, user } = useAuthStore();
  const updatePreferences = useUpdatePreferences();

  const { data: feeds = [] } = useFeeds();

  const isSettingsPage = location.pathname === '/settings';

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    updatePreferences.mutate({ theme: newTheme });
  };

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 72 : 280 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="h-full flex flex-col glass border-r border-white/10 dark:border-gray-700/30"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 dark:border-gray-700/30">
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-lg bg-accent-500 flex items-center justify-center">
                  <Rss className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg">aRSS</span>
              </motion.div>
            )}
          </AnimatePresence>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleSidebarCollapsed}
            className="flex-shrink-0"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Search */}
        {!sidebarCollapsed && (
          <div className="px-3 py-2">
            <SearchInput
              onSearch={setSearchQuery}
              placeholder="Search articles..."
              className="w-full"
            />
          </div>
        )}
        {sidebarCollapsed && (
          <div className="px-3 py-2 flex justify-center">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                toggleSidebarCollapsed();
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <Search className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-hide">
          <NavItem
            icon={<Inbox className="w-5 h-5" />}
            label="All Articles"
            isActive={selectedView === 'all'}
            collapsed={sidebarCollapsed}
            onClick={() => setView('all')}
          />
          <NavItem
            icon={<Rss className="w-5 h-5" />}
            label="Unread"
            isActive={selectedView === 'unread'}
            collapsed={sidebarCollapsed}
            onClick={() => setView('unread')}
          />
          <NavItem
            icon={<BookmarkCheck className="w-5 h-5" />}
            label="Saved"
            isActive={selectedView === 'saved'}
            collapsed={sidebarCollapsed}
            onClick={() => setView('saved')}
          />

          {/* Categories Section */}
          {!sidebarCollapsed && (
            <div className="pt-4">
              <CategoryTree />
            </div>
          )}

          {/* Feeds Section */}
          {!sidebarCollapsed && (
            <div className="pt-4">
              <div className="flex items-center justify-between px-3 mb-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Feeds
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-6 w-6"
                  onClick={() => setIsAddFeedOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {feeds.length === 0 ? (
                <p className="px-3 text-sm text-gray-400">No feeds yet</p>
              ) : (
                feeds.map((subscription) => (
                  <NavItem
                    key={subscription.id}
                    icon={
                      subscription.feed.iconUrl ? (
                        <img
                          src={subscription.feed.iconUrl}
                          alt=""
                          className="w-5 h-5 rounded"
                        />
                      ) : (
                        <Rss className="w-5 h-5" />
                      )
                    }
                    label={subscription.customTitle || subscription.feed.title}
                    isActive={selectedFeedId === subscription.feedId}
                    collapsed={sidebarCollapsed}
                    onClick={() => selectFeed(subscription.feedId)}
                  />
                ))
              )}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 dark:border-gray-700/30 space-y-1">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <div>
                <NavItem
                  icon={<Settings className="w-5 h-5" />}
                  label="Settings"
                  collapsed={sidebarCollapsed}
                />
              </div>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="min-w-[200px] glass rounded-lg p-1 shadow-lg animate-fade-in z-50"
                side="top"
                sideOffset={5}
                align="start"
              >
                <DropdownMenu.Item
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer outline-none hover:bg-gray-100 dark:hover:bg-gray-800"
                  onSelect={() => navigate('/settings')}
                >
                  <Settings className="w-4 h-4" />
                  All Settings
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

                <DropdownMenu.Label className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Theme
                </DropdownMenu.Label>
                <DropdownMenu.Item
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer outline-none',
                    theme === 'light'
                      ? 'bg-accent-500/10 text-accent-600 dark:text-accent-400'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                  onSelect={() => handleThemeChange('light')}
                >
                  <Sun className="w-4 h-4" />
                  Light
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer outline-none',
                    theme === 'dark'
                      ? 'bg-accent-500/10 text-accent-600 dark:text-accent-400'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                  onSelect={() => handleThemeChange('dark')}
                >
                  <Moon className="w-4 h-4" />
                  Dark
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer outline-none',
                    theme === 'system'
                      ? 'bg-accent-500/10 text-accent-600 dark:text-accent-400'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                  onSelect={() => handleThemeChange('system')}
                >
                  <Monitor className="w-4 h-4" />
                  System
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

                <DropdownMenu.Label className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Data
                </DropdownMenu.Label>
                <DropdownMenu.Item
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer outline-none hover:bg-gray-100 dark:hover:bg-gray-800"
                  onSelect={() => setIsOPMLOpen(true)}
                >
                  <FileText className="w-4 h-4" />
                  Import / Export OPML
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          {user && (
            <NavItem
              icon={<LogOut className="w-5 h-5" />}
              label="Log out"
              collapsed={sidebarCollapsed}
              onClick={logout}
            />
          )}
        </div>
      </motion.aside>

      <AddFeedModal isOpen={isAddFeedOpen} onClose={() => setIsAddFeedOpen(false)} />
      <OPMLModal isOpen={isOPMLOpen} onClose={() => setIsOPMLOpen(false)} />
    </>
  );
}
