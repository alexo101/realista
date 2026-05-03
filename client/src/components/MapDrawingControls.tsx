import { useEffect, useRef, useState } from 'react';
import { Pentagon, Circle, X } from 'lucide-react';
import { type AreaShape, shapesEqual } from '@/utils/mapShape';

interface MapDrawingControlsProps {
  map: any;
  isReady: boolean;
  shape: AreaShape | null;
  onShapeChange: (shape: AreaShape | null) => void;
  color?: string;
  className?: string;
}

type Mode = 'idle' | 'polygon' | 'circle';

export function MapDrawingControls({
  map,
  isReady,
  shape,
  onShapeChange,
  color = '#0284c5',
  className = '',
}: MapDrawingControlsProps) {
  const drawingManagerRef = useRef<any>(null);
  const overlayRef = useRef<any>(null);
  const previousGestureHandlingRef = useRef<string | null>(null);
  const [mode, setMode] = useState<Mode>('idle');

  // Initialize the DrawingManager when the map is ready.
  useEffect(() => {
    if (!isReady || !map) return;
    const g = (window as any).google;
    if (!g?.maps?.drawing) return;

    const dm = new g.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: false,
      polygonOptions: {
        strokeColor: color,
        strokeWeight: 2,
        fillColor: color,
        fillOpacity: 0.12,
        clickable: false,
        editable: false,
        zIndex: 1,
      },
      circleOptions: {
        strokeColor: color,
        strokeWeight: 2,
        fillColor: color,
        fillOpacity: 0.12,
        clickable: false,
        editable: false,
        zIndex: 1,
      },
    });
    dm.setMap(map);
    drawingManagerRef.current = dm;

    const polyComplete = g.maps.event.addListener(dm, 'polygoncomplete', (polygon: any) => {
      const path: Array<{ lat: number; lng: number }> = [];
      polygon.getPath().forEach((p: any) => path.push({ lat: p.lat(), lng: p.lng() }));
      // Replace any prior overlay
      if (overlayRef.current) overlayRef.current.setMap(null);
      overlayRef.current = polygon;
      dm.setDrawingMode(null);
      restoreGestures();
      setMode('idle');
      onShapeChange({ type: 'polygon', path });
    });

    const circleComplete = g.maps.event.addListener(dm, 'circlecomplete', (circle: any) => {
      const center = circle.getCenter();
      const radius = circle.getRadius();
      if (overlayRef.current) overlayRef.current.setMap(null);
      overlayRef.current = circle;
      dm.setDrawingMode(null);
      restoreGestures();
      setMode('idle');
      onShapeChange({
        type: 'circle',
        center: { lat: center.lat(), lng: center.lng() },
        radius,
      });
    });

    return () => {
      g.maps.event.removeListener(polyComplete);
      g.maps.event.removeListener(circleComplete);
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
        overlayRef.current = null;
      }
      dm.setMap(null);
      drawingManagerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, map, color]);

  // Sync external `shape` prop into a visible overlay (e.g. when remounting after toggling list/map).
  useEffect(() => {
    if (!isReady || !map) return;
    const g = (window as any).google;
    if (!g?.maps) return;

    // If we already have an overlay reflecting this shape, do nothing.
    const currentShape = overlayToShape(overlayRef.current);
    if (shapesEqual(currentShape, shape)) return;

    if (overlayRef.current) {
      overlayRef.current.setMap(null);
      overlayRef.current = null;
    }
    if (!shape) return;

    if (shape.type === 'polygon') {
      overlayRef.current = new g.maps.Polygon({
        paths: shape.path,
        strokeColor: color,
        strokeWeight: 2,
        fillColor: color,
        fillOpacity: 0.12,
        clickable: false,
        map,
      });
    } else if (shape.type === 'circle') {
      overlayRef.current = new g.maps.Circle({
        center: shape.center,
        radius: shape.radius,
        strokeColor: color,
        strokeWeight: 2,
        fillColor: color,
        fillOpacity: 0.12,
        clickable: false,
        map,
      });
    }
  }, [shape, isReady, map, color]);

  const restoreGestures = () => {
    if (!map) return;
    if (previousGestureHandlingRef.current !== null) {
      map.setOptions({ gestureHandling: previousGestureHandlingRef.current });
      previousGestureHandlingRef.current = null;
    }
  };

  const startMode = (next: Mode) => {
    const dm = drawingManagerRef.current;
    const g = (window as any).google;
    if (!dm || !g?.maps?.drawing) return;
    if (next === 'idle') {
      dm.setDrawingMode(null);
      restoreGestures();
      setMode('idle');
      return;
    }
    // Disable the cooperative gesture so finger drags draw on the map (mobile).
    if (previousGestureHandlingRef.current === null && map) {
      previousGestureHandlingRef.current = map.get('gestureHandling') || 'cooperative';
      map.setOptions({ gestureHandling: 'greedy' });
    }
    dm.setDrawingMode(
      next === 'polygon' ? g.maps.drawing.OverlayType.POLYGON : g.maps.drawing.OverlayType.CIRCLE
    );
    setMode(next);
  };

  const clearShape = () => {
    if (overlayRef.current) {
      overlayRef.current.setMap(null);
      overlayRef.current = null;
    }
    const dm = drawingManagerRef.current;
    if (dm) dm.setDrawingMode(null);
    restoreGestures();
    setMode('idle');
    onShapeChange(null);
  };

  const baseBtn =
    'flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-full transition-colors touch-manipulation';
  const idleBtn = 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow';
  const activeBtn = 'text-white shadow';

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`} data-testid="map-drawing-controls">
      <button
        type="button"
        onClick={() => startMode(mode === 'polygon' ? 'idle' : 'polygon')}
        className={`${baseBtn} ${mode === 'polygon' ? activeBtn : idleBtn}`}
        style={mode === 'polygon' ? { backgroundColor: color } : undefined}
        data-testid="button-draw-polygon"
        aria-pressed={mode === 'polygon'}
      >
        <Pentagon className="h-4 w-4" />
        <span>Polígono</span>
      </button>
      <button
        type="button"
        onClick={() => startMode(mode === 'circle' ? 'idle' : 'circle')}
        className={`${baseBtn} ${mode === 'circle' ? activeBtn : idleBtn}`}
        style={mode === 'circle' ? { backgroundColor: color } : undefined}
        data-testid="button-draw-circle"
        aria-pressed={mode === 'circle'}
      >
        <Circle className="h-4 w-4" />
        <span>Círculo</span>
      </button>
      {shape && (
        <button
          type="button"
          onClick={clearShape}
          className={`${baseBtn} bg-white text-red-600 hover:bg-red-50 border border-red-200 shadow`}
          data-testid="button-clear-shape"
        >
          <X className="h-4 w-4" />
          <span>Borrar zona</span>
        </button>
      )}
      {mode !== 'idle' && (
        <span className="text-xs sm:text-sm text-gray-700 bg-white/95 px-3 py-1.5 rounded-full shadow border border-gray-200">
          {mode === 'polygon'
            ? 'Toca el mapa para añadir vértices y cierra tocando el primero'
            : 'Mantén pulsado y arrastra para dibujar el círculo'}
        </span>
      )}
    </div>
  );
}

function overlayToShape(overlay: any): AreaShape | null {
  if (!overlay) return null;
  // Circle has getRadius
  if (typeof overlay.getRadius === 'function') {
    const c = overlay.getCenter();
    return { type: 'circle', center: { lat: c.lat(), lng: c.lng() }, radius: overlay.getRadius() };
  }
  if (typeof overlay.getPath === 'function') {
    const path: Array<{ lat: number; lng: number }> = [];
    overlay.getPath().forEach((p: any) => path.push({ lat: p.lat(), lng: p.lng() }));
    return { type: 'polygon', path };
  }
  return null;
}
