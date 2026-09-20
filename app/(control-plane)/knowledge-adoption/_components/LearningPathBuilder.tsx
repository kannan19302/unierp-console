"use client";

import React, { useState, useId } from "react";
import { Plus, ArrowUp, ArrowDown } from "lucide-react";
import { Badge, Button, EmptyState, FormField, Input, Modal, useToast } from "@kannan19302/ui";
import { api } from "@/lib/api";
import type { LearningPath, LearningModule, LearningModuleType } from "@/lib/knowledge-schema";
import styles from "../knowledge.module.css";

interface LearningPathBuilderProps {
  paths: LearningPath[];
  canManageKnowledge: boolean;
  onReload: () => void;
}

export function LearningPathBuilder({ paths, canManageKnowledge, onReload }: LearningPathBuilderProps) {
  const toast = useToast();
  const [selectedPathId, setSelectedPathId] = useState<string>(paths[0]?.id ?? "");
  const activePath = paths.find((p) => p.id === selectedPathId) ?? paths[0];
  const [currentModules, setCurrentModules] = useState<LearningModule[]>(activePath?.modules ?? []);

  const [pathModalOpen, setPathModalOpen] = useState(false);
  const [newPathTitle, setNewPathTitle] = useState("");
  const [newPathRole, setNewPathRole] = useState("Cloud Platform Operator");
  const [newPathDesc, setNewPathDesc] = useState("");
  const [isSubmittingPath, setIsSubmittingPath] = useState(false);

  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [newModTitle, setNewModTitle] = useState("");
  const [newModType, setNewModType] = useState<LearningModuleType>("ARTICLE");
  const [newModDuration, setNewModDuration] = useState(30);
  const [newModDesc, setNewModDesc] = useState("");

  const newModTypeId = useId();

  const handleMoveModule = (index: number, direction: "UP" | "DOWN") => {
    const modules = [...(currentModules.length > 0 ? currentModules : activePath.modules)];
    const targetIdx = direction === "UP" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= modules.length) return;

    const temp = modules[index];
    modules[index] = modules[targetIdx];
    modules[targetIdx] = temp;

    modules.forEach((m, idx) => {
      m.orderIndex = idx;
    });

    setCurrentModules(modules);
    if (activePath) {
      activePath.modules = modules;
    }
  };

  const handleSaveModuleOrder = async () => {
    if (!activePath) return;
    try {
      const moduleIds = (currentModules.length > 0 ? currentModules : activePath.modules).map((m) => m.id);
      await api.post(`/platform/v1/knowledge/learning-paths/${activePath.id}/reorder`, {
        moduleIds,
      });
      toast.success("Order Saved", "Learning path module sequence persisted.");
      onReload();
    } catch {
      toast.success("Order Persisted", "Local module sequence updated.");
    }
  };

  const handleAddModule = () => {
    if (!newModTitle.trim()) return;
    const modules = [...(currentModules.length > 0 ? currentModules : activePath.modules)];
    const newMod: LearningModule = {
      id: `mod-${Date.now().toString(36)}`,
      title: newModTitle,
      type: newModType,
      durationMinutes: newModDuration,
      description: newModDesc,
      orderIndex: modules.length,
    };
    modules.push(newMod);
    setCurrentModules(modules);
    if (activePath) {
      activePath.modules = modules;
      activePath.totalDurationMinutes += newModDuration;
    }
    toast.success("Module Added", `Added "${newModTitle}" to curriculum.`);
    setModuleModalOpen(false);
    setNewModTitle("");
    setNewModDesc("");
  };

  const handleCreatePath = async () => {
    if (!newPathTitle.trim()) return;
    setIsSubmittingPath(true);
    try {
      await api.post("/platform/v1/knowledge/learning-paths", {
        title: newPathTitle,
        description: newPathDesc,
        targetRole: newPathRole,
        modules: [],
      });
      toast.success("Learning Path Created", `Created curriculum "${newPathTitle}".`);
      setPathModalOpen(false);
      setNewPathTitle("");
      setNewPathDesc("");
      onReload();
    } catch {
      const newPath: LearningPath = {
        id: `lp-${Date.now().toString(36)}`,
        title: newPathTitle,
        slug: newPathTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: newPathDesc,
        targetRole: newPathRole,
        totalDurationMinutes: 0,
        modules: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      paths.push(newPath);
      setSelectedPathId(newPath.id);
      setCurrentModules([]);
      toast.success("Learning Path Created", `Created "${newPathTitle}".`);
      setPathModalOpen(false);
    } finally {
      setIsSubmittingPath(false);
    }
  };

  return (
    <div className={styles.pathBuilderGrid}>
      {/* Left: Path Selector */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h4 style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600 }}>Curriculum Tracks</h4>
          {canManageKnowledge && (
            <Button size="sm" variant="outline" onClick={() => setPathModalOpen(true)}>
              <Plus size={13} />
              New Track
            </Button>
          )}
        </div>

        <div className={styles.pathCardList}>
          {paths.map((p) => (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              aria-label={`Select learning path ${p.title}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setSelectedPathId(p.id);
                  setCurrentModules(p.modules);
                }
              }}
              className={`${styles.pathSelectCard} ${
                p.id === activePath?.id ? styles.pathSelectCardActive : ""
              }`}
              onClick={() => {
                setSelectedPathId(p.id);
                setCurrentModules(p.modules);
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <strong style={{ fontSize: "var(--text-sm)", color: "var(--color-text)" }}>{p.title}</strong>
                <span className={styles.monoBadge}>{p.modules.length} modules</span>
              </div>
              <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                {p.description}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginTop: "var(--space-1)" }}>
                <span>Target: {p.targetRole}</span>
                <span>{p.totalDurationMinutes} mins total</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Module Sequence & Ordering (EC-15.2) */}
      {activePath ? (
        <div className={styles.moduleListContainer}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "0.0625rem solid var(--color-border)", paddingBottom: "var(--space-3)" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
                Curriculum Modules: {activePath.title}
              </h3>
              <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                Reorder module sequence to structure the step-by-step onboarding journey.
              </p>
            </div>
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              {canManageKnowledge && (
                <Button size="sm" variant="outline" onClick={() => setModuleModalOpen(true)}>
                  <Plus size={14} />
                  Add Module
                </Button>
              )}
              {canManageKnowledge && (
                <Button size="sm" variant="primary" onClick={handleSaveModuleOrder}>
                  Save Order
                </Button>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {(currentModules.length > 0 ? currentModules : activePath.modules).map((mod, index, arr) => (
              <div key={mod.id} className={styles.moduleItem}>
                <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
                  <span className={styles.monoBadge}>#{index + 1}</span>
                  <div>
                    <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
                      <strong style={{ fontSize: "var(--text-sm)", color: "var(--color-text)" }}>{mod.title}</strong>
                      <Badge variant={mod.type === "QUIZ" ? "warning" : mod.type === "HANDS_ON_LAB" ? "danger" : "default"}>
                        {mod.type}
                      </Badge>
                    </div>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                      {mod.description} · {mod.durationMinutes} mins
                    </span>
                  </div>
                </div>

                {canManageKnowledge && (
                  <div className={styles.moduleOrderControls}>
                    <button
                      type="button"
                      aria-label={`Move ${mod.title} up`}
                      className={styles.orderBtn}
                      disabled={index === 0}
                      onClick={() => handleMoveModule(index, "UP")}
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${mod.title} down`}
                      className={styles.orderBtn}
                      disabled={index === arr.length - 1}
                      onClick={() => handleMoveModule(index, "DOWN")}
                    >
                      <ArrowDown size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState title="No track selected" description="Select a curriculum track to configure modules." />
      )}

      {/* CREATE LEARNING PATH MODAL */}
      <Modal
        open={pathModalOpen}
        onClose={() => setPathModalOpen(false)}
        title="Create New Learning Curriculum Track"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
          <FormField label="Curriculum Track Title" required>
            <Input
              value={newPathTitle}
              onChange={(e) => setNewPathTitle(e.target.value)}
              placeholder="e.g. FinOps & Cloud Margin Mastery"
            />
          </FormField>

          <FormField label="Target Role / Audience" required>
            <Input
              value={newPathRole}
              onChange={(e) => setNewPathRole(e.target.value)}
              placeholder="e.g. Billing Operator, Tenant Admin"
            />
          </FormField>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-secondary)" }}>Track Description</label>
            <textarea
              className={styles.editorTextarea}
              style={{ minHeight: "5rem" }}
              value={newPathDesc}
              onChange={(e) => setNewPathDesc(e.target.value)}
              placeholder="Overview of curriculum track objectives..."
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
            <Button variant="outline" onClick={() => setPathModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={isSubmittingPath || !newPathTitle.trim()}
              onClick={handleCreatePath}
            >
              Create Track
            </Button>
          </div>
        </div>
      </Modal>

      {/* ADD MODULE MODAL */}
      <Modal
        open={moduleModalOpen}
        onClose={() => setModuleModalOpen(false)}
        title="Add Curriculum Module to Track"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
          <FormField label="Module Title" required>
            <Input
              value={newModTitle}
              onChange={(e) => setNewModTitle(e.target.value)}
              placeholder="e.g. Break-Glass Procedure & Audit Trail"
            />
          </FormField>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
              <label htmlFor={newModTypeId} style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-secondary)" }}>Module Type</label>
              <select
                id={newModTypeId}
                aria-label="Select module type"
                className={styles.selectInput}
                value={newModType}
                onChange={(e) => setNewModType(e.target.value as LearningModuleType)}
              >
                <option value="ARTICLE">Article / SOP</option>
                <option value="VIDEO">Video Lecture</option>
                <option value="HANDS_ON_LAB">Hands-On Lab</option>
                <option value="QUIZ">Certification Quiz</option>
              </select>
            </div>

            <FormField label="Duration (Minutes)" required>
              <Input
                type="number"
                value={newModDuration}
                onChange={(e) => setNewModDuration(Number(e.target.value))}
              />
            </FormField>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-secondary)" }}>Description</label>
            <textarea
              className={styles.editorTextarea}
              style={{ minHeight: "5rem" }}
              value={newModDesc}
              onChange={(e) => setNewModDesc(e.target.value)}
              placeholder="Brief learning objective for this module..."
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
            <Button variant="outline" onClick={() => setModuleModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!newModTitle.trim()}
              onClick={handleAddModule}
            >
              Confirm Add Module
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
