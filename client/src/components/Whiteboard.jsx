
import { useEffect, useRef, useState } from "react";
import {
  Pencil,
  Eraser,
  Trash2,
  Minus,
  Plus,
  X,
  Maximize2,
} from "lucide-react";

function Whiteboard({ onClose, socket, meetingId }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const lastPositionRef = useRef({
    x: 0,
    y: 0,
  });

  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);
  const [minimized, setMinimized] = useState(false);

  // =========================
  // CANVAS SETUP
  // =========================

  useEffect(() => {
    if (minimized) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();

      if (rect.width === 0 || rect.height === 0) return;

      const oldCanvas = document.createElement("canvas");

      oldCanvas.width = canvas.width;
      oldCanvas.height = canvas.height;

      if (canvas.width > 0 && canvas.height > 0) {
        const oldCtx = oldCanvas.getContext("2d");

        oldCtx.drawImage(
          canvas,
          0,
          0,
          canvas.width,
          canvas.height
        );
      }

      canvas.width = rect.width;
      canvas.height = rect.height;

      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "#ffffff";

      ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      if (oldCanvas.width > 0 && oldCanvas.height > 0) {
        ctx.drawImage(
          oldCanvas,
          0,
          0,
          oldCanvas.width,
          oldCanvas.height,
          0,
          0,
          canvas.width,
          canvas.height
        );
      }
    };

    resizeCanvas();

    window.addEventListener(
      "resize",
      resizeCanvas
    );

    return () => {
      window.removeEventListener(
        "resize",
        resizeCanvas
      );
    };
  }, [minimized]);

  // =========================
  // POSITION
  // =========================

  const getPosition = (event) => {
    const canvas = canvasRef.current;

    const rect = canvas.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  // =========================
  // START DRAWING
  // =========================

  const startDrawing = (event) => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    const { x, y } = getPosition(event);

    ctx.beginPath();

    ctx.moveTo(x, y);

    lastPositionRef.current = {
      x,
      y,
    };

    setIsDrawing(true);
  };

  // =========================
  // DRAW
  // =========================

  const draw = (event) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    const { x, y } = getPosition(event);

    const {
      x: prevX,
      y: prevY,
    } = lastPositionRef.current;

    const drawColor =
      tool === "eraser"
        ? "#ffffff"
        : color;

    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = drawColor;

    ctx.beginPath();

    ctx.moveTo(
      prevX,
      prevY
    );

    ctx.lineTo(
      x,
      y
    );

    ctx.stroke();

    // Send to other users
    if (
      socket &&
      socket.connected &&
      meetingId
    ) {
      socket.emit(
        "whiteboard-draw",
        {
          meetingId,
          x,
          y,
          prevX,
          prevY,
          color: drawColor,
          size: brushSize,
        }
      );
    }

    lastPositionRef.current = {
      x,
      y,
    };
  };

  // =========================
  // STOP DRAWING
  // =========================

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // =========================
  // RECEIVE DRAWING
  // =========================

  useEffect(() => {
    if (!socket) return;

    const handleRemoteDrawing = (data) => {
      const canvas = canvasRef.current;

      if (!canvas) return;

      const ctx = canvas.getContext("2d");

      ctx.lineWidth = data.size || 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = data.color || "#000000";

      ctx.beginPath();

      ctx.moveTo(
        data.prevX,
        data.prevY
      );

      ctx.lineTo(
        data.x,
        data.y
      );

      ctx.stroke();

      ctx.closePath();
    };

    socket.on(
      "whiteboard-draw",
      handleRemoteDrawing
    );

    return () => {
      socket.off(
        "whiteboard-draw",
        handleRemoteDrawing
      );
    };
  }, [socket]);

  // =========================
  // CLEAR BOARD
  // =========================

  const clearBoard = () => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";

    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );
  };

  // =========================
  // BRUSH
  // =========================

  const increaseBrush = () => {
    setBrushSize(
      (current) =>
        Math.min(current + 2, 30)
    );
  };

  const decreaseBrush = () => {
    setBrushSize(
      (current) =>
        Math.max(current - 2, 1)
    );
  };

  // =========================
  // CLOSE
  // =========================

  const handleClose = (event) => {
    event.stopPropagation();

    setIsDrawing(false);

    if (onClose) {
      onClose();
    }
  };

  // =========================
  // UI
  // =========================

  return (
    <div
      className={`fixed z-50 ${
        minimized
          ? "bottom-5 right-5 w-[280px]"
          : "inset-0 flex items-center justify-center bg-black/60 p-4"
      }`}
    >

      <div
        className={`flex flex-col overflow-hidden bg-white shadow-2xl ${
          minimized
            ? "w-full rounded-xl"
            : "h-[90vh] w-full max-w-6xl rounded-2xl"
        }`}
      >

        {/* ================= HEADER ================= */}

        <div className="flex items-center justify-between border-b bg-slate-900 px-5 py-3 text-white">

          <div>
            <h2 className="text-lg font-semibold">
              🎨 Collaborative Whiteboard
            </h2>

            {!minimized && (
              <p className="text-xs text-slate-300">
                Draw and collaborate in real-time
              </p>
            )}
          </div>

          <div className="flex items-center gap-1">

            {/* MINIMIZE / RESTORE */}

            <button
              type="button"
              onClick={() =>
                setMinimized(
                  (current) => !current
                )
              }
              className="rounded-lg p-2 hover:bg-white/10"
              title={
                minimized
                  ? "Restore Whiteboard"
                  : "Minimize Whiteboard"
              }
            >
              {minimized ? (
                <Maximize2 size={18} />
              ) : (
                <Minus size={20} />
              )}
            </button>

            {/* CLOSE */}

            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg p-2 hover:bg-red-500/30"
              title="Close Whiteboard"
            >
              <X size={20} />
            </button>

          </div>

        </div>

        {/* ================= CONTENT ================= */}

        {!minimized && (
          <>

            {/* TOOLBAR */}

            <div className="flex flex-wrap items-center gap-2 border-b bg-slate-50 px-4 py-3">

              {/* PEN */}

              <button
                type="button"
                onClick={() =>
                  setTool("pen")
                }
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                  tool === "pen"
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Pencil size={17} />
                Pen
              </button>

              {/* ERASER */}

              <button
                type="button"
                onClick={() =>
                  setTool("eraser")
                }
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                  tool === "eraser"
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Eraser size={17} />
                Eraser
              </button>

              {/* COLOR */}

              <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2">

                <span className="text-sm text-slate-600">
                  Color
                </span>

                <input
                  type="color"
                  value={color}
                  onChange={(event) => {
                    setColor(
                      event.target.value
                    );

                    setTool("pen");
                  }}
                  className="h-7 w-9 cursor-pointer"
                />

              </div>

              {/* BRUSH */}

              <div className="flex items-center gap-2 rounded-lg bg-white px-2 py-1">

                <button
                  type="button"
                  onClick={decreaseBrush}
                  className="rounded-md p-1.5 hover:bg-slate-200"
                >
                  <Minus size={16} />
                </button>

                <span className="min-w-[35px] text-center text-sm font-medium">
                  {brushSize}px
                </span>

                <button
                  type="button"
                  onClick={increaseBrush}
                  className="rounded-md p-1.5 hover:bg-slate-200"
                >
                  <Plus size={16} />
                </button>

              </div>

              {/* CLEAR */}

              <button
                type="button"
                onClick={clearBoard}
                className="ml-auto flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
              >
                <Trash2 size={17} />
                Clear
              </button>

            </div>

            {/* CANVAS */}

            <div
              ref={containerRef}
              className="relative flex-1 overflow-hidden bg-white"
            >

              <canvas
                ref={canvasRef}
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerCancel={stopDrawing}
                onPointerLeave={stopDrawing}
                className="block h-full w-full cursor-crosshair touch-none"
              />

            </div>

            {/* FOOTER */}

            <div className="border-t bg-slate-50 px-4 py-2 text-center text-xs text-slate-500">

              {tool === "pen"
                ? "✏️ Pen mode — Start drawing"
                : "🧹 Eraser mode — Erase drawing"}

            </div>

          </>
        )}

      </div>

    </div>
  );
}

export default Whiteboard;

