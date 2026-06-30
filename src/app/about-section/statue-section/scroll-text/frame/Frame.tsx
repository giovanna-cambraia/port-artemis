import React from 'react';
import styles from './Frame.module.css';

interface FrameProps {
  title?: string;
  archiveLink?: string;
  githubLink?: string;
  tags?: string[];
  demos?: React.ReactNode;
  sponsor?: React.ReactNode;
}

export const Frame: React.FC<FrameProps> = ({
  title = 'GSAP',
  archiveLink = '#',
  githubLink = '#',
  tags = [],
  demos,
  sponsor,
}) => {
  return (
    <div className={styles.frame}>
      <div className={styles.frame__title}>{title}</div>
      <a href={archiveLink} className={styles.frame__archive}>
        Archive
      </a>
      <a href={githubLink} className={styles.frame__github}>
        GitHub
      </a>
      {tags.length > 0 && (
        <div className={styles.frame__tags}>
          {tags.map((tag, index) => (
            <span key={index}>{tag}</span>
          ))}
        </div>
      )}
      {demos && <div className={styles.frame__demos}>{demos}</div>}
      {sponsor && <div className={styles.frame__sponsor}>{sponsor}</div>}
    </div>
  );
};