import { useId } from 'react';
import { LANGUAGES, isLanguage } from '../../i18n/config';
import { useTranslation } from '../../i18n/use-translation';
import { usePreferences } from '../../preferences/use-preferences';
import styles from './language-switcher.module.scss';

export default function LanguageSwitcher() {
  const id = useId();
  const { t } = useTranslation();
  const { language, setLanguage } = usePreferences();

  return (
    <div className={styles.switcher}>
      <label className="visually-hidden" htmlFor={id}>
        {t('language.label')}
      </label>
      <select
        id={id}
        value={language}
        onChange={(event) => {
          const value = event.currentTarget.value;
          if (isLanguage(value)) setLanguage(value);
        }}
      >
        {Object.entries(LANGUAGES).map(([code, entry]) => (
          <option key={code} value={code} lang={code}>
            {entry.label}
          </option>
        ))}
      </select>
    </div>
  );
}