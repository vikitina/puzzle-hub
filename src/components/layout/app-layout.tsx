import { Outlet } from 'react-router-dom';
import { useTranslation } from '../../i18n/use-translation';
import Header from './header';
import styles from './app-layout.module.scss';

export default function AppLayout() {
  const { t } = useTranslation();

  return (
    <div className="app">
      <a className={styles.skipLink} href="#main-content">
        {t('common.skip')}
      </a>
      <Header />
      <main className={`main ${styles.main}`} id="main-content" tabIndex={-1}>
        <div className="container">
          <Outlet />
        </div>
      </main>
      <footer className={styles.footer}>
        <div className="container">
          {t('app.name')} · {t('app.subtitle')}
        </div>
      </footer>
    </div>
  );
}