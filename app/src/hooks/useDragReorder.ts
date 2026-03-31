import { useState, useRef, useCallback } from 'react';

interface DragReorderOptions<T extends { id: string }> {
  items: T[];
  onReorder: (reordered: T[]) => void;
  apiEndpoint: string;
}

export function useDragReorder<T extends { id: string }>({
  items,
  onReorder,
  apiEndpoint,
}: DragReorderOptions<T>) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLElement | null>(null);

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLElement>, index: number) => {
      // Only proceed if not dragging a link/button/input
      const target = e.target as HTMLElement;
      if (
        target.closest('a') ||
        target.closest('button') ||
        target.closest('input')
      ) {
        e.preventDefault();
        return;
      }

      setDragIndex(index);
      dragNodeRef.current = e.currentTarget;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));

      // Make the drag image semi-transparent
      requestAnimationFrame(() => {
        if (dragNodeRef.current) {
          dragNodeRef.current.style.opacity = '0.4';
          dragNodeRef.current.style.transform = 'scale(0.95)';
        }
      });
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = '1';
      dragNodeRef.current.style.transform = '';
    }
    setDragIndex(null);
    setOverIndex(null);
    dragNodeRef.current = null;
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLElement>, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (dragIndex !== null && index !== dragIndex) {
        setOverIndex(index);
      }
    },
    [dragIndex]
  );

  const handleDragLeave = useCallback(() => {
    setOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLElement>, dropIndex: number) => {
      e.preventDefault();
      setOverIndex(null);

      if (dragIndex === null || dragIndex === dropIndex) return;

      const reordered = [...items];
      const [moved] = reordered.splice(dragIndex, 1);
      reordered.splice(dropIndex, 0, moved);

      // Optimistic update
      onReorder(reordered);

      // Persist to API
      const payload = reordered.map((item, i) => ({
        id: item.id,
        sort_order: i + 1,
      }));

      try {
        await fetch(apiEndpoint, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reorder', items: payload }),
        });
      } catch (err) {
        console.error('Failed to save order:', err);
        // Revert on error
        onReorder(items);
      }
    },
    [dragIndex, items, onReorder, apiEndpoint]
  );

  const getDragProps = useCallback(
    (index: number) => ({
      draggable: true,
      onDragStart: (e: React.DragEvent<HTMLElement>) =>
        handleDragStart(e, index),
      onDragEnd: handleDragEnd,
      onDragOver: (e: React.DragEvent<HTMLElement>) =>
        handleDragOver(e, index),
      onDragLeave: handleDragLeave,
      onDrop: (e: React.DragEvent<HTMLElement>) => handleDrop(e, index),
    }),
    [handleDragStart, handleDragEnd, handleDragOver, handleDragLeave, handleDrop]
  );

  const isOver = useCallback(
    (index: number) => overIndex === index && dragIndex !== index,
    [overIndex, dragIndex]
  );

  const isDragging = useCallback(
    (index: number) => dragIndex === index,
    [dragIndex]
  );

  return { getDragProps, isOver, isDragging, dragIndex };
}
