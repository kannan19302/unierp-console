"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, File, X } from "lucide-react";
import styles from "./FileUpload.module.css";

export interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  maxSizeBytes?: number; // default 10MB
  multiple?: boolean;
  disabled?: boolean;
}

export function FileUpload({
  onFilesSelected,
  accept,
  maxSizeBytes = 10 * 1024 * 1024,
  multiple = false,
  disabled = false,
}: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return;
    setError(null);

    const valid: File[] = [];
    for (let i = 0; i < incoming.length; i++) {
      const f = incoming[i];
      if (f.size > maxSizeBytes) {
        setError(`File "${f.name}" exceeds maximum allowed size of ${(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB.`);
        return;
      }
      valid.push(f);
      if (!multiple) break;
    }

    const next = multiple ? [...selectedFiles, ...valid] : valid;
    setSelectedFiles(next);
    onFilesSelected(next);
  };

  const handleRemove = (index: number) => {
    const next = selectedFiles.filter((_, idx) => idx !== index);
    setSelectedFiles(next);
    onFilesSelected(next);
  };

  return (
    <div>
      <div
        className={`${styles.dropzone} ${dragOver ? styles.dragOver : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!disabled) handleFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          className={styles.hiddenInput}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={(e) => handleFiles(e.target.files)}
          aria-label="Upload file"
        />
        <UploadCloud size={32} className={styles.icon} />
        <div className={styles.primaryText}>
          Drag and drop files here, or <span style={{ color: "var(--color-primary, #2563eb)" }}>browse</span>
        </div>
        <div className={styles.subText}>
          Max file size: {(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB
        </div>
      </div>

      {error && <div className={styles.errorText} role="alert">{error}</div>}

      {selectedFiles.length > 0 && (
        <div className={styles.fileList}>
          {selectedFiles.map((file, idx) => (
            <div key={`${file.name}-${idx}`} className={styles.fileItem}>
              <div className={styles.fileInfo}>
                <File size={14} />
                <span className={styles.fileName}>{file.name}</span>
                <span className={styles.fileSize}>({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
              <button
                type="button"
                className={styles.removeButton}
                onClick={() => handleRemove(idx)}
                aria-label={`Remove ${file.name}`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
