import { Link } from 'react-router-dom';
import { PUZZLES } from '../config/puzzles';
import { useTranslation } from '../i18n/use-translation';
import { usePreferences } from '../preferences/use-preferences';
import styles from './pages.module.scss';

export default function HomePage() {
  const { t } = useTranslation();
  const { linkTo } = usePreferences();

  return (
    <section>
      <p className="eyebrow">{t('app.name')}</p>
      <h1>{t('home.title')}</h1>
      <p className={styles.description}>{t('home.description')}</p>

      <div className={styles.cards}>
        {PUZZLES.map((puzzle) => (
          <article key={puzzle.id} className={styles.card}>
            <h2>{t(puzzle.titleKey)}</h2>
            <p>{t(puzzle.descriptionKey)}</p>
            <Link className={styles.link} to={linkTo(`/${puzzle.id}`)}>
              {t(puzzle.available ? 'common.open' : 'common.comingSoon')}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}