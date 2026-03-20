import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MobileHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  onSearch?: () => void;
  onMenu?: () => void;
  rightActions?: React.ReactNode;
  className?: string;
}

export function MobileHeader({
  title,
  showBack = false,
  onBack,
  onSearch,
  onMenu,
  rightActions,
  className,
}: MobileHeaderProps) {
  const navigate = useNavigate();

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  }, [onBack, navigate]);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 flex items-center',
        'h-11 px-3 gap-2',
        'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        'border-b',
        className
      )}
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-1 w-12">
        {showBack ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleBack}
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </Button>
        ) : onMenu ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onMenu}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </Button>
        ) : null}
      </div>

      {/* Center */}
      <div className="flex-1 min-w-0 text-center">
        <h1 className="text-sm font-semibold truncate">{title}</h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1 w-12 justify-end">
        {onSearch && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onSearch}
            aria-label="Search"
          >
            <Search size={18} />
          </Button>
        )}
        {rightActions}
      </div>
    </header>
  );
}
