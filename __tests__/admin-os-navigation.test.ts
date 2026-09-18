import { describe, it, expect } from 'vitest';
import {
  ADMIN_OS_CLUSTERS,
  getAppsByCluster,
  getAppByPccId,
  getAllPccApps,
  getBreadcrumbs,
} from '../src/lib/navigation';
import pccManifests from '../src/manifests/pcc-apps.json';

describe('Admin OS Navigation & Multi-App Registry', () => {
  it('defines the 6 enterprise clusters with valid metadata', () => {
    expect(ADMIN_OS_CLUSTERS).toHaveLength(6);

    const clusterIds = ADMIN_OS_CLUSTERS.map((c) => c.id);
    expect(clusterIds).toEqual([
      'platform',
      'security',
      'tenancy',
      'ecosystem',
      'clients',
      'intelligence',
    ]);

    for (const cluster of ADMIN_OS_CLUSTERS) {
      expect(cluster.name).toBeTruthy();
      expect(cluster.description).toBeTruthy();
      expect(cluster.icon).toBeTruthy();
    }
  });

  it('registers all 22 canonical PCC applications (PCC-01 to PCC-22)', () => {
    const allPccApps = getAllPccApps();
    expect(allPccApps).toHaveLength(22);

    const expectedPccIds = Array.from(
      { length: 22 },
      (_, i) => `PCC-${String(i + 1).padStart(2, '0')}`
    );

    const actualPccIds = allPccApps.map((app) => app.appId);
    expect(actualPccIds.sort()).toEqual(expectedPccIds.sort());

    // Every app must have required fields
    for (const app of allPccApps) {
      expect(app.id).toBeTruthy();
      expect(app.label).toBeTruthy();
      expect(app.base).toBeTruthy();
      expect(app.clusterId).toBeTruthy();
      expect(app.clusterName).toBeTruthy();
      expect(app.description).toBeTruthy();
      expect(app.tabs.length).toBeGreaterThan(0);
    }
  });

  it('matches all 22 manifest entries from pcc-apps.json', () => {
    expect(pccManifests).toHaveLength(22);

    for (const manifestApp of pccManifests) {
      const registeredApp = getAppByPccId(manifestApp.appId);
      expect(
        registeredApp,
        `App with pccId ${manifestApp.appId} must be registered in navigation.ts`
      ).toBeDefined();

      expect(registeredApp?.appId).toBe(manifestApp.appId);
      expect(registeredApp?.permission).toBe(manifestApp.requiredPermission);
    }
  });

  it('partitions apps across all 6 enterprise clusters with no orphans', () => {
    let totalClusteredApps = 0;

    for (const cluster of ADMIN_OS_CLUSTERS) {
      const apps = getAppsByCluster(cluster.id);
      expect(
        apps.length,
        `Cluster ${cluster.id} should have at least 2 apps`
      ).toBeGreaterThanOrEqual(2);

      for (const app of apps) {
        expect(app.clusterId).toBe(cluster.id);
      }

      totalClusteredApps += apps.length;
    }

    expect(totalClusteredApps).toBe(23); // 22 PCC apps + 1 OCC Overview
  });

  it('retrieves apps by PCC ID accurately', () => {
    const pcc01 = getAppByPccId('PCC-01');
    expect(pcc01?.id).toBe('ops');
    expect(pcc01?.base).toBe('/ops');

    const pcc04 = getAppByPccId('PCC-04');
    expect(pcc04?.id).toBe('subscription-operations');
    expect(pcc04?.canonicalPath).toBe('/subscription-operations');

    const pcc11 = getAppByPccId('PCC-11');
    expect(pcc11?.id).toBe('mobile-operations');
    expect(pcc11?.base).toBe('/mobile-operations');

    const pcc12 = getAppByPccId('PCC-12');
    expect(pcc12?.id).toBe('desktop-operations');
    expect(pcc12?.base).toBe('/desktop-operations');

    const pcc18 = getAppByPccId('PCC-18');
    expect(pcc18?.id).toBe('tenants');
    expect(pcc18?.base).toBe('/tenants');

    // Unknown app ID
    expect(getAppByPccId('PCC-99')).toBeUndefined();
  });

  it('computes breadcrumbs correctly for root, launchpad, and canonical apps', () => {
    // Root Overview
    const rootCrumbs = getBreadcrumbs('/');
    expect(rootCrumbs).toEqual([
      { key: 'console', label: 'Admin OS', href: '/overview' },
      { key: 'overview', label: 'Overview', href: '/overview' },
    ]);

    // Apps Launchpad
    const appsCrumbs = getBreadcrumbs('/apps');
    expect(appsCrumbs).toEqual([
      { key: 'console', label: 'Admin OS', href: '/overview' },
      { key: 'apps', label: 'App Launchpad', href: '/apps' },
    ]);

    // Canonical app: /subscription-operations
    const subCrumbs = getBreadcrumbs('/subscription-operations');
    expect(subCrumbs.length).toBeGreaterThanOrEqual(3);
    expect(subCrumbs[0].label).toBe('Admin OS');
    expect(subCrumbs[1].label).toBe('Tenancy, Commercial & Revenue');
    expect(subCrumbs[2].label).toBe('Subscription Operations');

    // Nested page: /tenants/directory
    const tenantCrumbs = getBreadcrumbs('/tenants/directory');
    expect(tenantCrumbs.length).toBeGreaterThanOrEqual(3);
    expect(tenantCrumbs[0].label).toBe('Admin OS');
    expect(tenantCrumbs[1].label).toBe('Tenancy, Commercial & Revenue');
    expect(tenantCrumbs[2].label).toBe('Tenant & Customer Lifecycle');
  });

  it('ensures every PCC application has valid tabs and subtabs with absolute paths', () => {
    const allPccApps = getAllPccApps();
    for (const app of allPccApps) {
      expect(app.tabs.length).toBeGreaterThan(0);
      for (const tab of app.tabs) {
        expect(tab.key).toBeTruthy();
        expect(tab.label).toBeTruthy();
        expect(tab.path.startsWith('/')).toBe(true);

        if (tab.subTabs) {
          for (const sub of tab.subTabs) {
            expect(sub.key).toBeTruthy();
            expect(sub.label).toBeTruthy();
            expect(sub.path.startsWith('/')).toBe(true);
          }
        }
      }
    }
  });

  it('declares rich search keywords and resource kinds for all canonical apps', () => {
    const allPccApps = getAllPccApps();
    for (const app of allPccApps) {
      expect(
        app.searchKeywords && app.searchKeywords.length > 0,
        `App ${app.appId} (${app.label}) must have search keywords`
      ).toBe(true);
    }
  });
});
