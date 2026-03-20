import { useState, useCallback } from 'react';
import { Outlet, useLocation, useParams } from 'react-router-dom';
import { MobileHeader } from './MobileHeader';
import { BottomTabBar } from './BottomTabBar';
import { QuickCreateSheet } from './QuickCreateSheet';
import { useIsMobile } from '@/hooks/useDeviceType';
import { DevBanner } from '@/components/DevBanner';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Inbox',
  '/local-projects': 'Projects',
};

export function MobileLayout() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const params = useParams();
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);

  const projectId = params.projectId ?? '';

  // Determine page title from route
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

  // Only render mobile layout on mobile screens
  if (!isMobile) return null;

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
        className="flex-1 overflow-auto pt-11 pb-16"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 44px)',
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
