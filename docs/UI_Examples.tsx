/**
 * UI Architecture Examples
 * 
 * Example implementations showing how to use the new UI utilities.
 * These are reference implementations - adapt as needed for your use case.
 */

import React, { useState } from 'react';
import {
  DndContext,
  SortableContext,
  useSortable,
  useDefaultSensors,
  sortingStrategies,
  reorderItems,
  CSS,
  RotaryKnob,
  useElasticScroll,
  animationClasses,
  springEasing,
  haptic,
} from '../utils/uiArchitecture';

// ============================================
// EXAMPLE 1: Sortable List with Elastic Scroll
// ============================================

interface ListItem {
  id: string;
  content: string;
}

function SortableListItem({ id, content }: ListItem) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-4 mb-2 bg-slate-800/50 border border-slate-700 rounded-lg cursor-grab active:cursor-grabbing hover:border-blue-500/50 transition-colors ${isDragging ? 'scale-105 shadow-lg' : ''}`}
    >
      <div className="text-sm text-slate-300">{content}</div>
    </div>
  );
}

export function SortableListExample() {
  const [items, setItems] = useState<ListItem[]>([
    { id: '1', content: 'First item' },
    { id: '2', content: 'Second item' },
    { id: '3', content: 'Third item' },
  ]);

  const sensors = useDefaultSensors();

  // Initialize elastic scroll
  useElasticScroll();

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const newItems = reorderItems(items, active.id, over.id, item => item.id);
      setItems(newItems);
      haptic.light();
    }
  };

  return (
    <div className="max-h-96 overflow-y-auto custom-scrollbar" data-elastic>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={items} strategy={sortingStrategies.vertical}>
          {items.map(item => (
            <SortableListItem key={item.id} {...item} />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}

// ============================================
// EXAMPLE 2: Rotary Knob Control Panel
// ============================================

export function KnobControlPanel() {
  const [intensity, setIntensity] = useState(0.5);
  const [temperature, setTemperature] = useState(0.7);
  const [volume, setVolume] = useState(0.3);

  return (
    <div className="flex gap-6 p-6 bg-slate-900/50 border border-slate-700 rounded-xl">
      <RotaryKnob
        value={intensity}
        onChange={(val) => {
          setIntensity(val);
          haptic.light();
        }}
        label="Intensity"
        size={100}
        showValue={true}
      />

      <RotaryKnob
        value={temperature}
        onChange={(val) => {
          setTemperature(val);
          haptic.light();
        }}
        label="Temperature"
        size={100}
        showValue={true}
        zones={[
          { max: 0.4, color: '#3b82f6', label: 'COOL', glow: false },
          { max: 0.7, color: '#f5c542', label: 'WARM', glow: false },
          { max: 1.0, color: '#ff4d4d', label: 'HOT', glow: true },
        ]}
      />

      <RotaryKnob
        value={volume}
        onChange={(val) => {
          setVolume(val);
          haptic.light();
        }}
        label="Volume"
        size={100}
        showValue={true}
      />
    </div>
  );
}

// ============================================
// EXAMPLE 3: Animated Modal with Spring
// ============================================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function SpringModal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md ${animationClasses.fadeIn}`}
      onClick={onClose}
    >
      <div
        className={`bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl ${animationClasses.popIn}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          transition: `transform 300ms ${springEasing.medium}, opacity 300ms ease-out`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ============================================
// EXAMPLE 4: Drag & Drop Grid
// ============================================

interface GridItem {
  id: string;
  title: string;
  color: string;
}

function GridItemComponent({ id, title, color }: GridItem) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`aspect-square rounded-xl border-2 flex items-center justify-center cursor-grab active:cursor-grabbing ${isDragging ? 'scale-110 shadow-2xl z-50' : 'hover:scale-105'}`}
      style={{
        backgroundColor: color,
        ...style,
      }}
    >
      <span className="font-bold text-white text-sm uppercase tracking-wider">
        {title}
      </span>
    </div>
  );
}

export function DraggableGrid() {
  const [items, setItems] = useState<GridItem[]>([
    { id: '1', title: 'Item 1', color: '#3b82f6' },
    { id: '2', title: 'Item 2', color: '#8b5cf6' },
    { id: '3', title: 'Item 3', color: '#ec4899' },
    { id: '4', title: 'Item 4', color: '#f59e0b' },
    { id: '5', title: 'Item 5', color: '#10b981' },
    { id: '6', title: 'Item 6', color: '#ef4444' },
  ]);

  const sensors = useDefaultSensors();

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const newItems = reorderItems(items, active.id, over.id, item => item.id);
      setItems(newItems);
      haptic.medium();
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext items={items} strategy={sortingStrategies.grid}>
        <div className="grid grid-cols-3 gap-4 p-4">
          {items.map(item => (
            <GridItemComponent key={item.id} {...item} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

