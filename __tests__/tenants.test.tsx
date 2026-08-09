import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TenantsOverview from '../app/(control-plane)/tenants/page';
import { SessionProvider } from '@/lib/session';

vi.mock('@/lib/data', () => ({
  useList: () => ({ data: [], loading: false, error: null }),
  useItem: () => ({ data: null, loading: false, error: null }),
}));

vi.mock('@kannan19302/ui', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    usePermission: () => true,
  };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
}));

describe('TenantsOverview', () => {
  it('renders the overview correctly', () => {
    render(
      <SessionProvider>
        <TenantsOverview />
      </SessionProvider>
    );

    expect(screen.getAllByText('Overview')[0]).toBeInTheDocument();
    expect(screen.getByText(/Tenant registry, KPIs and lifecycle/i)).toBeInTheDocument();
  });
});
