import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';

const PRESETS = {
  hat: { x: 0, y: -205, w: 520 },
  beard: { x: 0, y: 165, w: 520 },
  moustache: { x: 0, y: 40, w: 420 }
};

const CanvasEditor = forwardRef(function CanvasEditor(
  {
    width = 640,
    height = 640,
    baseImage,
    overlayText,
    accentColor,
    accessories,
    layerOrder,
    scale,
    offsetX,
    offsetY,
    onOffsetChange,
    activeLayer = 'base',
    onActiveLayerChange,
    onAccessoryChange,
    hue,
    saturation,
    badge
  },
  ref
) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const hatRef = useRef(null);
  const beardRef = useRef(null);
  const moustacheRef = useRef(null);
  const dragRef = useRef({
    dragging: false,
    pointerId: null,
    startCanvasX: 0,
    startCanvasY: 0,
    moved: false,
    dragLayer: 'base',
    wasSelected: false,
    mode: 'move',
    handle: null,
    startScale: 1,
    startDist: 1,
    centerX: 0,
    centerY: 0,
    baseOffsetX: 0,
    baseOffsetY: 0,
    hatX: 0,
    hatY: 0,
    beardX: 0,
    beardY: 0,
    moustacheX: 0,
    moustacheY: 0
  });

  const getCanvasPoint = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * sx,
      y: (e.clientY - rect.top) * sy
    };
  };

  const getAccessoryRect = (kind) => {
    const img = kind === 'hat' ? hatRef.current : kind === 'beard' ? beardRef.current : moustacheRef.current;
    const src = kind === 'hat' ? hatSrc : kind === 'beard' ? beardSrc : moustacheSrc;
    if (!img || !src) return null;

    const preset = PRESETS[kind];
    if (!preset) return null;
    const t = accessories?.[kind] ?? {};
    const x = Number.isFinite(t.x) ? t.x : preset.x;
    const y = Number.isFinite(t.y) ? t.y : preset.y;
    const s = Number.isFinite(t.scale) ? t.scale : 1;

    const aspect = img.height / img.width;
    const w = preset.w * s;
    const h = w * aspect;
    const cx = width / 2 + offsetX + x;
    const cy = height / 2 + offsetY + y;

    return { left: cx - w / 2, top: cy - h / 2, right: cx + w / 2, bottom: cy + h / 2 };
  };

  const getAccessoryBox = (kind) => {
    const img = kind === 'hat' ? hatRef.current : kind === 'beard' ? beardRef.current : moustacheRef.current;
    const src = kind === 'hat' ? hatSrc : kind === 'beard' ? beardSrc : moustacheSrc;
    if (!img || !src) return null;
    const preset = PRESETS[kind];
    if (!preset) return null;

    const t = accessories?.[kind] ?? {};
    const x = Number.isFinite(t.x) ? t.x : preset.x;
    const y = Number.isFinite(t.y) ? t.y : preset.y;
    const s = Number.isFinite(t.scale) ? t.scale : 1;

    const aspect = img.height / img.width;
    const w = preset.w * s;
    const h = w * aspect;
    const cx = width / 2 + offsetX + x;
    const cy = height / 2 + offsetY + y;
    return {
      kind,
      x,
      y,
      scale: s,
      cx,
      cy,
      w,
      h,
      rect: { left: cx - w / 2, top: cy - h / 2, right: cx + w / 2, bottom: cy + h / 2 }
    };
  };

  const getHandlesForBox = (box) => {
    const { rect } = box;
    const mx = (rect.left + rect.right) / 2;
    const my = (rect.top + rect.bottom) / 2;
    return [
      { id: 'nw', x: rect.left, y: rect.top },
      { id: 'n', x: mx, y: rect.top },
      { id: 'ne', x: rect.right, y: rect.top },
      { id: 'e', x: rect.right, y: my },
      { id: 'se', x: rect.right, y: rect.bottom },
      { id: 's', x: mx, y: rect.bottom },
      { id: 'sw', x: rect.left, y: rect.bottom },
      { id: 'w', x: rect.left, y: my }
    ];
  };

  const hitTestHandle = (kind, pt) => {
    const box = getAccessoryBox(kind);
    if (!box) return null;
    const HANDLE_R = 10;
    const handles = getHandlesForBox(box);
    for (const h of handles) {
      if (Math.abs(pt.x - h.x) <= HANDLE_R && Math.abs(pt.y - h.y) <= HANDLE_R) return h.id;
    }
    return null;
  };

  const hitTestAccessory = (pt) => {
    const order = Array.isArray(layerOrder) && layerOrder.length ? layerOrder : ['hat', 'moustache', 'beard'];
    // Topmost first
    for (const kind of [...order].reverse()) {
      const r = getAccessoryRect(kind);
      if (!r) continue;
      if (pt.x >= r.left && pt.x <= r.right && pt.y >= r.top && pt.y <= r.bottom) return kind;
    }
    return null;
  };

  const stars = useMemo(
    () =>
      Array.from({ length: 32 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.6,
        a: 0.3 + Math.random() * 0.5
      })),
    [width, height]
  );

  const hatSrc = accessories?.hat?.src ?? accessories?.hat ?? null;
  const beardSrc = accessories?.beard?.src ?? accessories?.beard ?? null;
  const moustacheSrc = accessories?.moustache?.src ?? accessories?.moustache ?? null;

  const drawAccessory = (ctx, img, kind) => {
    if (!img) return;
    const preset = PRESETS[kind];
    if (!preset) return;

    const t = accessories?.[kind] ?? {};
    const x = Number.isFinite(t.x) ? t.x : preset.x;
    const y = Number.isFinite(t.y) ? t.y : preset.y;
    const s = Number.isFinite(t.scale) ? t.scale : 1;
    const flipX = Boolean(t.flipX);

    const aspect = img.height / img.width;
    const w = preset.w * s;
    const h = w * aspect;
    const cx = width / 2 + offsetX + x;
    const cy = height / 2 + offsetY + y;

    ctx.save();
    ctx.globalAlpha = 0.98;
    ctx.translate(cx, cy);
    if (flipX) ctx.scale(-1, 1);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  };

  const drawBadge = (ctx) => {
      if (!badge?.subtitle) return;
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = 'rgba(14, 11, 24, 0.7)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 2;
      const pad = 16;
      const h = 40;
      const w = 200;
      const x = width - w - pad;
      const y = height - h - pad;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 14);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = accentColor;
      ctx.font = '700 15px Fredoka, sans-serif';
      ctx.fillText(badge.subtitle, x + 16, y + 26);
      ctx.restore();
    };

  useEffect(() => {
    if (!baseImage) {
      imageRef.current = null;
      draw();
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      draw();
    };
    img.onerror = () => {
      imageRef.current = null;
      draw();
    };
    img.src = baseImage;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseImage]);

  useEffect(() => {
    const load = (src, target) => {
      if (!src) {
        target.current = null;
        draw();
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        target.current = img;
        draw();
      };
      img.onerror = () => {
        target.current = null;
        draw();
      };
      img.src = src;
    };

    load(hatSrc, hatRef);
    load(beardSrc, beardRef);
    load(moustacheSrc, moustacheRef);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hatSrc, beardSrc, moustacheSrc]);

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    overlayText,
    accentColor,
    scale,
    offsetX,
    offsetY,
    hue,
    saturation,
    badge?.subtitle,
    accessories
  ]);

  useImperativeHandle(ref, () => ({
    exportImage: () => canvasRef.current?.toDataURL('image/png') || null
  }));

  const canDrag = typeof onOffsetChange === 'function' || typeof onAccessoryChange === 'function';

  const handlePointerDown = (e) => {
    if (!canDrag) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pt = getCanvasPoint(e);
    const hit = hitTestAccessory(pt);
    const nextLayer = hit || 'base';

    if (typeof onActiveLayerChange === 'function') {
      onActiveLayerChange(nextLayer);
    }

    const prevSelected = activeLayer || 'base';
    let mode = 'move';
    let handle = null;
    if (nextLayer !== 'base' && nextLayer === prevSelected) {
      handle = hitTestHandle(nextLayer, pt);
      if (handle) mode = 'resize';
    }

    dragRef.current.dragging = true;
    dragRef.current.pointerId = e.pointerId;
    dragRef.current.startCanvasX = pt.x;
    dragRef.current.startCanvasY = pt.y;
    dragRef.current.moved = false;
    dragRef.current.dragLayer = nextLayer;
    dragRef.current.wasSelected = (activeLayer || 'base') === nextLayer;
    dragRef.current.mode = mode;
    dragRef.current.handle = handle;
    dragRef.current.baseOffsetX = offsetX;
    dragRef.current.baseOffsetY = offsetY;
    dragRef.current.hatX = accessories?.hat?.x ?? 0;
    dragRef.current.hatY = accessories?.hat?.y ?? 0;
    dragRef.current.beardX = accessories?.beard?.x ?? 0;
    dragRef.current.beardY = accessories?.beard?.y ?? 0;
    dragRef.current.moustacheX = accessories?.moustache?.x ?? 0;
    dragRef.current.moustacheY = accessories?.moustache?.y ?? 0;

    const activeKind = nextLayer;
    if (activeKind !== 'base') {
      const current = accessories?.[activeKind] ?? {};
      const startScale = Number.isFinite(current.scale) ? current.scale : 1;
      dragRef.current.startScale = startScale;

      const box = getAccessoryBox(activeKind);
      if (box) {
        dragRef.current.centerX = box.cx;
        dragRef.current.centerY = box.cy;
        const dx0 = pt.x - box.cx;
        const dy0 = pt.y - box.cy;
        dragRef.current.startDist = Math.max(8, Math.hypot(dx0, dy0));
      } else {
        dragRef.current.centerX = width / 2 + offsetX;
        dragRef.current.centerY = height / 2 + offsetY;
        dragRef.current.startDist = 80;
      }
    }

    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = (e) => {
    if (!canDrag) return;
    const state = dragRef.current;
    if (!state.dragging) return;
    if (state.pointerId !== e.pointerId) return;

    const pt = getCanvasPoint(e);
    const dx = pt.x - state.startCanvasX;
    const dy = pt.y - state.startCanvasY;

    if (!state.moved && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) state.moved = true;

    const layer = state.dragLayer || activeLayer || 'base';
    if (layer === 'base') {
      if (typeof onOffsetChange !== 'function') return;
      onOffsetChange(state.baseOffsetX + dx, state.baseOffsetY + dy);
      return;
    }

    if (typeof onAccessoryChange !== 'function') return;

    if (state.mode === 'resize') {
      const d = Math.max(1, Math.hypot(pt.x - state.centerX, pt.y - state.centerY));
      const ratio = d / Math.max(1, state.startDist);
      const MIN = 0.5;
      const MAX = 1.8;
      const nextScale = Math.min(MAX, Math.max(MIN, Number((state.startScale * ratio).toFixed(2))));
      onAccessoryChange(layer, { scale: nextScale });
      return;
    }

    if (layer === 'hat') {
      onAccessoryChange('hat', { x: state.hatX + dx, y: state.hatY + dy });
      return;
    }
    if (layer === 'beard') {
      onAccessoryChange('beard', { x: state.beardX + dx, y: state.beardY + dy });
      return;
    }
    if (layer === 'moustache') {
      onAccessoryChange('moustache', { x: state.moustacheX + dx, y: state.moustacheY + dy });
    }
  };

  const stopDrag = (e) => {
    const state = dragRef.current;
    if (!state.dragging) return;
    if (state.pointerId !== null && e?.pointerId != null && state.pointerId !== e.pointerId) return;

    state.dragging = false;
    state.pointerId = null;
  };

  const drawSelection = (ctx) => {
    const kind = activeLayer;
    if (kind !== 'hat' && kind !== 'beard' && kind !== 'moustache') return;
    const box = getAccessoryBox(kind);
    if (!box) return;

    const stroke = accentColor || '#ff365d';
    const { rect } = box;
    const handles = getHandlesForBox(box);
    const HANDLE_SIZE = 10;

    ctx.save();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top);

    ctx.fillStyle = stroke;
    for (const h of handles) {
      ctx.fillRect(h.x - HANDLE_SIZE / 2, h.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
    }
    ctx.restore();
  };

  const drawBackground = (ctx) => {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#2a0606');
    gradient.addColorStop(1, '#8b0b0b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    stars.forEach((s) => {
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${s.a})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    const vignette = ctx.createRadialGradient(width / 2, height / 2, width * 0.1, width / 2, height / 2, width * 0.65);
    vignette.addColorStop(0, 'rgba(255, 255, 255, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    drawBackground(ctx);

    if (imageRef.current) {
      const img = imageRef.current;
      const scaledW = img.width * scale;
      const scaledH = img.height * scale;
      ctx.save();
      ctx.translate(width / 2 + offsetX, height / 2 + offsetY);
      ctx.filter = `saturate(${saturation}%) hue-rotate(${hue}deg)`;
      ctx.drawImage(img, -scaledW / 2, -scaledH / 2, scaledW, scaledH);
      ctx.restore();
    } else {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.setLineDash([10, 12]);
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 40, width - 80, height - 80);
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.font = '600 18px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Drop an image or generate with AI', width / 2, height / 2);
      ctx.restore();
    }

    const order = Array.isArray(layerOrder) && layerOrder.length ? layerOrder : ['hat', 'moustache', 'beard'];
    for (const kind of order) {
      if (kind === 'hat') drawAccessory(ctx, hatRef.current, 'hat');
      else if (kind === 'moustache') drawAccessory(ctx, moustacheRef.current, 'moustache');
      else if (kind === 'beard') drawAccessory(ctx, beardRef.current, 'beard');
    }

    if (overlayText) {
      ctx.save();
      ctx.fillStyle = '#0b0a12';
      ctx.globalAlpha = 0.35;
      ctx.filter = 'blur(12px)';
      ctx.fillRect(30, height - 90, width - 60, 70);
      ctx.restore();

      ctx.save();
      ctx.fillStyle = accentColor || '#ff365d';
      ctx.textAlign = 'center';
      ctx.font = '700 54px Fredoka, sans-serif';
      ctx.shadowColor = `${accentColor}88`;
      ctx.shadowBlur = 16;
      ctx.fillText(overlayText, width / 2, height - 38);
      ctx.restore();
    }

    drawBadge(ctx);
    drawSelection(ctx);
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDrag}
      onPointerCancel={stopDrag}
      onPointerLeave={stopDrag}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        touchAction: 'none',
        cursor: canDrag ? 'grab' : 'default'
      }}
    />
  );
});

CanvasEditor.displayName = 'CanvasEditor';

export default CanvasEditor;
