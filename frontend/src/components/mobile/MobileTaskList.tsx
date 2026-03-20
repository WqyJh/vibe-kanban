import { useCallback, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader2 } from 'lucide-react';
import type { TaskStatus, TaskWithAttemptStatus } from 'shared/types';
import { SwipeableTaskCard } from './SwipeableTaskCard';
import { cn } from '@/lib/utils';
import { paths } from '@/lib/paths';
import { useTaskMutations } from '@/hooks/useTaskMutations';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

const STATUS_TABS: { id: TaskStatus | 'all'; labelKey: string; defaultLabel: string }[] = [
  { id: 'all', labelKey: 'tabs.all', defaultLabel: 'All' },
  { id: 'todo', labelKey: 'tabs.todo', defaultLabel: 'Todo' },
  { id: 'inprogress', labelKey: 'tabs.inprogress', defaultLabel: 'In Progress' },
  { id: 'inreview', labelKey: 'tabs.inreview', defaultLabel: 'In Review' },
  { id: 'done', labelKey: 'tabs.done', defaultLabel: 'Done' },
];

interface MobileTaskListProps {
  tasks: TaskWithAttemptStatus[];
  tasksByStatus: Record<TaskStatus, TaskWithAttemptStatus[]>;
  isLoading: boolean;
  projectId: string;
  onCreateTask?: () => void;
}

export function MobileTaskList({
  tasks,
  tasksByStatus,
  isLoading,
  projectId,
  onCreateTask,
}: MobileTaskListProps) {
  const { t } = useTranslation('tasks');
  const navigate = useNavigate();
  const { updateTask } = useTaskMutations(projectId);
  const [activeTab, setActiveTab] = useState<TaskStatus | 'all'>('all');

  const filteredTasks = useMemo(() => {
    if (activeTab === 'all') return tasks;
    return tasksByStatus[activeTab] ?? [];
  }, [activeTab, tasks, tasksByStatus]);

  const handleTaskClick = useCallback(
    (task: TaskWithAttemptStatus) => {
      navigate(paths.task(projectId, task.id));
    },
    [navigate, projectId]
  );

  const handleSwipeLeft = useCallback(
    (task: TaskWithAttemptStatus) => {
      const STATUS_ORDER: TaskStatus[] = ['todo', 'inprogress', 'inreview', 'done', 'cancelled'];
      const idx = STATUS_ORDER.indexOf(task.status);
      if (idx >= 0 && idx < STATUS_ORDER.length - 1) {
        updateTask.mutate({
          taskId: task.id,
          data: { status: STATUS_ORDER[idx + 1] },
        });
      }
    },
    [updateTask]
  );

  const handleSwipeRight = useCallback(
    (task: TaskWithAttemptStatus) => {
      if (task.status === 'todo' || task.status === 'cancelled') {
        updateTask.mutate({
          taskId: task.id,
          data: { status: 'inprogress' },
        });
      }
    },
    [updateTask]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Status tabs */}
      <div className="flex items-center gap-1 px-3 py-2 border-b overflow-x-auto scrollbar-none">
        {STATUS_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count =
            tab.id === 'all'
              ? tasks.length
              : (tasksByStatus[tab.id] ?? []).length;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              <span>{t(tab.labelKey, { defaultValue: tab.defaultLabel })}</span>
              <span
                className={cn(
                  'inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] px-1',
                  isActive
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-background/80 text-muted-foreground'
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredTasks.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <p className="text-sm text-muted-foreground mb-4">
                {t('empty.noTasks', { defaultValue: 'No tasks yet' })}
              </p>
              {onCreateTask && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCreateTask}
                  className="gap-1.5"
                >
                  <Plus size={16} />
                  {t('actions.create', { defaultValue: 'Create task' })}
                </Button>
              )}
            </motion.div>
          ) : (
            filteredTasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <SwipeableTaskCard
                  task={task}
                  onClick={handleTaskClick}
                  onSwipeLeft={handleSwipeLeft}
                  onSwipeRight={handleSwipeRight}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
