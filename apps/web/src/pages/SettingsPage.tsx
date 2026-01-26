import { motion } from 'framer-motion';
import {
  Sun,
  Moon,
  Monitor,
  Palette,
  LayoutGrid,
  List,
  Newspaper,
  PanelLeft,
  Maximize2,
  Layers,
  Type,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { useUIStore } from '@/stores/uiStore';
import { useUpdatePreferences } from '@/hooks';
import { presetColors, isValidHex, getContrastColor } from '@/lib/colors';
import { cn } from '@/lib/utils';
import { useState } from 'react';

type Theme = 'light' | 'dark' | 'system';
type Layout = 'list' | 'cards' | 'magazine';
type ArticleView = 'split' | 'overlay' | 'full';
type FontSize = 'small' | 'medium' | 'large';

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-6"
    >
      <h2 className="text-lg font-semibold mb-1">{title}</h2>
      {description && (
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
      )}
      {children}
    </motion.div>
  );
}

interface OptionButtonProps {
  icon: React.ReactNode;
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

function OptionButton({ icon, label, isSelected, onClick }: OptionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
        isSelected
          ? 'border-accent-500 bg-accent-500/10 text-accent-600 dark:text-accent-400'
          : 'border-border/50 hover:border-border hover:bg-muted/50'
      )}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
      {isSelected && (
        <div className="absolute top-2 right-2">
          <Check className="w-4 h-4" />
        </div>
      )}
    </button>
  );
}

export function SettingsPage() {
  const {
    theme,
    setTheme,
    layout,
    setLayout,
    articleView,
    setArticleView,
    accentColor,
    setAccentColor,
    fontSize,
    setFontSize,
  } = useUIStore();

  const updatePreferences = useUpdatePreferences();
  const [customColor, setCustomColor] = useState(accentColor);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    updatePreferences.mutate({ theme: newTheme });
  };

  const handleLayoutChange = (newLayout: Layout) => {
    setLayout(newLayout);
    updatePreferences.mutate({ layout: newLayout });
  };

  const handleArticleViewChange = (newView: ArticleView) => {
    setArticleView(newView);
    updatePreferences.mutate({ articleView: newView });
  };

  const handleAccentColorChange = (color: string) => {
    setAccentColor(color);
    setCustomColor(color);
    updatePreferences.mutate({ accentColor: color });
  };

  const handleFontSizeChange = (size: FontSize) => {
    setFontSize(size);
    updatePreferences.mutate({ fontSize: size });
  };

  const handleCustomColorInput = (value: string) => {
    setCustomColor(value);
    if (isValidHex(value)) {
      handleAccentColorChange(value);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Customize your reading experience
        </p>
      </motion.div>

      {/* Theme Section */}
      <SettingsSection
        title="Appearance"
        description="Choose how aRSS looks to you"
      >
        <div className="grid grid-cols-3 gap-4">
          <OptionButton
            icon={<Sun className="w-6 h-6" />}
            label="Light"
            isSelected={theme === 'light'}
            onClick={() => handleThemeChange('light')}
          />
          <OptionButton
            icon={<Moon className="w-6 h-6" />}
            label="Dark"
            isSelected={theme === 'dark'}
            onClick={() => handleThemeChange('dark')}
          />
          <OptionButton
            icon={<Monitor className="w-6 h-6" />}
            label="System"
            isSelected={theme === 'system'}
            onClick={() => handleThemeChange('system')}
          />
        </div>
      </SettingsSection>

      {/* Accent Color Section */}
      <SettingsSection
        title="Accent Color"
        description="Pick a color that reflects your style"
      >
        <div className="space-y-4">
          {/* Preset Colors */}
          <div className="flex flex-wrap gap-3">
            {presetColors.map((color) => (
              <button
                key={color.hex}
                onClick={() => handleAccentColorChange(color.hex)}
                className={cn(
                  'w-10 h-10 rounded-full transition-all duration-200',
                  'ring-offset-2 ring-offset-background',
                  accentColor === color.hex
                    ? 'ring-2 ring-foreground scale-110'
                    : 'hover:scale-105'
                )}
                style={{ backgroundColor: color.hex }}
                title={color.name}
              >
                {accentColor === color.hex && (
                  <Check
                    className="w-5 h-5 mx-auto"
                    style={{ color: getContrastColor(color.hex) }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Custom Color Input */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Custom:</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={customColor}
                onChange={(e) => handleCustomColorInput(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
              />
              <input
                type="text"
                value={customColor}
                onChange={(e) => handleCustomColorInput(e.target.value)}
                placeholder="#3b82f6"
                className={cn(
                  'w-28 px-3 py-2 text-sm rounded-md uppercase',
                  'bg-muted/50 border border-border/50',
                  'focus:outline-none focus:ring-2 focus:ring-primary/50'
                )}
              />
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Layout Section */}
      <SettingsSection
        title="Feed Layout"
        description="Choose how articles are displayed in the feed"
      >
        <div className="grid grid-cols-3 gap-4">
          <OptionButton
            icon={<List className="w-6 h-6" />}
            label="List"
            isSelected={layout === 'list'}
            onClick={() => handleLayoutChange('list')}
          />
          <OptionButton
            icon={<LayoutGrid className="w-6 h-6" />}
            label="Cards"
            isSelected={layout === 'cards'}
            onClick={() => handleLayoutChange('cards')}
          />
          <OptionButton
            icon={<Newspaper className="w-6 h-6" />}
            label="Magazine"
            isSelected={layout === 'magazine'}
            onClick={() => handleLayoutChange('magazine')}
          />
        </div>
      </SettingsSection>

      {/* Article View Section */}
      <SettingsSection
        title="Article View"
        description="How articles open when you click them"
      >
        <div className="grid grid-cols-3 gap-4">
          <OptionButton
            icon={<PanelLeft className="w-6 h-6" />}
            label="Split"
            isSelected={articleView === 'split'}
            onClick={() => handleArticleViewChange('split')}
          />
          <OptionButton
            icon={<Layers className="w-6 h-6" />}
            label="Overlay"
            isSelected={articleView === 'overlay'}
            onClick={() => handleArticleViewChange('overlay')}
          />
          <OptionButton
            icon={<Maximize2 className="w-6 h-6" />}
            label="Full"
            isSelected={articleView === 'full'}
            onClick={() => handleArticleViewChange('full')}
          />
        </div>
      </SettingsSection>

      {/* Font Size Section */}
      <SettingsSection
        title="Reading"
        description="Customize your reading experience"
      >
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-3">
              <Type className="w-4 h-4" />
              Font Size
            </label>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => handleFontSizeChange('small')}
                className={cn(
                  'py-3 px-4 rounded-lg border-2 transition-all',
                  fontSize === 'small'
                    ? 'border-accent-500 bg-accent-500/10'
                    : 'border-border/50 hover:border-border'
                )}
              >
                <span className="text-xs">Aa</span>
                <span className="block text-sm mt-1">Small</span>
              </button>
              <button
                onClick={() => handleFontSizeChange('medium')}
                className={cn(
                  'py-3 px-4 rounded-lg border-2 transition-all',
                  fontSize === 'medium'
                    ? 'border-accent-500 bg-accent-500/10'
                    : 'border-border/50 hover:border-border'
                )}
              >
                <span className="text-base">Aa</span>
                <span className="block text-sm mt-1">Medium</span>
              </button>
              <button
                onClick={() => handleFontSizeChange('large')}
                className={cn(
                  'py-3 px-4 rounded-lg border-2 transition-all',
                  fontSize === 'large'
                    ? 'border-accent-500 bg-accent-500/10'
                    : 'border-border/50 hover:border-border'
                )}
              >
                <span className="text-lg">Aa</span>
                <span className="block text-sm mt-1">Large</span>
              </button>
            </div>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}
