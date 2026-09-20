import React from "react";

export interface PccIconProps {
  size?: number;
  color?: string;
  className?: string;
}

// 1. PCC-01 Operations — Activity pulse / waveform
export function PccOperationsIcon({ size = 28, color = "#ffffff", className }: PccIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

// 2. PCC-02 Security — Shield with checkmark
export function PccSecurityIcon({ size = 28, color = "#ffffff", className }: PccIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

// 3. PCC-03 Identity/IAM — User circle with key
export function PccIamIcon({ size = 28, color = "#ffffff", className }: PccIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="9" cy="7" r="4" />
      <path d="M2 21v-2a4 4 0 0 1 4-4h6" />
      <circle cx="17" cy="11" r="3" />
      <path d="m21 15-3.086-3.086a3 3 0 0 0-4.242 0" />
      <line x1="19" y1="17" x2="19" y2="19" />
      <line x1="21" y1="19" x2="17" y2="19" />
    </svg>
  );
}

// 4. PCC-04 Subscriptions — Stacked cards / layers
export function PccSubscriptionsIcon({ size = 28, color = "#ffffff", className }: PccIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

// 5. PCC-05 Entitlements — Award badge with star
export function PccEntitlementsIcon({ size = 28, color = "#ffffff", className }: PccIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
      <polygon points="12 5 13.09 7.26 15.5 7.63 13.75 9.35 14.18 11.77 12 10.6 9.82 11.77 10.25 9.35 8.5 7.63 10.91 7.26 12 5" fill={color} />
    </svg>
  );
}

// 6. PCC-06 Billing/Revenue — Credit card & receipt
export function PccBillingIcon({ size = 28, color = "#ffffff", className }: PccIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <line x1="6" y1="15" x2="10" y2="15" />
      <line x1="14" y1="15" x2="18" y2="15" />
    </svg>
  );
}

// 7. PCC-07 Keys & Secrets — Key with lock
export function PccKeysIcon({ size = 28, color = "#ffffff", className }: PccIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M21 2l-2 2m-1.5 1.5L14 9l-1.5-1.5L11 9l-1-1-3 3a5 5 0 1 0 7.07 7.07l3-3-1-1 1.5-1.5L16 10.5 17.5 9l2-2L21 2z" />
      <circle cx="7.5" cy="16.5" r="1.5" />
    </svg>
  );
}

// 8. PCC-08 API Traffic — Network nodes connected
export function PccTrafficIcon({ size = 28, color = "#ffffff", className }: PccIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

// 9. PCC-09 Compliance — Clipboard with checkmark
export function PccComplianceIcon({ size = 28, color = "#ffffff", className }: PccIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <polyline points="9 13 11 15 15 11" />
    </svg>
  );
}

// 10. PCC-10 SOC/Intelligence — Eye with radar sweep
export function PccThreatsIcon({ size = 28, color = "#ffffff", className }: PccIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 9a3 3 0 0 1 3 3" />
    </svg>
  );
}

// 11. PCC-11 Mobile — Smartphone outline
export function PccMobileIcon({ size = 28, color = "#ffffff", className }: PccIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2.5" />
    </svg>
  );
}

// 12. PCC-12 Desktop — Monitor / display outline
export function PccDesktopIcon({ size = 28, color = "#ffffff", className }: PccIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

// 13. PCC-13 Configuration — Sliders / gear
export function PccConfigIcon({ size = 28, color = "#ffffff", className }: PccIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

// 14. PCC-14 Developers — Code brackets </>
export function PccDevelopersIcon({ size = 28, color = "#ffffff", className }: PccIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

// 15. PCC-15 Knowledge — Open book / lightbulb
export function PccKnowledgeIcon({ size = 28, color = "#ffffff", className }: PccIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

// 16. PCC-16 Analytics — Bar chart trending up
export function PccAnalyticsIcon({ size = 28, color = "#ffffff", className }: PccIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <polyline points="4 8 10 2 15 7 20 2" />
    </svg>
  );
}

// 17. PCC-17 Marketplace — Store / shopping bag
export function PccMarketplaceIcon({ size = 28, color = "#ffffff", className }: PccIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
      <path d="M2 7h20" />
    </svg>
  );
}

// 18. PCC-18 Tenants — Building / multi-tenant outline
export function PccTenantsIcon({ size = 28, color = "#ffffff", className }: PccIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <line x1="9" y1="6" x2="9.01" y2="6" strokeWidth="2.5" />
      <line x1="15" y1="6" x2="15.01" y2="6" strokeWidth="2.5" />
      <line x1="9" y1="10" x2="9.01" y2="10" strokeWidth="2.5" />
      <line x1="15" y1="10" x2="15.01" y2="10" strokeWidth="2.5" />
      <line x1="9" y1="14" x2="9.01" y2="14" strokeWidth="2.5" />
      <line x1="15" y1="14" x2="15.01" y2="14" strokeWidth="2.5" />
      <path d="M10 22v-4h4v4" />
    </svg>
  );
}

// 19. PCC-19 Infrastructure — Server rack / cloud
export function PccInfrastructureIcon({ size = 28, color = "#ffffff", className }: PccIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
      <line x1="6" y1="6" x2="6.01" y2="6" strokeWidth="2.5" />
      <line x1="6" y1="18" x2="6.01" y2="18" strokeWidth="2.5" />
    </svg>
  );
}

// 20. PCC-20 Integrations — Puzzle piece interlocking
export function PccIntegrationsIcon({ size = 28, color = "#ffffff", className }: PccIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M19.439 7.85c-.049-.322.059-.648.289-.878l1.568-1.568a1.5 1.5 0 0 0-2.121-2.121l-1.568 1.568a.987.987 0 0 1-.878.289c-.584-.089-1.187.126-1.571.51l-.749.749a2 2 0 0 0-.586 1.414v2a2 2 0 0 1-2 2h-2a2 2 0 0 0-1.414.586l-.749.749c-.384.384-.599.987-.51 1.571.049.322-.059.648-.289.878l-1.568 1.568a1.5 1.5 0 0 0 2.121 2.121l1.568-1.568c.23-.23.556-.338.878-.289.584.089 1.187-.126 1.571-.51l.749-.749a2 2 0 0 0 .586-1.414v-2a2 2 0 0 1 2-2h2a2 2 0 0 0 1.414-.586l.749-.749c.384-.384.599-.987.51-1.571z" />
    </svg>
  );
}

// 21. PCC-21 AI Governance — Brain / neural network
export function PccAiIcon({ size = 28, color = "#ffffff", className }: PccIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 2a4 4 0 0 0-4 4v1a4 4 0 0 0-4 4 4 4 0 0 0 2 3.46V16a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4v-1.54A4 4 0 0 0 20 11a4 4 0 0 0-4-4V6a4 4 0 0 0-4-4z" />
      <path d="M12 6v12" />
      <circle cx="8" cy="11" r="1" fill={color} />
      <circle cx="16" cy="11" r="1" fill={color} />
      <circle cx="12" cy="15" r="1" fill={color} />
    </svg>
  );
}

// 22. PCC-22 Support — Headset / chat
export function PccSupportIcon({ size = 28, color = "#ffffff", className }: PccIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
      <path d="M12 18v2a2 2 0 0 0 2 2h1" />
    </svg>
  );
}
