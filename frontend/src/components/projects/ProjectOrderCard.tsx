import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, FolderKanban } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Project } from 'shared/types';

interface SortableProjectItemProps {
  project: Project;
  disabled: boolean;
}

function SortableProjectItem({ project, disabled }: SortableProjectItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md',
        isDragging
          ? 'bg-secondary shadow-md z-10 opacity-90'
          : 'hover:bg-secondary/50'
      )}
    >
      <button
        className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <FolderKanban className="w-5 h-5 shrink-0 text-muted-foreground" />
      <span className="flex-1 text-sm">{project.name}</span>
    </div>
  );
}

export interface ProjectOrderCardProps {
  projects: Project[];
  projectOrder: string[] | undefined | null;
  disabled: boolean;
  onReorder: (newOrder: string[]) => void;
}

export function ProjectOrderCard({
  projects,
  projectOrder,
  disabled,
  onReorder,
}: ProjectOrderCardProps) {
  const { t } = useTranslation('projects');

  const sortProjectsByOrder = (
    projects: Project[],
    order: string[] | undefined | null
  ): Project[] => {
    if (!order || order.length === 0) {
      return projects;
    }

    const orderMap = new Map(order.map((id, i) => [id, i]));
    const orderedProjects: Project[] = [];
    const unorderedProjects: Project[] = [];

    for (const project of projects) {
      if (orderMap.has(project.id)) {
        orderedProjects.push(project);
      } else {
        unorderedProjects.push(project);
      }
    }

    // Sort ordered projects by their position in the order array
    orderedProjects.sort((a, b) => {
      const ai = orderMap.get(a.id) ?? 0;
      const bi = orderMap.get(b.id) ?? 0;
      return ai - bi;
    });

    // Append unordered projects (e.g., newly created)
    return [...orderedProjects, ...unorderedProjects];
  };

  const [sortedProjects, setSortedProjects] = useState<Project[]>(() =>
    sortProjectsByOrder(projects, projectOrder)
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedProjects.findIndex((p) => p.id === active.id);
    const newIndex = sortedProjects.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(sortedProjects, oldIndex, newIndex);
    setSortedProjects(newOrder);
    onReorder(newOrder.map((p) => p.id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('order.title', 'Project Order')}</CardTitle>
        <CardDescription>
          {t(
            'order.description',
            'Drag and drop projects to change their display order'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedProjects.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {sortedProjects.map((project) => (
                <SortableProjectItem
                  key={project.id}
                  project={project}
                  disabled={disabled}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
}
