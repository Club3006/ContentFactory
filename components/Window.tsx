
import React, { useState, ReactNode, useRef, useEffect } from 'react';

interface WindowProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  onFocus: () => void;
  onToggleMaximize?: () => void;
  zIndex: number;
  initialPos?: { x: number, y: number };
  autoLayout?: { x: number, y: number, width: number, height: number } | null;
  isMaximized?: boolean;
}

const Window: React.FC<WindowProps> = ({ title, children, onClose, onFocus, onToggleMaximize, zIndex, initialPos, autoLayout, isMaximized }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [pos, setPos] = useState({ x: initialPos?.x || 100, y: initialPos?.y || 100 });
  const [size, setSize] = useState({ width: 500, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Use autoLayout if available (when maximized or when another window is maximized)
  const effectivePos = autoLayout ? { x: autoLayout.x, y: autoLayout.y } : pos;
  const effectiveSize = autoLayout ? { width: autoLayout.width, height: autoLayout.height } : size;

  const dragStartPos = useRef({ x: 0, y: 0 });
  const resizeStartSize = useRef({ width: 0, height: 0 });
  const resizeStartPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.window-controls') || (e.target as HTMLElement).closest('.resize-handle')) return;
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    onFocus();
  };

  const handleResizeDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    resizeStartPos.current = { x: e.clientX, y: e.clientY };
    resizeStartSize.current = { width: size.width, height: size.height };
    onFocus();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPos({
          x: e.clientX - dragStartPos.current.x,
          y: Math.max(14, e.clientY - dragStartPos.current.y),
        });
      }
      if (isResizing) {
        const deltaX = e.clientX - resizeStartPos.current.x;
        const deltaY = e.clientY - resizeStartPos.current.y;
        setSize({
          width: Math.max(380, resizeStartSize.current.width + deltaX),
          height: Math.max(200, resizeStartSize.current.height + deltaY),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing]);

  return (
    <div
      onClick={onFocus}
      className={`absolute slick-window flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300 ${isDragging ? 'opacity-80 scale-[1.01]' : ''} ${isMaximized ? 'transition-all duration-300' : ''}`}
      style={{
        zIndex,
        top: effectivePos.y,
        left: effectivePos.x,
        width: effectiveSize.width,
        height: isMinimized ? '44px' : effectiveSize.height,
        pointerEvents: 'auto'
      }}
    >
      {/* Header */}
      <div
        onMouseDown={handleMouseDown}
        className="flex items-center justify-between px-4 py-3 bg-[#1e293b]/40 border-b border-white/5 cursor-grab active:cursor-grabbing select-none shrink-0"
      >
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5 window-controls">
            <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors" />
            <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors" />
            <button onClick={(e) => { e.stopPropagation(); onToggleMaximize?.(); }} className="w-3 h-3 rounded-full bg-emerald-500/80 hover:bg-emerald-500 transition-colors" />
          </div>
          <span className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase truncate max-w-[300px]">{title}</span>
        </div>
      </div>

      {/* Body */}
      {!isMinimized && (
        <div className="flex-grow overflow-hidden custom-scrollbar p-0 relative">
          <div className="h-full overflow-y-auto p-4 custom-scrollbar">
            {children}
          </div>

          <div
            onMouseDown={handleResizeDown}
            className="resize-handle absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-end justify-end p-1 z-50 opacity-20 hover:opacity-100"
          >
            <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v6h-6" /><path d="M21 21l-9-9" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default Window;
