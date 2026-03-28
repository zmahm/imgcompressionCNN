import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UploadZone({ onCompress, quality, setQuality }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = useCallback((f) => {
    if (!f || !f.type.startsWith('image/')) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const onInputChange = (e) => handleFile(e.target.files[0]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center gap-8 px-4 py-12">
      {/* Hero text */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-2xl"
      >
        <h2 className="text-4xl sm:text-5xl font-bold mb-4">
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
            Compress Images
          </span>
          <br />
          <span className="text-white">with Neural Networks</span>
        </h2>
        <p className="text-slate-400 text-lg leading-relaxed">
          Watch a deep learning model compress your image in real-time.
          See every stage of the pipeline — encoder, latent space, quantization,
          entropy coding, and decoder — animated live.
        </p>
      </motion.div>

      <div className="w-full max-w-2xl flex flex-col gap-4">
        {/* Drop zone */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => !file && fileInputRef.current?.click()}
          className={`relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 ${
            dragging
              ? 'border-2 border-cyan-400 bg-cyan-500/10 border-glow-cyan'
              : file
              ? 'border border-cyan-900/50'
              : 'border-2 border-dashed border-slate-700 hover:border-cyan-700 hover:bg-cyan-950/20'
          }`}
          style={{ minHeight: file ? 'auto' : '220px' }}
          role="button"
          aria-label="Upload image"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        >
          {/* Grid background */}
          <div className="absolute inset-0 neural-grid opacity-50 pointer-events-none" />

          {/* Scan line (visible when dragging) */}
          <AnimatePresence>
            {dragging && (
              <motion.div
                key="scan"
                className="scan-line"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
          </AnimatePresence>

          <div className="relative z-10 p-8">
            <AnimatePresence mode="wait">
              {file && preview ? (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-6"
                >
                  <img
                    src={preview}
                    alt="Selected"
                    className="w-24 h-24 object-cover rounded-xl border border-cyan-900/50"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{file.name}</p>
                    <p className="text-sm text-slate-400">
                      {(file.size / 1024).toFixed(1)} KB · {file.type.split('/')[1].toUpperCase()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                    className="text-slate-500 hover:text-red-400 text-xl leading-none transition-colors"
                    aria-label="Remove file"
                  >
                    ×
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-3 text-center"
                >
                  <motion.div
                    animate={dragging ? { scale: 1.2, rotate: 10 } : { scale: 1, rotate: 0 }}
                    className="flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-800/60"
                  >
                    {dragging ? (
                      <svg className="w-8 h-8 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M13.5 12h.008v.008H13.5V12zm-3 0a9 9 0 110 18 9 9 0 010-18z" />
                        <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" />
                      </svg>
                    )}
                  </motion.div>
                  <div>
                    <p className="text-slate-300 font-medium">
                      {dragging ? 'Drop it!' : 'Drop your image here'}
                    </p>
                    <p className="text-slate-500 text-sm mt-1">
                      or{' '}
                      <span className="text-cyan-400 underline underline-offset-2">browse files</span>
                      {' '}· JPEG, PNG, WebP, BMP
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onInputChange}
            className="sr-only"
            aria-label="Choose image file"
          />
        </motion.div>

        {/* Quality + Compress row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3"
        >
          {/* Quality control */}
          <div className="glass rounded-xl px-4 py-3 flex items-center gap-3 flex-1">
            <div className="flex-1">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Quality</span>
                <span className="text-cyan-400 font-mono">{quality}/8</span>
              </div>
              <input
                type="range"
                min={1}
                max={8}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
                aria-label="Compression quality"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-0.5">
                <span>Max compress</span>
                <span>Max quality</span>
              </div>
            </div>
          </div>

          {/* Compress button */}
          <motion.button
            whileHover={{ scale: file ? 1.02 : 1 }}
            whileTap={{ scale: file ? 0.98 : 1 }}
            onClick={() => file && onCompress(file)}
            disabled={!file}
            className={`relative overflow-hidden px-6 py-3 rounded-xl font-semibold transition-all ${
              file
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            {file && (
              <motion.div
                className="absolute inset-0 bg-white/10"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
            )}
            <span className="relative">Compress</span>
          </motion.button>
        </motion.div>

        {/* Info tags */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap gap-2 justify-center"
        >
          {['CompressAI Model', 'Real-time WebSocket', 'PSNR + SSIM Metrics', 'vs JPEG Comparison'].map((tag) => (
            <span key={tag} className="px-3 py-1 rounded-full text-xs bg-slate-900 border border-slate-800 text-slate-500">
              {tag}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
