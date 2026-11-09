import { Moon, Sun } from 'lucide-react';
import { useTranslation } from '../../i18n/use-translation';
import { usePreferences } from '../../preferences/use-preferences';
import IconButton from '../ui/icon-button';

export default function ThemeSwitcher() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = usePreferences();

  return (
    <IconButton
      label={theme === 'light' ? t('theme.dark') : t('theme.light')}
      onClick={toggleTheme}
    >
      {theme === 'light' ? (
        <Moon size={18} aria-hidden="true" />
      ) : (
        <Sun size={18} aria-hidden="true" />
      )}
    </IconButton>
  );
}