import { Button } from "antd";
import * as React from "react";
import { useSetting } from "./hooks";

export default function CanvasDrawing() {
  const [showDraw, setShowDraw] = React.useState(false);

  return (
    <>
      {!showDraw && (
        <Button className="draw_button" onClick={() => setShowDraw(true)}>
          打开画板
        </Button>
      )}
      {showDraw && <CanvasDraw onClose={() => setShowDraw(false)} />}
    </>
  );
}

const CanvasDraw = ({ onClose }: { onClose: () => void }) => {
  type Point = { x: number; y: number };
  type Stroke = { color: string; width: number; points: Point[] };

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const ctxRef = React.useRef<CanvasRenderingContext2D | null>(null);
  const isDrawing = React.useRef(false);
  const lastPosRef = React.useRef<Point | null>(null);
  const strokesRef = React.useRef<Stroke[]>([]);
  const activeStrokeRef = React.useRef<Stroke | null>(null);
  const frameRef = React.useRef<number | null>(null);
  const dprRef = React.useRef(1);
  const { setting } = useSetting();
  const brushColor = String(setting.canvasBrushColor || "red");
  const brushWidth = Number(setting.canvasBrushWidth) || 3;

  const getScrollOffset = React.useCallback(() => {
    const detail = document.querySelector<HTMLElement>(".detail_page");
    if (detail && (detail.scrollTop || detail.scrollLeft)) {
      return {
        x: detail.scrollLeft,
        y: detail.scrollTop,
      };
    }

    return {
      x:
        window.scrollX ||
        document.documentElement.scrollLeft ||
        document.body.scrollLeft ||
        0,
      y:
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0,
    };
  }, []);

  const applyStrokeStyle = React.useCallback(
    (ctx: CanvasRenderingContext2D, stroke: Pick<Stroke, "color" | "width">) => {
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = stroke.color;
      ctx.fillStyle = stroke.color;
    },
    [],
  );

  const drawDot = React.useCallback(
    (ctx: CanvasRenderingContext2D, point: Point, stroke: Stroke) => {
      const offset = getScrollOffset();
      applyStrokeStyle(ctx, stroke);
      ctx.beginPath();
      ctx.arc(
        point.x - offset.x,
        point.y - offset.y,
        stroke.width / 2,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    },
    [applyStrokeStyle, getScrollOffset],
  );

  const drawSegment = React.useCallback(
    (
      ctx: CanvasRenderingContext2D,
      from: Point,
      to: Point,
      stroke: Stroke,
    ) => {
      const offset = getScrollOffset();
      applyStrokeStyle(ctx, stroke);
      ctx.beginPath();
      ctx.moveTo(from.x - offset.x, from.y - offset.y);
      ctx.lineTo(to.x - offset.x, to.y - offset.y);
      ctx.stroke();
    },
    [applyStrokeStyle, getScrollOffset],
  );

  const redrawCanvas = React.useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    ctx.clearRect(
      0,
      0,
      canvas.width / dprRef.current,
      canvas.height / dprRef.current,
    );

    strokesRef.current.forEach((stroke) => {
      const [firstPoint, ...points] = stroke.points;
      if (!firstPoint) return;
      if (points.length === 0) {
        drawDot(ctx, firstPoint, stroke);
        return;
      }

      let previousPoint = firstPoint;
      points.forEach((point) => {
        drawSegment(ctx, previousPoint, point, stroke);
        previousPoint = point;
      });
    });
  }, [drawDot, drawSegment]);

  const scheduleRedraw = React.useCallback(() => {
    if (frameRef.current !== null) return;

    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      redrawCanvas();
    });
  }, [redrawCanvas]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctxRef.current = ctx;

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      dprRef.current = dpr;

      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      redrawCanvas();
    };

    resizeCanvas();

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("scroll", scheduleRedraw, true);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("scroll", scheduleRedraw, true);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [redrawCanvas, scheduleRedraw]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const offset = getScrollOffset();

    return {
      x: e.clientX - rect.left + offset.x,
      y: e.clientY - rect.top + offset.y,
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    const pos = getPos(e);
    if (!pos) return;

    const stroke: Stroke = {
      color: brushColor,
      width: brushWidth,
      points: [pos],
    };

    strokesRef.current.push(stroke);
    activeStrokeRef.current = stroke;
    lastPosRef.current = pos;
    isDrawing.current = true;
    drawDot(ctx, pos, stroke);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const ctx = ctxRef.current;
    const activeStroke = activeStrokeRef.current;
    if (!ctx) return;
    if (!activeStroke) return;

    e.preventDefault();

    const pos = getPos(e);
    if (!pos) return;
    const lastPos = lastPosRef.current || pos;

    activeStroke.points.push(pos);
    drawSegment(ctx, lastPos, pos, activeStroke);
    lastPosRef.current = pos;
  };

  const stopDrawing = () => {
    isDrawing.current = false;
    lastPosRef.current = null;
    activeStrokeRef.current = null;
  };

  const clearCanvas = () => {
    strokesRef.current = [];
    activeStrokeRef.current = null;
    lastPosRef.current = null;
    redrawCanvas();
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 998,
        }}
        className="bg_transparent"
      >
        <canvas
          ref={canvasRef}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 998,
            touchAction: "none",
            pointerEvents: "auto", // 允许画画
          }}
          className="bg_transparent"
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
        />
      </div>

      {/* 操作按钮固定在右上，但不干扰 canvas 滚动 */}
      <div style={{ position: "fixed", top: 0, right: 0, zIndex: 999 }}>
        <Button onClick={onClose} style={{ marginRight: 8 }}>
          关闭画板
        </Button>
        <Button onClick={clearCanvas}>清空</Button>
      </div>
    </>
  );
};
