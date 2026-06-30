import React, { forwardRef } from 'react';
import styles from './Related.module.css';

interface RelatedProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Related = forwardRef<HTMLDivElement, RelatedProps>(
  ({ title = 'Related demos', children, className }, ref) => {
    return (
      <div className={`${styles.related} ${className || ''}`} ref={ref}>
        <p>{title}</p>
        {children}
      </div>
    );
  }
);

Related.displayName = 'Related';