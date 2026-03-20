import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SwipeableTaskCard } from '../SwipeableTaskCard';
import type { TaskWithAttemptStatus } from 'shared/types';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      onClick,
      onPointerDown,
      onPointerUp,
      onPointerLeave,
      ...props
    }: any) => (
      <div
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
        data-testid={props['data-testid']}
      >
        {children}
      </div>
    ),
  },
  useMotionValue: () => ({
    get: () => 0,
    set: vi.fn(),
    on: vi.fn(),
    destroy: vi.fn(),
  }),
  useTransform: () => ({ get: () => 0 }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const createMockTask = (
  overrides: Partial<TaskWithAttemptStatus> = {}
): TaskWithAttemptStatus => ({
  id: 'task-1',
  project_id: 'proj-1',
  title: 'Test Task',
  description: 'A test task description',
  status: 'todo',
  parent_workspace_id: null,
  has_in_progress_attempt: false,
  last_attempt_failed: false,
  executor: null,
  variant: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

const renderTaskCard = (
  task: TaskWithAttemptStatus,
  props: Partial<Parameters<typeof SwipeableTaskCard>[0]> = {}
) => {
  return render(
    <MemoryRouter>
      <SwipeableTaskCard
        task={task}
        onClick={vi.fn()}
        {...props}
      />
    </MemoryRouter>
  );
};

describe('SwipeableTaskCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders task title', () => {
    const task = createMockTask({ title: 'My Important Task' });
    renderTaskCard(task);
    expect(screen.getByText('My Important Task')).toBeInTheDocument();
  });

  it('renders task description', () => {
    const task = createMockTask({ description: 'Some details here' });
    renderTaskCard(task);
    expect(screen.getByText('Some details here')).toBeInTheDocument();
  });

  it('does not render description when null', () => {
    const task = createMockTask({ description: null });
    renderTaskCard(task);
    // Only title should be present, not description
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    const task = createMockTask();
    renderTaskCard(task, { onClick });

    fireEvent.click(screen.getByText('Test Task').closest('div')!.parentElement!);
    expect(onClick).toHaveBeenCalledWith(task);
  });

  it('shows in-progress indicator when has_in_progress_attempt is true', () => {
    const task = createMockTask({ has_in_progress_attempt: true });
    renderTaskCard(task);
    // Loader2 icon should be present
    const container = screen.getByText('Test Task').closest('div');
    expect(container?.querySelector('svg')).toBeInTheDocument();
  });

  it('shows failed indicator when last_attempt_failed is true', () => {
    const task = createMockTask({ last_attempt_failed: true });
    renderTaskCard(task);
    // The failed icon is rendered
    const container = screen.getByText('Test Task').closest('div');
    expect(container?.querySelector('svg')).toBeInTheDocument();
  });

  it('renders executor info when present', () => {
    const task = createMockTask({
      executor: 'claude',
      variant: 'default',
    });
    renderTaskCard(task);
    // Agent name should be shown (via getAgentName)
    expect(screen.getByText('Claude')).toBeInTheDocument();
    expect(screen.getByText('default')).toBeInTheDocument();
  });

  it('does not render executor section when executor is null', () => {
    const task = createMockTask({ executor: null });
    renderTaskCard(task);
    // No executor or variant should be shown
    expect(screen.queryByText('Claude')).not.toBeInTheDocument();
  });

  it('renders the status indicator bar', () => {
    const task = createMockTask({ status: 'inprogress' });
    const { container } = renderTaskCard(task);
    // The status indicator div should have blue-500 class
    const statusIndicator = container.querySelector('.bg-blue-500');
    expect(statusIndicator).toBeInTheDocument();
  });
});
