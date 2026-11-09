import { Link, useParams } from 'react-router-dom';
import { PUZZLES } from '../config/puzzles';
import { useTranslation } from '../i18n/use-translation';
import { usePreferences } from '../preferences/use-preferences';
import styles from './pages.module.scss';

export function NotFoundPage() {
  const { t } = useTranslation();
  const { linkTo } = usePreferences();

  return (
    <section>
      <h1>{t('notFound.title')}</h1>
      <p>{t('notFound.description')}</p>
      <Link className={styles.link} to={linkTo('/')}>
        {t('common.back')}
      </Link>
    </section>
  );
}

export default function PuzzleInfoPage() {
  const { puzzleId } = useParams();
  const { t } = useTranslation();
  const { linkTo } = usePreferences();
  const puzzle = PUZZLES.find((entry) => entry.id === puzzleId);

  if (!puzzle) return <NotFoundPage />;

  return (
    <section>
      <p className="eyebrow">{t('common.comingSoon')}</p>
      <h1>{t(puzzle.titleKey)}</h1>
      <p className={styles.description}>{t(puzzle.descriptionKey)}</p>
      <Link className={styles.link} to={linkTo('/')}>
        {t('common.back')}
      </Link>
    </section>
  );
}