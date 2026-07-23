"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw, Crop, Loader2 } from "lucide-react";

// Enquadramento de foto de perfil. Canvas com pan + zoom, prévia circular,
// exporta um PNG quadrado. Sem dependência nova (usa Canvas nativo).
const VIEW = 300; // tamanho do quadro na tela
const OUT = 512; // resolução final exportada

export function CropModal({
  file,
  onCancel,
  onConfirm,
}: {
  file: File;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [carregada, setCarregada] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number } | null>(null);

  // Carrega a imagem e centraliza (cobrindo o quadro).
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const cover = Math.max(VIEW / img.width, VIEW / img.height);
      setMinScale(cover);
      setScale(cover);
      setOff({ x: (VIEW - img.width * cover) / 2, y: (VIEW - img.height * cover) / 2 });
      setCarregada(true);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [file]);

  const desenhar = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, VIEW, VIEW);
    ctx.fillStyle = "#171221";
    ctx.fillRect(0, 0, VIEW, VIEW);
    ctx.drawImage(img, off.x, off.y, img.width * scale, img.height * scale);
    // Máscara circular (escurece fora do círculo).
    ctx.save();
    ctx.fillStyle = "rgba(23,18,33,0.62)";
    ctx.beginPath();
    ctx.rect(0, 0, VIEW, VIEW);
    ctx.arc(VIEW / 2, VIEW / 2, VIEW / 2 - 2, 0, Math.PI * 2, true);
    ctx.fill("evenodd");
    ctx.strokeStyle = "#a78bfa";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(VIEW / 2, VIEW / 2, VIEW / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }, [off, scale]);

  useEffect(() => {
    if (carregada) desenhar();
  }, [carregada, desenhar]);

  const clampOff = useCallback((nx: number, ny: number, s: number) => {
    const img = imgRef.current;
    if (!img) return { x: nx, y: ny };
    const w = img.width * s;
    const h = img.height * s;
    const minX = Math.min(0, VIEW - w);
    const minY = Math.min(0, VIEW - h);
    return { x: Math.max(minX, Math.min(0, nx)), y: Math.max(minY, Math.min(0, ny)) };
  }, []);

  function onPointerDown(e: React.PointerEvent) {
    drag.current = { x: e.clientX - off.x, y: e.clientY - off.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    setOff(clampOff(e.clientX - drag.current.x, e.clientY - drag.current.y, scale));
  }
  function onPointerUp() {
    drag.current = null;
  }

  function aplicarZoom(novo: number) {
    if (!imgRef.current) return;
    const s = Math.max(minScale, Math.min(minScale * 4, novo));
    const cx = VIEW / 2, cy = VIEW / 2;
    const rx = (cx - off.x) / scale;
    const ry = (cy - off.y) / scale;
    setScale(s);
    setOff(clampOff(cx - rx * s, cy - ry * s, s));
  }
  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    aplicarZoom(scale * (e.deltaY < 0 ? 1.08 : 0.92));
  }
  function centralizar() {
    const img = imgRef.current;
    if (!img) return;
    setScale(minScale);
    setOff({ x: (VIEW - img.width * minScale) / 2, y: (VIEW - img.height * minScale) / 2 });
  }

  function confirmar() {
    const img = imgRef.current;
    if (!img) return;
    setGerando(true);
    const out = document.createElement("canvas");
    out.width = OUT;
    out.height = OUT;
    const ctx = out.getContext("2d");
    if (!ctx) { setGerando(false); return; }
    const k = OUT / VIEW;
    ctx.fillStyle = "#171221";
    ctx.fillRect(0, 0, OUT, OUT);
    ctx.drawImage(img, off.x * k, off.y * k, img.width * scale * k, img.height * scale * k);
    out.toBlob((blob) => {
      setGerando(false);
      if (blob) onConfirm(blob);
    }, "image/png", 0.92);
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-ink-line bg-ink-soft shadow-2xl">
        <div className="flex items-center justify-between border-b border-ink-line px-5 py-4">
          <h3 className="flex items-center gap-2 font-display text-base uppercase text-gelo"><Crop className="h-4 w-4" /> Enquadrar foto</h3>
          <button onClick={onCancel} className="text-gelo-dim hover:text-gelo"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex flex-col items-center gap-4 p-5">
          <div className="relative overflow-hidden rounded-xl border border-ink-line" style={{ width: VIEW, height: VIEW, maxWidth: "100%" }}>
            {!carregada && <div className="flex h-full items-center justify-center text-gelo-dim"><Loader2 className="h-5 w-5 animate-spin" /></div>}
            <canvas
              ref={canvasRef}
              width={VIEW}
              height={VIEW}
              className={`touch-none ${carregada ? "block" : "hidden"} cursor-grab active:cursor-grabbing`}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
              onWheel={onWheel}
            />
          </div>
          <div className="flex w-full items-center gap-3">
            <button onClick={() => aplicarZoom(scale * 0.9)} className="rounded-lg border border-ink-line bg-ink p-2 text-gelo-dim hover:text-gelo" aria-label="Menos zoom"><ZoomOut className="h-4 w-4" /></button>
            <input type="range" min={minScale} max={minScale * 4} step={0.01} value={scale} onChange={(e) => aplicarZoom(Number(e.target.value))} className="flex-1 accent-[#6d28d9]" />
            <button onClick={() => aplicarZoom(scale * 1.1)} className="rounded-lg border border-ink-line bg-ink p-2 text-gelo-dim hover:text-gelo" aria-label="Mais zoom"><ZoomIn className="h-4 w-4" /></button>
            <button onClick={centralizar} className="rounded-lg border border-ink-line bg-ink p-2 text-gelo-dim hover:text-gelo" aria-label="Centralizar"><RotateCcw className="h-4 w-4" /></button>
          </div>
          <p className="text-[11px] text-gelo-dim/60">Arraste para mover, use a barra ou a rolagem para dar zoom.</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-ink-line px-5 py-4">
          <button onClick={onCancel} className="rounded-lg border border-ink-line px-4 py-2 text-sm text-gelo-dim hover:text-gelo">Cancelar</button>
          <button onClick={confirmar} disabled={!carregada || gerando} className="flex items-center gap-2 rounded-lg bg-roxo px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
            {gerando ? <><Loader2 className="h-4 w-4 animate-spin" /> Gerando…</> : "Usar foto"}
          </button>
        </div>
      </div>
    </div>
  );
}
