import React from 'react';
import styles from './Grid.module.css';

interface GridItem {
  id: string | number;
  title: string;
  imageUrl: string;
  link?: string;
}

interface GridProps {
  items: GridItem[];
  columns?: number;
  className?: string;
}

export const Grid: React.FC<GridProps> = ({
  items,
  columns = 4,
  className,
}) => {
  return (
    <div
      className={`${styles.grid} ${className || ''}`}
      style={{ '--grid-columns': columns } as React.CSSProperties}
    >
      {items.map((item) => (
        <a
          key={item.id}
          href={item.link || '#'}
          className={styles.grid__item}
        >
          <div
            className={styles['grid__item-img']}
            style={{ backgroundImage: `url(${item.imageUrl})` }}
          />
          <div className={styles['grid__item-title']}>{item.title}</div>
        </a>
      ))}
    </div>
  );
};