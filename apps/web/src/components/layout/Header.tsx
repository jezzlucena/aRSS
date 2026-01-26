import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Sun, Moon, RefreshCw, LayoutGrid, List, Newspaper } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

export function Header() {
  const { theme, setTheme, layout, setLayout } = useUIStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // TODO: Implement refresh logic
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const layouts = [
    { value: 'list' as const, icon: List, label: 'List' },
    { value: 'cards' as const, icon: LayoutGrid, label: 'Cards' },
    { value: 'magazine' as const, icon: Newspaper, label: 'Magazine' },
  ];

  return (
    <header className="h-16 flex items-center justify-between px-6 glass border-b border-white/10 dark:border-gray-700/30">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            glass
            type="search"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Layout Switcher */}
        <div className="flex items-center p-1 rounded-lg bg-gray-100 dark:bg-gray-800">
          {layouts.map(({ value, icon: Icon, label }) => (
            <Button
              key={value}
              variant="ghost"
              size="icon-sm"
              onClick={() => setLayout(value)}
              className={cn(
                'rounded-md',
                layout === value && 'bg-white dark:bg-gray-700 shadow-sm'
              )}
              title={label}
            >
              <Icon className="w-4 h-4" />
            </Button>
          ))}
        </div>

        {/* Refresh */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <motion.div
            animate={{ rotate: isRefreshing ? 360 : 0 }}
            transition={{
              duration: 1,
              repeat: isRefreshing ? Infinity : 0,
              ease: 'linear',
            }}
          >
            <RefreshCw className="w-5 h-5" />
          </motion.div>
        </Button>

        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === 'dark' ? (
            <Moon className="w-5 h-5" />
          ) : theme === 'light' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <div className="relative">
              <Sun className="w-5 h-5 absolute transition-opacity dark:opacity-0" />
              <Moon className="w-5 h-5 transition-opacity opacity-0 dark:opacity-100" />
            </div>
          )}
        </Button>
      </div>
    </header>
  );
}
