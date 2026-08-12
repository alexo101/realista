import { useEffect, useRef, useState } from 'react';
import { Pentagon, Circle, X } from 'lucide-react';
import { type AreaShape, shapesEqual } from '@/utils/mapShape';

interface MapDrawingControlsProps {
  map: any;
  isReady: boolean;
  shape: AreaShape | null;
  onShapeChange: (shape: AreaShape | null) => void;
  color?: string;
  allowCircle?: boolean;
  className?: string;
}

type Mode = 'idle' | 'polygon' | 'circle';
type Point = { lat: number; lng: number };

export function MapDrawingControls({
  map,
  isReady,
  shape,
  onShapeChange,
  color = '#0284c5',
  allowCircle = true,
  className = '',
}: MapDrawingControlsProps) {
  const overlayRef = useRef<any>(null);
  const drawingOverlayRef = useRef<any>(null);
  const firstPointMarkerRef = useRef<any>(null);
  const drawingListenersRef = useRef<any[]>([]);
  const polygonPointsRef = useRef<Point[]>([]);
  const circleStartRef = useRef<Point | null>(null);
  const previousGestureHandlingRef = useRef<string | null>(null);
  const onShapeChangeRef = useRef(onShapeChange);
  const [mode, setMode] = useState<Mode>('idle');

  // Keep the latest callback available to map event listeners without
  // recreating those listeners on every parent render.
  onShapeChangeRef.current = onShapeChange;

  const restoreGestures = () => {
    if (!map) return;
    if (previousGestureHandlingRef.current !== null) {
      map.setOptions({ gestureHandling: previousGestureHandlingRef.current });
      previousGestureHandlingRef.current = null;
    }
  };

  const clearDrawingState = () => {
    drawingListenersRef.current.forEach((listener) => listener?.remove?.());
    drawingListenersRef.current = [];

    if (drawingOverlayRef.current) {
      drawingOverlayRef.current.setMap(null);
      drawingOverlayRef.current = null;
    }
    if (firstPointMarkerRef.current) {
      firstPointMarkerRef.current.setMap(null);
      firstPointMarkerRef.current = null;
    }

    polygonPointsRef.current = [];
    circleStartRef.current = null;
    restoreGestures();
  };

  const finishPolygon = () => {
    const path = polygonPointsRef.current;
    if (path.length < 3) return;

    const polygon = drawingOverlayRef.current;
    drawingOverlayRef.current = null;
    clearDrawingState();
    overlayRef.current = polygon;
    if (polygon) polygon.setOptions({ clickable: false });
    setMode('idle');
    onShapeChangeRef.current({ type: 'polygon', path });
  };

  const finishCircle = () => {
    const circle = drawingOverlayRef.current;
    const center = circleStartRef.current;
    if (!circle || !center) return;

    const radius = circle.getRadius();
    if (!radius || radius < 10) return;

    drawingOverlayRef.current = null;
    clearDrawingState();
    overlayRef.current = circle;
    circle.setOptions({ clickable: false });
    setMode('idle');
    onShapeChangeRef.current({ type: 'circle', center, radius });
  };

  // Use native map events instead of DrawingManager. DrawingManager was
  // removed from Google Maps JavaScript API 3.65.
  useEffect(() => {
    if (!isReady || !map || mode === 'idle') return;
    const g = (window as any).google;
    if (!g?.maps) return;

    clearDrawingState();
    previousGestureHandlingRef.current = map.get('gestureHandling') || 'cooperative';
    map.setOptions({ gestureHandling: 'greedy' });

    if (mode === 'polygon') {
      const updatePolygon = () => {
        if (!drawingOverlayRef.current) {
          drawingOverlayRef.current = new g.maps.Polygon({
            paths: polygonPointsRef.current,
            strokeColor: color,
            strokeWeight: 2,
            fillColor: color,
            fillOpacity: 0.2,
            clickable: false,
            map,
          });
        } else {
          drawingOverlayRef.current.setPath(polygonPointsRef.current);
        }
      };

      const mapClickListener = map.addListener('click', (event: any) => {
        if (!event.latLng) return;
        polygonPointsRef.current = [
          ...polygonPointsRef.current,
          { lat: event.latLng.lat(), lng: event.latLng.lng() },
        ];
        updatePolygon();

        if (polygonPointsRef.current.length === 1) {
          firstPointMarkerRef.current = new g.maps.Marker({
            position: polygonPointsRef.current[0],
            map,
            clickable: true,
            title: 'Cerrar polígono',
            icon: {
              path: g.maps.SymbolPath.CIRCLE,
              scale: 7,
              fillColor: color,
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
          });
          drawingListenersRef.current.push(
            firstPointMarkerRef.current.addListener('click', finishPolygon),
          );
        }
      });
      drawingListenersRef.current.push(mapClickListener);
    } else {
      const updateCircle = (event: any) => {
        if (!circleStartRef.current || !event.latLng) return;
        const edge = { lat: event.latLng.lat(), lng: event.latLng.lng() };
        const radius = distanceInMeters(circleStartRef.current, edge);
        if (!drawingOverlayRef.current) {
          drawingOverlayRef.current = new g.maps.Circle({
            center: circleStartRef.current,
            radius,
            strokeColor: color,
            strokeWeight: 2,
            fillColor: color,
            fillOpacity: 0.2,
            clickable: false,
            map,
          });
        } else {
          drawingOverlayRef.current.setRadius(radius);
        }
      };

      const mouseDownListener = map.addListener('mousedown', (event: any) => {
        if (!event.latLng) return;
        circleStartRef.current = { lat: event.latLng.lat(), lng: event.latLng.lng() };
      });
      const mouseMoveListener = map.addListener('mousemove', updateCircle);
      const mouseUpListener = map.addListener('mouseup', finishCircle);
      drawingListenersRef.current.push(
        mouseDownListener,
        mouseMoveListener,
        mouseUpListener,
      );
    }

    return clearDrawingState;
    // The drawing session should only restart when the selected mode/map changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, map, mode]);

  // Sync an externally selected shape into a visible overlay.
  useEffect(() => {
    if (!isReady || !map) return;
    const g = (window as any).google;
    if (!g?.maps) return;

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
        fillOpacity: 0.2,
        clickable: false,
        map,
      });
    } else {
      overlayRef.current = new g.maps.Circle({
        center: shape.center,
        radius: shape.radius,
        strokeColor: color,
        strokeWeight: 2,
        fillColor: color,
        fillOpacity: 0.2,
        clickable: false,
        map,
      });
    }
  }, [shape, isReady, map, color]);

  const startMode = (next: Mode) => {
    if (next === 'idle') {
      clearDrawingState();
      setMode('idle');
      return;
    }
    setMode(next);
  };

  const clearShape = () => {
    clearDrawingState();
    if (overlayRef.current) {
      overlayRef.current.setMap(null);
      overlayRef.current = null;
    }
    setMode('idle');
    onShapeChangeRef.current(null);
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
      {allowCircle && (
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
      )}
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
            ? 'Toca el mapa para añadir vértices y cierra tocando el primer punto'
            : 'Mantén pulsado y arrastra para dibujar el círculo'}
        </span>
      )}
    </div>
  );
}

function distanceInMeters(a: Point, b: Point): number {
  const earthRadius = 6_371_000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(h));
}

function overlayToShape(overlay: any): AreaShape | null {
  if (!overlay) return null;
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