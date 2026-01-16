/**
 * UI Architecture System
 * 
 * Central export file for all UI animation and interaction utilities.
 * Import what you need from this file for cleaner imports.
 */

// Elastic Scroll
export {
  initElasticScroll,
  useElasticScroll,
  type ElasticScrollConfig,
} from './elasticScroll';

// Drag & Drop
export {
  DndContext,
  SortableContext,
  useDraggable,
  useDroppable,
  useSortable,
  useDefaultSensors,
  collisionDetection,
  sortingStrategies,
  reorderItems,
  arrayMove,
  CSS,
  type CollisionDetectionType,
  type SortingStrategyType,
} from './dragAndDrop';

// Animations
export {
  springEasing,
  durations,
  inertiaConfig,
  dragSpringConfig,
  animationClasses,
  springTransition,
  haptic,
} from './animations';

// Re-export RotaryKnob component
export { RotaryKnob, type RotaryKnobProps, type KnobZone } from '../components/ui/RotaryKnob';

