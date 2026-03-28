import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

export default function ImageComparison({ original, reconstructed }) {
  const [sliderX, setSliderX] = useState(50); // percentage
  const containerRef = useRef(null);
  const dragging = useRef(false);

  const updateSlider = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSliderX(pct);
  }, []);

  const onMouseDown = (e) => { dragging.current = true; updateSlider(e.clientX); };
  const onMouseMove = (e) => { if (dragging.current) updateSlider(e.clientX); };
  const onMouseUp   = () => { dragging.current = false; };
  const onTouchStart = (e) => { dragging.current = true; updateSlider(e.touches[0].clientX); };
  const onTouchMove  = (e) => { if (dragging.current) updateSlider(e.touches[0].clientX); };
  const onTouchEnd   = () => { dragging.current = false; };

  const origSrc  = `data:image/webp;base64,${original}`;
  const reconSrc = `data:image/webp;base64,${reconstructed}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-4 sm:p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Image Comparison</h3>
        <p className="text-xs text-slate-500">Drag the slider to compare</p>
      </div>

      {/* Comparison slider */}
      <div
        ref={containerRef}
        className="relative select-none overflow-hidden rounded-xl cursor-ew-resize"
        style={{ aspectRatio: '16/9', maxHeight: '400px' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Reconstructed (full width, behind) */}
        <img
          src={reconSrc}
          alt="Reconstructed"
          className="absolute inset-0 w-full h-full object-contain bg-slate-950"
          draggable={false}
        />

        {/* Original (clipped to left of slider) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderX}%` }}
        >
          <img
            src={origSrc}
            alt="Original"
            className="absolute inset-0 w-full h-full object-contain bg-slate-900"
            style={{ width: `${10000 / sliderX}%`, maxWidth: 'none' }}
            draggable={false}
          />
        </div>

        {/* Slider line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
          style={{ left: `${sliderX}%`, transform: 'translateX(-50%)' }}
        >
          {/* Handle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-xl flex items-center justify-center">
            <svg className="w-4 h-4 text-slate-800" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 10a.75.75 0 01.75-.75h8.5a.75.75 0 010 1.5h-8.5A.75.75 0 015 10z" />
              <path d="M3.22 7.22a.75.75 0 011.06 0L6.5 9.44l-2.22 2.22a.75.75 0 01-1.06-1.06l1.16-1.16-1.16-1.16a.75.75 0 010-1.06zM16.78 7.22a.75.75 0 010 1.06l-1.16 1.16 1.16 1.16a.75.75 0 11-1.06 1.06L13.5 9.44l2.22-2.22a.75.75 0 011.06 0z" />
            </svg>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-medium bg-black/60 text-white">
          Original
        </div>
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-medium bg-black/60 text-emerald-400">
          Neural
        </div>
      </div>

      {/* Download buttons */}
      <div className="flex gap-3">
        <a
          href={reconSrc}
          download="reconstructed.webp"
          className="flex-1 py-2 text-center rounded-xl text-xs font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
        >
          Download Reconstructed
        </a>
        <a
          href={origSrc}
          download="original_preprocessed.webp"
          className="flex-1 py-2 text-center rounded-xl text-xs font-medium bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          Download Original
        </a>
      </div>
    </motion.div>
  );
}
