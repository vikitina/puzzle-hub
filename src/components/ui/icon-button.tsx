import type { ComponentPropsWithoutRef } from 'react';
import styles from './icon-button.module.scss';

type Props = ComponentPropsWithoutRef<'button'> & { label: string };

export default function IconButton({ label, className = '', children, ...props }: Props) {
  return (
    <button
      {...props}
      type={props.type ?? 'button'}
      aria-label={label}
      title={label}
      className={`${styles.button} ${className}`}
    >
      {children}
    </button>
  );
}