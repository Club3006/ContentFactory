/**
 * Drag and Drop Utilities
 * 
 * Wrapper hooks and utilities for @dnd-kit library
 * Provides smooth, accessible drag-and-drop with spring physics
 */

import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  closestCorners,
  rectIntersection,
  DndContextProps,
} from '@dnd-kit/core';

import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

// Re-export core components and hooks for convenience
export {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';

export {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

export { CSS } from '@dnd-kit/utilities';

/**
 * Default sensors configuration with optimal settings
 * Includes pointer and keyboard support for accessibility
 */
export const useDefaultSensors = () => {
  return useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts (prevents accidental drags)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
};

/**
 * Collision detection strategies
 */
export const collisionDetection = {
  closestCenter,
  closestCorners,
  rectIntersection,
};

/**
 * Helper to reorder array items after drag
 */
export const reorderItems = <T,>(
  items: T[],
  activeId: string | number,
  overId: string | number,
  getId: (item: T) => string | number
): T[] => {
  const oldIndex = items.findIndex(item => getId(item) === activeId);
  const newIndex = items.findIndex(item => getId(item) === overId);
  
  if (oldIndex === -1 || newIndex === -1) {
    return items;
  }
  
  return arrayMove(items, oldIndex, newIndex);
};

/**
 * Sorting strategies
 */
export const sortingStrategies = {
  vertical: verticalListSortingStrategy,
  horizontal: horizontalListSortingStrategy,
  grid: rectSortingStrategy,
};

export type CollisionDetectionType = keyof typeof collisionDetection;
export type SortingStrategyType = keyof typeof sortingStrategies;

