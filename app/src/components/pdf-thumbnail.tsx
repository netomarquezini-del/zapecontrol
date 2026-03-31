'use client';

import { useState, useEffect, useRef } from 'react';
import { FileText, Loader2 } from 'lucide-react';

interface PdfThumbnailProps {
  url: string;
  className?: string;
}

export function PdfThumbnail({ url, className = '' }: PdfThumbnailProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function renderThumbnail() {
      try {
        // Dynamic import to avoid SSR issues
        const pdfjsLib = await import('pdfjs-dist');

        // cdnjs doesn't carry v5 — use unpkg which mirrors npm exactly
        const workerUrl = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

        const loadingTask = pdfjsLib.getDocument({
          url,
          disableAutoFetch: true,
          disableStream: true,
        });

        const pdf = await loadingTask.promise;
        if (cancelled) return;

        const page = await pdf.getPage(1);
        if (cancelled) return;

        const targetWidth = 400;
        const originalViewport = page.getViewport({ scale: 1 });
        const scale = targetWidth / originalViewport.width;
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // pdfjs-dist v5: use canvas directly (recommended over canvasContext)
        await page.render({
          canvas,
          viewport,
        }).promise;

        if (cancelled) return;

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setImageSrc(dataUrl);
        setLoading(false);
      } catch (err) {
        console.warn('[PdfThumbnail] Error:', err);
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    renderThumbnail();

    return () => {
      cancelled = true;
    };
  }, [url]);

  const hiddenCanvas = (
    <canvas ref={canvasRef} style={{ display: 'none', position: 'absolute' }} />
  );

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-[#0A0A0A] ${className}`}>
        {hiddenCanvas}
        <Loader2 size={20} className="text-zinc-600 animate-spin" />
      </div>
    );
  }

  if (error || !imageSrc) {
    return (
      <div className={`flex items-center justify-center bg-[#0e0e0e] ${className}`}>
        {hiddenCanvas}
        <div className="w-14 h-14 rounded-xl bg-red-500/8 border border-red-500/15 flex items-center justify-center">
          <FileText size={24} className="text-red-400" />
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden bg-[#0A0A0A] ${className}`}>
      {hiddenCanvas}
      <img
        src={imageSrc}
        alt="PDF preview"
        className="w-full h-full object-cover object-top"
        draggable={false}
      />
    </div>
  );
}
