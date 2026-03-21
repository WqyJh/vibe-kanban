import { useState, useCallback } from 'react';
import {
  Outlet,
  useSearchParams,
  useLocation,
  useParams,
} from 'react-router-dom';
import { DevBanner } from '@/components/DevBanner';
import { Navbar } from '@/components/layout/Navbar';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomTabBar } from '@/components/mobile/BottomTabBar';
import { QuickCreateSheet } from '@/components/mobile/QuickCreateSheet';
import { useIsMobile } from '@/hooks/useDeviceType';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Vibe Kanban',
  '/local-projects': 'Projects',
};

export function NormalLayout() {
  const [searchParams] = useSearchParams();
  const view = searchParams.get('view');
  const shouldHideNavbar = view === 'preview' || view === 'diffs';
  const isMobile = useIsMobile();
  const location = useLocation();
  const params = useParams();
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);

  const projectId = params.projectId ?? '';

  const getPageTitle = useCallback(() => {
    const path = location.pathname;
    if (PAGE_TITLES[path]) return PAGE_TITLES[path];
    if (path.includes('/tasks')) return 'Tasks';
    if (path.includes('/settings')) return 'Settings';
    return 'Vibe Kanban';
  }, [location.pathname]);

  const handleCreateTask = useCallback(() => {
    if (projectId) {
      setQuickCreateOpen(true);
    }
  }, [projectId]);

  // Mobile layout
  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <DevBanner />
        <MobileHeader
          title={getPageTitle()}
          showBack={
            location.pathname !== '/' && location.pathname !== '/local-projects'
          }
        />
        <main
          className="flex-1 overflow-auto"
          style={{
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 44px)',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 56px)',
          }}
        >
          <Outlet />
        </main>
        <BottomTabBar onCreateTask={handleCreateTask} />
        {projectId && (
          <QuickCreateSheet
            projectId={projectId}
            isOpen={quickCreateOpen}
            onClose={() => setQuickCreateOpen(false)}
          />
        )}
      </div>
    );
  }

  // Desktop layout
  return (
    <>
      <div className="flex flex-col h-screen">
        <DevBanner />
        {!shouldHideNavbar && <Navbar />}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </>
  );
}
