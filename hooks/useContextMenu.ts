import { useState, useCallback, MouseEvent } from 'react';

interface Position {
  x: number;
  y: number;
}

interface ContextMenuState<T = any> {
  position: Position | null;
  data: T | null;
}

export function useContextMenu<T = any>() {
  const [state, setState] = useState<ContextMenuState<T>>({
    position: null,
    data: null,
  });

  const open = useCallback((event: MouseEvent, data: T) => {
    event.preventDefault();
    setState({
      position: { x: event.clientX, y: event.clientY },
      data,
    });
  }, []);

  const close = useCallback(() => {
    setState({ position: null, data: null });
  }, []);

  return {
    isOpen: state.position !== null,
    position: state.position,
    data: state.data,
    open,
    close,
  };
}
