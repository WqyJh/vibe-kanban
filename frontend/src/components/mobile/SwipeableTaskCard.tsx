import { useCallback, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import {
  Loader2,
  XCircle,
  ArrowRight,
  ChevronRight,
  Play,
  Settings2,
} from 'lucide-react';
import type {
  TaskWithAttemptStatus,
  TaskStatus,
  BaseCodingAgent,
} from 'shared/types';
import { cn } from '@/lib/utils';
import { AgentIcon, getAgentName } from '@/components/agents/AgentIcon';
import { useTranslation } from 'react-i18next';

type Task = TaskWithAttemptStatus;

const SWIPE_THRESHOLD = 80;
const SWIPE_VELOCITY_THRESHOLD = 500;

interface SwipeableTaskCardProps {
  task: Task;
  onSwipeLeft?: (task: Task) => void;
  onSwipeRight?: (task: Task) => void;
  onClick: (task: Task) => void;
  onLongPress?: (task: Task) => void;
}

const STATUS_ORDER: TaskStatus[] = [
  'todo',
  'inprogress',
  'inreview',
  'done',
  'cancelled',
];

function getNextStatus(current: TaskStatus): TaskStatus | null {
  const idx = STATUS_ORDER.indexOf(current);
  if (idx < 0 || idx >= STATUS_ORDER.length - 1) return null;
  return STATUS_ORDER[idx + 1];
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: 'bg-slate-500',
  inprogress: 'bg-blue-500',
  inreview: 'bg-amber-500',
  done: 'bg-emerald-500',
  cancelled: 'bg-muted-foreground',
};

export function SwipeableTaskCard({
  task,
  onSwipeLeft,
  onSwipeRight,
  onClick,
  onLongPress,
}: SwipeableTaskCardProps) {
  const { t } = useTranslation('tasks');
  const x = useMotionValue(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  const nextStatus = getNextStatus(task.status);
  const bgOpacityLeft = useTransform(
    x,
    [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
    [0.3, 0, 0]
  );
  const bgOpacityRight = useTransform(
    x,
    [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
    [0, 0, 0.3]
  );
  const actionOpacityLeft = useTransform(
    x,
    [-SWIPE_THRESHOLD * 1.5, -40, 0],
    [1, 0.5, 0]
  );
  const actionOpacityRight = useTransform(
    x,
    [0, 40, SWIPE_THRESHOLD * 1.5],
    [0, 0.5, 1]
  );

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      setIsSwiping(false);
      const offsetX = info.offset.x;
      const velocityX = info.velocity.x;

      if (offsetX < -SWIPE_THRESHOLD || velocityX < -SWIPE_VELOCITY_THRESHOLD) {
        onSwipeLeft?.(task);
      } else if (
        offsetX > SWIPE_THRESHOLD ||
        velocityX > SWIPE_VELOCITY_THRESHOLD
      ) {
        onSwipeRight?.(task);
      }
    },
    [task, onSwipeLeft, onSwipeRight, nextStatus]
  );

  const handlePointerDown = useCallback(() => {
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      onLongPress?.(task);
    }, 500);
  }, [task, onLongPress]);

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleClick = useCallback(() => {
    if (!longPressTriggered.current && !isSwiping) {
      onClick(task);
    }
  }, [task, onClick, isSwiping]);

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Left swipe background (advance status) */}
      <motion.div
        className="absolute inset-0 flex items-center justify-end pr-5 bg-blue-500/20"
        style={{ opacity: bgOpacityLeft }}
      />
      {/* Right swipe background (run task) */}
      <motion.div
        className="absolute inset-0 flex items-center pl-5 bg-emerald-500/20"
        style={{ opacity: bgOpacityRight }}
      />

      {/* Left action label */}
      <motion.div
        className="absolute inset-y-0 right-0 flex items-center pr-4 gap-1"
        style={{ opacity: actionOpacityLeft }}
      >
        {nextStatus ? (
          <>
            <ArrowRight
              size={16}
              className="text-blue-600 dark:text-blue-400"
            />
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
              {nextStatus}
            </span>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">Done</span>
        )}
      </motion.div>

      {/* Right action label */}
      <motion.div
        className="absolute inset-y-0 left-0 flex items-center pl-4 gap-1"
        style={{ opacity: actionOpacityRight }}
      >
        <Play size={16} className="text-emerald-600 dark:text-emerald-400" />
        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
          {t('actions.start', { defaultValue: 'Start' })}
        </span>
      </motion.div>

      {/* Card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        style={{ x }}
        onDragStart={() => setIsSwiping(true)}
        onDragEnd={handleDragEnd}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={handleClick}
        className={cn(
          'relative bg-background border rounded-lg p-3 cursor-pointer',
          'active:scale-[0.98] transition-transform',
          'hover:bg-accent/50'
        )}
      >
        {/* Status indicator */}
        <div
          className={cn(
            'absolute left-0 top-3 bottom-3 w-[3px] rounded-full',
            STATUS_COLORS[task.status]
          )}
        />

        <div className="flex flex-col gap-1.5 pl-2">
          {/* Title row */}
          <div className="flex items-start gap-2">
            <h3 className="flex-1 text-sm font-medium leading-snug line-clamp-2">
              {task.title}
            </h3>
            <div className="flex items-center gap-1 shrink-0">
              {task.has_in_progress_attempt && (
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              )}
              {task.last_attempt_failed && (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
              <ChevronRight size={16} className="text-muted-foreground" />
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {task.description}
            </p>
          )}

          {/* Footer: agent + variant */}
          {task.executor && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <AgentIcon
                agent={task.executor as BaseCodingAgent}
                className="h-3 w-3"
              />
              <span>{getAgentName(task.executor as BaseCodingAgent)}</span>
              {task.variant && (
                <>
                  <span className="text-muted-foreground/50">/</span>
                  <Settings2 className="h-3 w-3" />
                  <span>{task.variant}</span>
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
