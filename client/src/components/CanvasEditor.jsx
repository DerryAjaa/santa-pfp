import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';

const CanvasEditor = forwardRef(
  (
    {
      width = 640,
      height = 640,
      baseImage,
      overlayText,
      accentColor,
      hatEnabled,
      glow,
      frostEdge,
      scale,
      offsetX,
      offsetY,
      hue,
      saturation,
      ring,
      badge
    },
    ref
  ) => {
    const canvasRef = useRef(null);
    const imageRef = useRef(null);

    const stars = useMemo(
      () => Array.from({ length: 32 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.6,
        a: 0.3 + Math.random() * 0.5
      })),
      [width, height]
    );

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
      img.src = baseImage;
    }, [baseImage]);

    useEffect(() => {
      draw();
    }, [overlayText, accentColor, hatEnabled, glow, frostEdge, scale, offsetX, offsetY, hue, saturation, ring, badge]);

    useImperativeHandle(ref, () => ({
      exportImage: () => canvasRef.current?.toDataURL('image/png') || null
    }));

    const drawBackground = (ctx) => {
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#19070d');
      gradient.addColorStop(1, '#220a17');
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

    const drawHat = (ctx) => {
      ctx.save();
      ctx.translate(width * 0.5, height * 0.15);
      ctx.rotate(-0.08);
      ctx.beginPath();
      ctx.moveTo(-120, 40);
      ctx.quadraticCurveTo(0, -120, 140, 50);
      ctx.closePath();
      ctx.fillStyle = '#d61b34';
      ctx.shadowColor = 'rgba(255, 54, 93, 0.35)';
      ctx.shadowBlur = 20;
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(-130, 40);
      ctx.quadraticCurveTo(0, 10, 160, 60);
      ctx.quadraticCurveTo(0, 80, -130, 40);
      ctx.fillStyle = '#f7f7f8';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(170, 40, 22, 0, Math.PI * 2);
      ctx.fillStyle = '#f7f7f8';
      ctx.fill();
      ctx.restore();
    };

    const drawRing = (ctx) => {
      if (!ring) return;
      const grad = ctx.createRadialGradient(width / 2, height / 2, width * 0.2, width / 2, height / 2, width * 0.5);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(0.6, `${accentColor}33`);
      grad.addColorStop(1, `${accentColor}00`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 18;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, width * 0.33, 0, Math.PI * 2);
      ctx.stroke();
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

    const drawFrost = (ctx) => {
      if (!frostEdge) return;
      const ringGrad = ctx.createRadialGradient(width / 2, height / 2, width * 0.2, width / 2, height / 2, width * 0.48);
      ringGrad.addColorStop(0.7, 'rgba(255,255,255,0)');
      ringGrad.addColorStop(1, 'rgba(255,255,255,0.35)');
      ctx.strokeStyle = ringGrad;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, width * 0.42, 0, Math.PI * 2);
      ctx.stroke();
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
        if (glow) {
          ctx.shadowColor = `${accentColor}55`;
          ctx.shadowBlur = 35;
        }
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

      if (hatEnabled) {
        drawHat(ctx);
      }

      drawRing(ctx);
      drawFrost(ctx);

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
    };

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    );
  }
);

CanvasEditor.displayName = 'CanvasEditor';

export default CanvasEditor;
