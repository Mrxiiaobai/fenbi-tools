import { Button } from "antd";
import * as React from "react";

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
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const ctxRef = React.useRef<CanvasRenderingContext2D | null>(null);
  const isDrawing = React.useRef(false);

  React.useEffect(() => {
    const canvas = canvasRef.current!;
    const dpr = window.devicePixelRatio || 1;

    const detail = document.querySelector(".detail_page") as HTMLElement;
    if (!detail) return;

    // 覆盖整个 detail_page （可滚动区域）
    const cssWidth = detail.clientWidth;
    const cssHeight = detail.scrollHeight;

    // 设置 CSS 尺寸
    canvas.style.width = cssWidth + "px";
    canvas.style.height = cssHeight + "px";

    // 设置实际绘制尺寸（高分辨率）
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;

    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "red";

    ctxRef.current = ctx;
  }, []);

  const getPos = (e: any) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scrollTop = document.querySelector(".detail_page")!.scrollTop;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      // 关键点：加上滚动偏移
      y: clientY - rect.top + scrollTop,
    };
  };

  const startDrawing = (e: any) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    isDrawing.current = true;
  };

  const draw = (e: any) => {
    if (!isDrawing.current) return;
    const ctx = ctxRef.current;
    if (!ctx) return;

    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current!;
    const ctx = ctxRef.current;
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
      className="bg_transparent"
    >
      <canvas
        ref={canvasRef}
        style={{
          border: "1px solid #cccccc",
          position: "absolute",
          top: 0,
          left: 0,
          touchAction: "none",
          pointerEvents: "auto", // 允许画画
        }}
        className="bg_transparent"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />

      {/* 操作按钮固定在右上，但不干扰 canvas 滚动 */}
      <div style={{ position: "fixed", top: 0, right: 0, zIndex: 999 }}>
        <Button onClick={onClose} style={{ marginRight: 8 }}>
          关闭画板
        </Button>
        <Button onClick={clearCanvas}>清空</Button>
      </div>
    </div>
  );
};
