import React from 'react';
import Link from 'next/link';
import styles from '../../components/component_styles/Dashboard.module.css';

interface SectionHeaderProps {
  title: string;
  linkHref: string;
  linkText: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, linkHref, linkText }) => {
  return (
    <div className={styles.sectionHeader}>
      <h2>{title}</h2>
      <Link href={linkHref} className={styles.seeMoreButton}>
        <span>{linkText}</span>
        <i className="fa-regular fa-arrow-right"></i>
      </Link>
    </div>
  );
};

export default SectionHeader;