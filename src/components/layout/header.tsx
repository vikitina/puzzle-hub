import { useCallback, useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { PUZZLES } from '../../config/puzzles';
import { useTranslation } from '../../i18n/use-translation';
import { usePreferences } from '../../preferences/use-preferences';
import LanguageSwitcher from '../settings/language-switcher';
import ThemeSwitcher from '../settings/theme-switcher';
import styles from './header.module.scss';

function PuzzleNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const { linkTo } = usePreferences();

  return (
    <nav className={styles.navigation} aria-label={t('navigation.label')}>
      <ul>
        {PUZZLES.map((puzzle) => (
          <li key={puzzle.id}>
            <NavLink to={linkTo(`/${puzzle.id}`)} onClick={onNavigate}>
              {t(puzzle.titleKey)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function Header() {
  const { t } = useTranslation();
  const { linkTo } = usePreferences();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const summaryRef = useRef<HTMLElement>(null);
  const desktopNavigationRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback((restoreFocus = false) => {
    if (!detailsRef.current?.open) return;
    detailsRef.current.open = false;
    if (restoreFocus) summaryRef.current?.focus();
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1200px)');
    const onMediaChange = () => {
      if (!media.matches) return;
      const moveFocus = detailsRef.current?.contains(document.activeElement);
      closeMenu();

      if (moveFocus) {
        const navigation = desktopNavigationRef.current;
        const link =
          navigation?.querySelector<HTMLAnchorElement>('a[aria-current="page"]') ??
          navigation?.querySelector<HTMLAnchorElement>('a');
        link?.focus();
      }
    };
    const onPopState = () => closeMenu(true);
    const onPointerDown = (event: PointerEvent) => {
      const details = detailsRef.current;
      if (
        details?.open &&
        event.target instanceof Node &&
        !details.contains(event.target)
      ) {
        closeMenu(details.contains(document.activeElement));
      }
    };

    media.addEventListener('change', onMediaChange);
    window.addEventListener('popstate', onPopState);
    document.addEventListener('pointerdown', onPointerDown);

    return () => {
      media.removeEventListener('change', onMediaChange);
      window.removeEventListener('popstate', onPopState);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [closeMenu]);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link className={styles.logo} to={linkTo('/')} onClick={() => closeMenu(true)}>
          {t('app.name')}
        </Link>

        <div className={styles.desktopNavigation} ref={desktopNavigationRef}>
          <PuzzleNavigation />
        </div>

        <div className={styles.actions}>
          <div className={styles.desktopLanguage}>
            <LanguageSwitcher />
          </div>
          <ThemeSwitcher />

          <details
            className={styles.mobileMenu}
            ref={detailsRef}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                closeMenu(true);
              }
            }}
          >
            <summary ref={summaryRef} className={styles.menuButton}>
              <Menu size={20} className={styles.menuIcon} aria-hidden="true" />
              <X size={20} className={styles.closeIcon} aria-hidden="true" />
              <span className="visually-hidden">{t('navigation.menu')}</span>
            </summary>

            <div className={styles.mobilePanel}>
              <PuzzleNavigation onNavigate={() => closeMenu(true)} />
              <LanguageSwitcher />
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}