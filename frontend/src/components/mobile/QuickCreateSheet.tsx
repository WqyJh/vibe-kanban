import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTaskMutations } from '@/hooks/useTaskMutations';
import { useTranslation } from 'react-i18next';

interface QuickCreateSheetProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickCreateSheet({
  projectId,
  isOpen,
  onClose,
}: QuickCreateSheetProps) {
  const { t } = useTranslation('tasks');
  const { createTask } = useTaskMutations(projectId);
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      // Focus after animation
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) return;

    createTask.mutate(
      {
        title: title.trim(),
        project_id: projectId,
        description: null,
        status: null,
        parent_workspace_id: null,
        image_ids: null,
      },
      {
        onSuccess: () => {
          setTitle('');
          onClose();
        },
      }
    );
  }, [title, projectId, createTask, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [handleSubmit, onClose]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50',
              'bg-background rounded-t-2xl border-t shadow-lg',
              'safe-area-bottom'
            )}
            style={{
              paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)',
            }}
          >
            {/* Handle */}
            <div className="flex justify-center py-2">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-primary" />
                <h2 className="text-base font-semibold">
                  {t('quickCreate.title', { defaultValue: 'Quick Create' })}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Input */}
            <div className="px-4 pb-4">
              <div className="flex items-end gap-2 bg-muted/50 rounded-xl p-3">
                <textarea
                  ref={inputRef}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('quickCreate.placeholder', {
                    defaultValue: 'Describe your task...',
                  })}
                  rows={2}
                  className={cn(
                    'flex-1 resize-none bg-transparent text-sm',
                    'placeholder:text-muted-foreground',
                    'focus:outline-none',
                    'min-h-[48px] max-h-[120px]'
                  )}
                />
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!title.trim() || createTask.isPending}
                  className="shrink-0 h-9 w-9 p-0 rounded-full"
                >
                  {createTask.isPending ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 1,
                        ease: 'linear',
                      }}
                    >
                      <Send size={16} />
                    </motion.div>
                  ) : (
                    <Send size={16} />
                  )}
                </Button>
              </div>

              <p className="text-[11px] text-muted-foreground mt-2 px-1">
                {t('quickCreate.hint', {
                  defaultValue: 'Press Enter to create and start, Esc to close',
                })}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
