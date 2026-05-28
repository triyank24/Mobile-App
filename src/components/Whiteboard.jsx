import React, { useRef, useEffect, useState } from 'react';
import { rtdb } from '../services/firebase';
import { ref, onChildAdded, push, set, onValue } from 'firebase/database';

export default function Whiteboard({ roomId }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000'); // Pen color
  const ctxRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth || 350;
    canvas.height = canvas.offsetHeight || 300;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineWidth = 2;
    ctxRef.current = ctx;

    const strokesRef = ref(rtdb, `rooms/${roomId}/whiteboard`);
    
    // Listen for clear events
    const valueUnsub = onValue(strokesRef, (snapshot) => {
      if (!snapshot.exists()) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });

    const childUnsub = onChildAdded(strokesRef, (data) => {
      const stroke = data.val();
      if (stroke) {
        drawOnCanvas(stroke.x0, stroke.y0, stroke.x1, stroke.y1, stroke.color, stroke.lineWidth, false);
      }
    });

    return () => {
      valueUnsub();
      childUnsub();
    };
  }, [roomId]);

  const drawOnCanvas = (x0, y0, x1, y1, strokeColor, lineWidth, emit) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    ctx.closePath();

    if (!emit) return;
    const strokesRef = ref(rtdb, `rooms/${roomId}/whiteboard`);
    push(strokesRef, {
      x0, y0, x1, y1,
      color: strokeColor,
      lineWidth
    });
  };

  const currentPos = useRef({ x: 0, y: 0 });

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    // Support for both mouse and touch events
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const onPointerDown = (e) => {
    setIsDrawing(true);
    currentPos.current = getPos(e);
  };

  const onPointerMove = (e) => {
    if (!isDrawing) return;
    const newPos = getPos(e);
    drawOnCanvas(currentPos.current.x, currentPos.current.y, newPos.x, newPos.y, color, color === '#ffffff' ? 15 : 2, true);
    currentPos.current = newPos;
  };

  const onPointerUp = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const strokesRef = ref(rtdb, `rooms/${roomId}/whiteboard`);
    set(strokesRef, null); // Clear all strokes in DB
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <canvas
        ref={canvasRef}
        onMouseDown={onPointerDown}
        onMouseMove={onPointerMove}
        onMouseUp={onPointerUp}
        onMouseOut={onPointerUp}
        onTouchStart={onPointerDown}
        onTouchMove={onPointerMove}
        onTouchEnd={onPointerUp}
        style={{ flex: 1, cursor: 'crosshair', touchAction: 'none' }}
      />
      <div className="whiteboard-tools">
        <button className="tool-btn btn-primary" onClick={() => setColor('#000000')}>Pen</button>
        <button className="tool-btn btn-outline" style={{color: 'black', borderColor: '#ccc'}} onClick={() => setColor('#ffffff')}>Erase</button>
        <button className="tool-btn btn-outline" style={{color: 'red', borderColor: 'red'}} onClick={clearCanvas}>Clear</button>
      </div>
    </div>
  );
}
