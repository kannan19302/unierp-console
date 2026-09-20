"use client";

import { Terminal } from "lucide-react";
import { Badge, Button } from "@kannan19302/ui";
import styles from "../mobile.module.css";
import type { MobileBuild } from "@/lib/mobile-schema";

interface BuildArchiveProps {
  buildsList: MobileBuild[];
  onSelectBuildForLog: (build: MobileBuild) => void;
}

export function BuildArchive({
  buildsList,
  onSelectBuildForLog,
}: BuildArchiveProps) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Build ID</th>
            <th className={styles.th}>Platform</th>
            <th className={styles.th}>Version / Build #</th>
            <th className={styles.th}>Commit / Branch</th>
            <th className={styles.th}>Size</th>
            <th className={styles.th}>Status</th>
            <th className={styles.th}>Action</th>
          </tr>
        </thead>
        <tbody>
          {buildsList.map((b) => (
            <tr key={b.id} className={styles.tr}>
              <td className={styles.td}>
                <span className={styles.monoBadge}>{b.id}</span>
              </td>
              <td className={styles.td}>
                <strong>{b.platform.toUpperCase()}</strong>
              </td>
              <td className={styles.td}>
                <strong>v{b.version}</strong> (#{b.buildNumber})
              </td>
              <td className={styles.td}>
                <span className={styles.monoBadge}>{b.commitHash}</span> ({b.branch})
              </td>
              <td className={styles.td}>{b.artifactSizeMb} MB</td>
              <td className={styles.td}>
                <Badge
                  variant={
                    b.status === "PUBLISHED"
                      ? "success"
                      : b.status === "READY"
                        ? "primary"
                        : "warning"
                  }
                >
                  {b.status}
                </Badge>
              </td>
              <td className={styles.td}>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onSelectBuildForLog(b)}
                >
                  <Terminal size={13} />
                  Logs
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
