"use client";

import React, { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, Check } from "lucide-react";
import styles from "./onboarding.module.css";

export interface TourStep {
  stepNumber: number;
  title: string;
  description: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    stepNumber: 1,
    title: "Universal Desk Launcher",
    description:
      "Welcome to your Provider Control Center. Access all 22 sovereign PCC domains across Core Operations, Security, Finance, and Platform Governance directly from this desk grid.",
  },
  {
    stepNumber: 2,
    title: "Real-Time Telemetry & Search",
    description:
      "Filter apps effortlessly by domain cluster or search by keyword. Live health telemetry badges indicate operational uptime and pending alerts across all clusters.",
  },
  {
    stepNumber: 3,
    title: "Keyboard Shortcuts & Omni-Palette",
    description:
      "Power operators move fast: press '/' to focus search, single-key shortcuts to open specific consoles, or press Cmd+K anywhere to launch the Command Palette.",
  },
  {
    stepNumber: 4,
    title: "Zero-Trust Security & Multi-Tenancy",
    description:
      "Every administrative mutation is governed by PostgreSQL Row-Level Security, ABAC directives, and immutable outbox event logging. You are ready to manage the enterprise!",
  },
];

export interface SpotlightTourProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export function SpotlightTour({ forceOpen = false, onClose }: SpotlightTourProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      return;
    }
    try {
      const tourCompleted = localStorage.getItem("unierp_spotlight_tour_completed");
      if (!tourCompleted) {
        setIsOpen(true);
      }
    } catch {}
  }, [forceOpen]);

  const handleFinish = () => {
    setIsOpen(false);
    try {
      localStorage.setItem("unierp_spotlight_tour_completed", "true");
    } catch {}
    if (onClose) onClose();
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep] || TOUR_STEPS[0];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  return (
    <div
      className={styles.spotlightBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Platform Guided Tour"
    >
      <div className={styles.spotlightCard}>
        <div className={styles.spotlightHeader}>
          <span className={styles.spotlightStepBadge}>
            Step {step.stepNumber} of {TOUR_STEPS.length}
          </span>
          <button
            type="button"
            className={styles.dismissButton}
            onClick={handleFinish}
            aria-label="Close guided tour"
          >
            <X size={18} />
          </button>
        </div>

        <h3 className={styles.spotlightTitle}>{step.title}</h3>
        <p className={styles.spotlightBody}>{step.description}</p>

        <div className={styles.spotlightFooter}>
          <div className={styles.spotlightDots} aria-hidden="true">
            {TOUR_STEPS.map((s, idx) => (
              <div
                key={s.stepNumber}
                className={`${styles.spotlightDot} ${
                  idx === currentStep ? styles.spotlightDotActive : ""
                }`}
              />
            ))}
          </div>

          <div className={styles.spotlightActions}>
            {currentStep > 0 && (
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={handleBack}
                aria-label="Previous tour step"
              >
                <ChevronLeft size={14} />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              className={styles.btnSecondary}
              onClick={handleFinish}
              aria-label="Skip guided tour"
            >
              Skip
            </button>

            <button
              type="button"
              className={styles.btnPrimary}
              onClick={handleNext}
              aria-label={isLastStep ? "Complete tour" : "Next tour step"}
            >
              <span>{isLastStep ? "Get Started" : "Next"}</span>
              {isLastStep ? <Check size={14} /> : <ChevronRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SpotlightTour;
