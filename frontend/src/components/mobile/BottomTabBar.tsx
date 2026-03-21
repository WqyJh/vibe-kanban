import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, FolderKanban, Plus, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TabItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  path: string;
  matchPaths?: string[];
  isAction?: boolean;
}

const tabs: TabItem[] = [
  {
    id: 'inbox',
    icon: <Home size={22} />,
    label: 'Inbox',
    path: '/',
    matchPaths: ['/'],
  },
  {
    id: 'projects',
    icon: <FolderKanban size={22} />,
    label: 'Projects',
    path: '/local-projects',
    matchPaths: ['/local-projects'],
  },
  {
    id: 'create',
    icon: <Plus size={22} />,
    label: 'Create',
    path: '',
    isAction: true,
  },
  {
    id: 'profile',
    icon: <User size={22} />,
    label: 'Settings',
    path: '/settings/general',
    matchPaths: ['/settings'],
  },
];

interface BottomTabBarProps {
  onCreateTask?: () => void;
}

export function BottomTabBar({ onCreateTask }: BottomTabBarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = useCallback(
    (tab: TabItem) => {
      if (tab.isAction) return false;
      const paths = tab.matchPaths || [tab.path];
      return paths.some(
        (p) => location.pathname === p || location.pathname.startsWith(p + '/')
      );
    },
    [location.pathname]
  );

  const handleTabClick = useCallback(
    (tab: TabItem) => {
      if (tab.isAction && onCreateTask) {
        onCreateTask();
        return;
      }
      if (tab.path) {
        navigate(tab.path);
      }
    },
    [navigate, onCreateTask]
  );

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t safe-area-bottom"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      role="tablist"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const active = isActive(tab);
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                tab.isAction
                  ? 'text-primary'
                  : active
                    ? 'text-primary'
                    : 'text-muted-foreground'
              )}
              role="tab"
              aria-selected={active}
              aria-label={tab.label}
            >
              {tab.isAction ? (
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground">
                  {tab.icon}
                </div>
              ) : (
                <>
                  <span className={cn('transition-all', active && 'scale-110')}>
                    {tab.icon}
                  </span>
                  <span className="text-[10px] font-medium">{tab.label}</span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
