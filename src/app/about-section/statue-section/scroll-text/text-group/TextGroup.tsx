import React from "react";
import styles from "./TextGroup.module.css";

interface TextItem {
  text: string;
  position: string;
  altPosition?: string;
  isLarge?: boolean;
  flipEase?: string;
  scrambleDuration?: number;
}

interface TextGroupProps {
  items: TextItem[];
  className?: string;
}

export const TextGroup: React.FC<TextGroupProps> = ({ items, className }) => {
  return (
    <div className={`${styles.group} ${className || ""}`}>
      {items.map((item, index) => (
        <div
          key={index}
          className={`
            ${styles.el} 
            ${item.isLarge ? styles["el--xl"] : ""} 
            ${styles[item.position] || ""}
          `}
          data-alt-pos={item.altPosition || item.position}
          data-flip-ease={item.flipEase || "expo.inOut"}
          data-scramble-duration={item.scrambleDuration || 1}
        >
          {item.text}
        </div>
      ))}
    </div>
  );
};
