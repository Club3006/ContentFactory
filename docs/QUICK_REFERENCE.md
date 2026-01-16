# Quick Reference Card - UI Architecture

## 🚀 Fast Copy-Paste Snippets

### Elastic Scroll (Instant macOS Bounce)

```tsx
// 1. Add to any scrollable div
<div className="overflow-y-auto" data-elastic>
  {content}
</div>

// 2. Or use hook in component
import { useElasticScroll } from './utils/uiArchitecture';

function MyComponent() {
  useElasticScroll();
  return <div data-elastic>{content}</div>;
}
```

---

### Rotary Knob (Copy & Paste)

```tsx
import { RotaryKnob } from './utils/uiArchitecture';

<RotaryKnob
  value={myValue}           // 0 to 1
  onChange={setMyValue}     // callback
  label="Control Name"      // optional
  size={80}                 // optional (default: 80)
  showValue={true}          // optional (default: true)
/>
```

---

### Sortable List (Complete Pattern)

```tsx
import { 
  DndContext, 
  SortableContext, 
  useSortable, 
  useDefaultSensors,
  sortingStrategies,
  reorderItems,
  CSS 
} from './utils/uiArchitecture';

// 1. Item component
function Item({ id, content }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  return (
    <div 
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes} 
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      {content}
    </div>
  );
}

// 2. List component
function List({ items, setItems }) {
  const sensors = useDefaultSensors();
  
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setItems(reorderItems(items, active.id, over.id, item => item.id));
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext items={items} strategy={sortingStrategies.vertical}>
        {items.map(item => <Item key={item.id} {...item} />)}
      </SortableContext>
    </DndContext>
  );
}
```

---

### Spring Animations

```tsx
import { springEasing, springTransition } from './utils/uiArchitecture';

// Method 1: Direct CSS
<div style={{ 
  transition: `transform 300ms ${springEasing.soft}` 
}}>

// Method 2: Helper function
<div style={{ 
  transition: springTransition(['transform', 'opacity'], 300, 'medium') 
}}>

// Method 3: Tailwind + inline
<div 
  className="transition-transform duration-300"
  style={{ transitionTimingFunction: springEasing.soft }}
>
```

---

## 🎨 Available Spring Curves

```tsx
springEasing.soft      // Gentle bounce (default UI)
springEasing.medium    // Medium bounce (modals/panels)
springEasing.strong    // Strong bounce (emphasis)
springEasing.dock      // macOS dock bounce
springEasing.smooth    // No overshoot
```

---

## 🎯 Custom Knob Zones

```tsx
const zones = [
  { max: 0.33, color: '#2bd576', label: 'LOW', glow: false },
  { max: 0.66, color: '#f5c542', label: 'MED', glow: false },
  { max: 1.00, color: '#ff4d4d', label: 'HIGH', glow: true }
];

<RotaryKnob zones={zones} {...props} />
```

---

## 📦 Import Patterns

```tsx
// Import everything from one file
import { 
  RotaryKnob,
  DndContext,
  useElasticScroll,
  springEasing,
  haptic
} from './utils/uiArchitecture';

// Or import from specific files
import { RotaryKnob } from './components/ui/RotaryKnob';
import { useElasticScroll } from './utils/elasticScroll';
```

---

## 🎮 Haptic Feedback

```tsx
import { haptic } from './utils/uiArchitecture';

// On button click
onClick={() => {
  haptic.light();
  doAction();
}}

// On drag end
onDragEnd={(event) => {
  haptic.medium();
  handleDragEnd(event);
}}

// On error/important action
onError={() => {
  haptic.heavy();
  showError();
}}
```

---

## 🔥 One-Line Integrations

```tsx
// Add elastic scroll
data-elastic

// Add spring to transition
style={{ transition: springTransition(['all'], 300) }}

// Make list sortable (see full pattern above)
<SortableContext items={items} strategy={sortingStrategies.vertical}>
```

---

## 📚 Full Documentation

- **Complete Guide**: `docs/UI_Architecture.md`
- **Examples**: `docs/UI_Examples.tsx`
- **Integration Map**: `docs/UI_INTEGRATION_MAP.md`
- **Summary**: `docs/UI_IMPLEMENTATION_SUMMARY.md`

---

## ✅ Pre-flight Checklist

Before using in production:
- [ ] Import from `./utils/uiArchitecture` (central exports)
- [ ] Add TypeScript types to state
- [ ] Test keyboard navigation (drag & drop)
- [ ] Test touch devices (if applicable)
- [ ] Verify accessibility (screen readers)
- [ ] Use existing color palette
- [ ] Match existing UI patterns

---

**Pro Tip**: Start with elastic scroll (easiest), then add knobs, then drag & drop.

