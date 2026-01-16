# UI Architecture & Animation System

This document describes the advanced UI animation and interaction systems available in Content Factory Pro.

## 📦 Installed Libraries

### 1. Elastic Scroll Polyfill
- **Package**: `elastic-scroll-polyfill`
- **Purpose**: macOS-style rubber-band overscroll effect
- **License**: MIT

### 2. dnd-kit
- **Packages**: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- **Purpose**: Smooth, accessible drag-and-drop with spring physics
- **License**: MIT

### 3. Precision Inputs
- **Package**: `precision-inputs`
- **Purpose**: High-precision rotary knob/dial controls
- **License**: MIT

---

## 🎨 Available Utilities

### Elastic Scroll (`utils/elasticScroll.ts`)

Adds macOS-style rubber-band effect to scrollable containers.

**Usage:**

```typescript
import { useElasticScroll } from '../utils/elasticScroll';

// In your component
useElasticScroll({
  intensity: 0.4,      // Bounce intensity (0-1)
  duration: 400,       // Animation duration (ms)
  easing: 'easeOutQuint',
  appleDevicesOnly: false
});
```

**Or add `data-elastic` attribute to scrollable elements:**

```tsx
<div className="overflow-y-auto custom-scrollbar" data-elastic>
  {/* Content */}
</div>
```

**Best for:**
- Window content areas
- Feed/list views
- Side panels
- Log terminals

---

### Drag & Drop (`utils/dragAndDrop.ts`)

Wrapper utilities for @dnd-kit with sensible defaults.

**Basic Sortable List:**

```tsx
import { DndContext, SortableContext, useSortable, useDefaultSensors, verticalListSortingStrategy } from '../utils/dragAndDrop';

function SortableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

function MyList({ items }) {
  const sensors = useDefaultSensors();

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter}>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {items.map(item => (
          <SortableItem key={item.id} id={item.id}>
            {item.content}
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

**Available Strategies:**
- `verticalListSortingStrategy` - Vertical lists
- `horizontalListSortingStrategy` - Horizontal lists
- `rectSortingStrategy` - Grid layouts

**Collision Detection:**
- `closestCenter` - Based on center points
- `closestCorners` - Based on corners
- `rectIntersection` - Overlap-based

---

### Rotary Knob (`components/ui/RotaryKnob.tsx`)

Advanced rotary dial control with color zones.

**Basic Usage:**

```tsx
import RotaryKnob from '../components/ui/RotaryKnob';

function MyControl() {
  const [value, setValue] = useState(0.5);

  return (
    <RotaryKnob
      value={value}
      onChange={setValue}
      label="Intensity"
      size={100}
      showValue={true}
    />
  );
}
```

**Custom Zones:**

```tsx
const customZones = [
  { max: 0.33, color: '#2bd576', label: 'LOW', glow: false },
  { max: 0.66, color: '#f5c542', label: 'MED', glow: false },
  { max: 1.00, color: '#ff4d4d', label: 'HIGH', glow: true },
];

<RotaryKnob
  value={value}
  onChange={setValue}
  zones={customZones}
  min={0}
  max={100}
  step={1}
/>
```

**Features:**
- Mouse drag
- Touch support
- Mouse wheel
- Keyboard (arrow keys)
- Color transitions
- Optional glow effect
- Accessible

**Default Zones:**
- 0-60%: OK (Green)
- 60-85%: WARN (Yellow)
- 85-100%: HOT (Red with glow)

---

### Animation Utilities (`utils/animations.ts`)

Spring physics and easing curves for macOS-style animations.

**Spring Easings:**

```typescript
import { springEasing, durations } from '../utils/animations';

// Use in CSS-in-JS or style objects
const style = {
  transition: `transform ${durations.normal}ms ${springEasing.soft}`,
};
```

**Available Easings:**
- `soft` - Gentle bounce for general UI
- `medium` - Medium bounce for cards/panels
- `strong` - Strong bounce for impactful actions
- `dock` - macOS dock-style bounce
- `smooth` - Elastic with no overshoot

**Animation Classes:**

```tsx
import { animationClasses } from '../utils/animations';

<div className={animationClasses.popIn}>
  Animated content
</div>
```

**Helper Functions:**

```typescript
// Generate transition string
const transition = springTransition(['transform', 'opacity'], 300, 'medium');
// Result: "transform 300ms cubic-bezier(...), opacity 300ms cubic-bezier(...)"

// Haptic feedback (mobile)
import { haptic } from '../utils/animations';
haptic.light();  // Light tap
haptic.medium(); // Medium tap
haptic.heavy();  // Heavy tap
```

---

## 🎯 Usage Guidelines

### When to Use Elastic Scroll
- All scrollable content areas
- Windows with overflow content
- Lists and feeds
- Terminal-style outputs

### When to Use Drag & Drop
- Reorderable lists (kanban boards)
- File/asset organization
- Priority ranking interfaces
- Grid layouts with rearranging

### When to Use Rotary Knobs
- Intensity/strength controls
- Volume/level adjustments
- Temperature/threshold settings
- Any 0-100% parameter

### Animation Best Practices
- Use `soft` easing for most UI interactions
- Use `medium` for modal/panel appearances
- Use `strong` sparingly for emphasis
- Keep durations consistent across similar actions

---

## 🚀 Integration Checklist

When adding these to new components:

- [ ] Add `data-elastic` to scrollable areas
- [ ] Wrap draggable items with `DndContext` and `SortableContext`
- [ ] Use `RotaryKnob` for 0-1 normalized values
- [ ] Apply spring easings to custom animations
- [ ] Test keyboard accessibility for all interactions
- [ ] Verify touch device compatibility

---

## 🔧 Configuration

All utilities support configuration objects. See individual files for TypeScript interfaces and full API documentation.

**Global Elastic Scroll Config:**

```typescript
// In App.tsx or index.tsx
import { initElasticScroll } from './utils/elasticScroll';

initElasticScroll({
  intensity: 0.5,
  duration: 400,
  appleDevicesOnly: false,
});
```

---

## 📚 Further Reading

- [dnd-kit Documentation](https://docs.dndkit.com/)
- [precision-inputs Repository](https://github.com/jhnsnc/precision-inputs)
- [elastic-scroll-polyfill Repository](https://github.com/atomiks/elastic-scroll-polyfill)

---

**Last Updated**: January 2026  
**Architecture Status**: ✅ Ready for Integration

