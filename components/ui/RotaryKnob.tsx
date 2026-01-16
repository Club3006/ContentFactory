/**
 * RotaryKnob Component
 * 
 * Advanced rotary dial control with color transitions based on value.
 * Uses precision-inputs for interaction and custom SVG for visuals.
 * 
 * Features:
 * - Multi-input support (drag, touch, wheel, keyboard)
 * - Color zones: OK (green) → WARN (yellow) → HOT (red)
 * - Optional glow effect on threshold breach
 * - macOS-inspired design
 */

import React, { useRef, useEffect, useState } from 'react';
import { KnobInput } from 'precision-inputs';

export interface RotaryKnobProps {
  value: number; // 0 to 1
  onChange: (value: number) => void;
  size?: number;
  label?: string;
  showValue?: boolean;
  disabled?: boolean;
  zones?: KnobZone[];
  min?: number;
  max?: number;
  step?: number;
}

export interface KnobZone {
  max: number; // normalized 0-1
  color: string; // hex color
  label: string; // zone name
  glow?: boolean; // optional glow effect
}

// Default zones: green → yellow → red
const DEFAULT_ZONES: KnobZone[] = [
  { max: 0.60, color: '#2bd576', label: 'OK', glow: false },
  { max: 0.85, color: '#f5c542', label: 'WARN', glow: false },
  { max: 1.00, color: '#ff4d4d', label: 'HOT', glow: true },
];

export const RotaryKnob: React.FC<RotaryKnobProps> = ({
  value,
  onChange,
  size = 80,
  label,
  showValue = true,
  disabled = false,
  zones = DEFAULT_ZONES,
  min = 0,
  max = 1,
  step = 0.01,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<KnobInput | null>(null);
  const [currentZone, setCurrentZone] = useState<KnobZone>(zones[0]);

  // Determine current zone based on value
  useEffect(() => {
    const normalizedValue = (value - min) / (max - min);
    const zone = zones.find(z => normalizedValue <= z.max) || zones[zones.length - 1];
    setCurrentZone(zone);
  }, [value, zones, min, max]);

  // Initialize precision-inputs KnobInput
  useEffect(() => {
    if (!containerRef.current) return;

    // Create hidden input for precision-inputs
    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(value);
    input.style.display = 'none';
    containerRef.current.appendChild(input);

    // Initialize KnobInput
    knobRef.current = new KnobInput(input, {
      visualContext: 'minimal',
      dragResistance: 300,
      wheelResistance: 4000,
    });

    // Listen for value changes
    const handleInput = () => {
      if (knobRef.current && !disabled) {
        onChange(parseFloat(knobRef.current.value));
      }
    };

    input.addEventListener('input', handleInput);

    return () => {
      input.removeEventListener('input', handleInput);
      if (knobRef.current) {
        knobRef.current = null;
      }
      input.remove();
    };
  }, []);

  // Update knob when external value changes
  useEffect(() => {
    if (knobRef.current && knobRef.current.value !== String(value)) {
      knobRef.current.value = String(value);
    }
  }, [value]);

  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedValue = (value - min) / (max - min);
  const angle = normalizedValue * 270 - 135; // -135° to 135° (270° range)
  const strokeDashoffset = circumference - (normalizedValue * 0.75 * circumference);

  return (
    <div className="flex flex-col items-center gap-2">
      {label && (
        <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
          {label}
        </label>
      )}
      
      <div
        ref={containerRef}
        className={`relative ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
        style={{ width: size, height: size }}
      >
        {/* SVG Ring with color gradient */}
        <svg
          width={size}
          height={size}
          className={`absolute inset-0 rotate-[-135deg] ${currentZone.glow ? 'drop-shadow-[0_0_12px_currentColor]' : ''}`}
          style={{ color: currentZone.color }}
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          
          {/* Active arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-200"
          />
        </svg>

        {/* Indicator dot */}
        <div
          className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full shadow-lg"
          style={{
            transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-${radius * 0.7}px)`,
          }}
        />

        {/* Center value display */}
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-sm font-bold text-white">
                {Math.round(normalizedValue * 100)}
              </div>
              <div className="text-[8px] uppercase tracking-wider" style={{ color: currentZone.color }}>
                {currentZone.label}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RotaryKnob;
