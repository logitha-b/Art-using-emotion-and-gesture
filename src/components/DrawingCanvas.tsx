import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import type { DrawingStroke, Point } from '@/types/gesture';

interface DrawingCanvasProps {
  width: number;
  height: number;
  currentColor: string;
  isDrawing: boolean;
  onNewPoint?: (point: Point) => void;
}

export interface DrawingCanvasRef {
  undo: () => void;
  clear: () => void;
  addPoint: (point: Point) => void;
}

const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(
  ({ width, height, currentColor, isDrawing }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const strokesRef = useRef<DrawingStroke[]>([]);
    const currentStrokeRef = useRef<DrawingStroke | null>(null);
    const isDrawingRef = useRef(false);
    const lastPointRef = useRef<Point | null>(null);

    const redraw = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.fillStyle = 'rgba(15, 15, 20, 1)';
      ctx.fillRect(0, 0, width, height);

      // Draw all strokes
      for (const stroke of strokesRef.current) {
        if (stroke.points.length < 2) continue;

        ctx.beginPath();
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.moveTo(stroke.points[0].x * width, stroke.points[0].y * height);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x * width, stroke.points[i].y * height);
        }
        ctx.stroke();
      }

      // Draw current stroke
      if (currentStrokeRef.current && currentStrokeRef.current.points.length >= 2) {
        const stroke = currentStrokeRef.current;
        ctx.beginPath();
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.moveTo(stroke.points[0].x * width, stroke.points[0].y * height);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x * width, stroke.points[i].y * height);
        }
        ctx.stroke();
      }
    }, [width, height]);

    const addPoint = useCallback((point: Point) => {
      // Skip if point is too close to last point
      if (lastPointRef.current) {
        const dx = point.x - lastPointRef.current.x;
        const dy = point.y - lastPointRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.005) return; // Skip very close points
      }

      if (!currentStrokeRef.current) {
        currentStrokeRef.current = {
          points: [point],
          color: currentColor,
        };
      } else {
        currentStrokeRef.current.points.push(point);
      }

      lastPointRef.current = point;
      redraw();
    }, [currentColor, redraw]);

    const finishStroke = useCallback(() => {
      if (currentStrokeRef.current && currentStrokeRef.current.points.length >= 2) {
        strokesRef.current.push(currentStrokeRef.current);
      }
      currentStrokeRef.current = null;
      lastPointRef.current = null;
    }, []);

    const undo = useCallback(() => {
      if (strokesRef.current.length > 0) {
        strokesRef.current.pop();
        redraw();
      }
    }, [redraw]);

    const clear = useCallback(() => {
      strokesRef.current = [];
      currentStrokeRef.current = null;
      lastPointRef.current = null;
      redraw();
    }, [redraw]);

    useImperativeHandle(ref, () => ({
      undo,
      clear,
      addPoint,
    }), [undo, clear, addPoint]);

    useEffect(() => {
      if (isDrawing && !isDrawingRef.current) {
        isDrawingRef.current = true;
      } else if (!isDrawing && isDrawingRef.current) {
        isDrawingRef.current = false;
        finishStroke();
      }
    }, [isDrawing, finishStroke]);

    useEffect(() => {
      redraw();
    }, [redraw]);

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="block"
      />
    );
  }
);

DrawingCanvas.displayName = 'DrawingCanvas';

export default DrawingCanvas;
