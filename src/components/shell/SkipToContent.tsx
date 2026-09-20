"use client";

import React from "react";
import styles from "./SkipToContent.module.css";

export interface SkipToContentProps {
  targetId?: string;
  label?: string;
}

export function SkipToContent({
  targetId = "provider-main",
  label = "Skip to main content",
}: SkipToContentProps) {
  return (
    <a href={`#${targetId}`} className={styles.skipLink}>
      {label}
    </a>
  );
}

export default SkipToContent;
