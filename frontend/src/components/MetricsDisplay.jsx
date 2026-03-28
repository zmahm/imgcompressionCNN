import { motion } from 'framer-motion';

function Gauge({ value, max, label, unit, color }) {
  const pct = Math.min(100, (value / max) * 100);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Circular gauge */}
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
          {/* Track */}
          <circle
            cx="40" cy="40" r="32"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="6"
          />
          {/* Progress */}
          <motion.circle
            cx="40" cy="40" r="32"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 32}`}
            strokeDashoffset={`${2 * Math.PI * 32 * (1 - pct / 100)}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 32 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 32 * (1 - pct / 100) }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 4px ${color})` }}
          />
        </svg>
        {/* Value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-sm font-bold text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {value}
          </motion.span>
          <span className="text-xs text-slate-500">{unit}</span>
        </div>
      </div>
      <span className="text-xs text-slate-400 text-center leading-tight">{label}</span>
    </div>
  );
}

function MetricRow({ label, value, subvalue, good }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
      <span className="text-xs text-slate-400">{label}</span>
      <div className="text-right">
        <span className={`text-sm font-mono font-semibold ${good ? 'text-emerald-400' : 'text-amber-400'}`}>
          {value}
        </span>
        {subvalue && <div className="text-xs text-slate-600">{subvalue}</div>}
      </div>
    </div>
  );
}

function CompressionBar({ compressed, original }) {
  const pct = original > 0 ? (compressed / original) * 100 : 0;
  const saved = 100 - pct;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-slate-400">
        <span>Size reduction</span>
        <span className="text-emerald-400 font-medium">{saved.toFixed(1)}% saved</span>
      </div>
      <div className="h-3 rounded-full bg-slate-800 overflow-hidden flex">
        <motion.div
          className="h-full bg-gradient-to-r from-green-600 to-emerald-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${saved}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        <motion.div
          className="h-full bg-slate-700"
          initial={{ width: '100%' }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-600">
        <span>Removed: {((original - compressed) / 1024).toFixed(0)} KB</span>
        <span>Bitstream: {(compressed / 1024).toFixed(1)} KB</span>
      </div>
    </div>
  );
}

export default function MetricsDisplay({ result }) {
  if (!result) return null;

  const {
    psnr, ssim, bpp,
    compressed_bytes, original_bytes, compression_ratio,
    dimensions, quality,
  } = result;

  // PSNR quality interpretation
  const psnrLabel = psnr > 40 ? 'Excellent' : psnr > 35 ? 'Good' : psnr > 30 ? 'Acceptable' : 'Low';
  const ssimLabel = ssim > 0.95 ? 'Excellent' : ssim > 0.9 ? 'Good' : ssim > 0.8 ? 'Acceptable' : 'Low';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-4"
    >
      {/* Quality metrics */}
      <div className="glass rounded-2xl p-4 sm:p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white">Quality Metrics</h3>

        {/* Gauges */}
        <div className="flex justify-around py-2">
          <Gauge
            value={psnr.toFixed(1)}
            max={50}
            label={`PSNR · ${psnrLabel}`}
            unit="dB"
            color="#06b6d4"
          />
          <Gauge
            value={ssim.toFixed(3)}
            max={1}
            label={`SSIM · ${ssimLabel}`}
            unit=""
            color="#a855f7"
          />
          <Gauge
            value={bpp.toFixed(3)}
            max={4}
            label="Bits/pixel"
            unit="bpp"
            color="#f59e0b"
          />
        </div>

        {/* Detailed rows */}
        <div className="space-y-0">
          <MetricRow
            label="PSNR (higher = better)"
            value={`${psnr} dB`}
            subvalue={psnrLabel}
            good={psnr > 32}
          />
          <MetricRow
            label="MS-SSIM (higher = better)"
            value={ssim.toFixed(4)}
            subvalue={ssimLabel}
            good={ssim > 0.9}
          />
          <MetricRow
            label="Bits per pixel"
            value={bpp.toFixed(4)}
            subvalue="lower = more compressed"
            good={bpp < 1.0}
          />
          <MetricRow
            label="Quality level"
            value={`${quality}/8`}
            good
          />
        </div>
      </div>

      {/* Compression stats */}
      <div className="glass rounded-2xl p-4 sm:p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white">Compression Stats</h3>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Raw pixels', value: `${(original_bytes / 1024).toFixed(0)} KB`, color: 'text-slate-300' },
            { label: 'Neural bitstream', value: `${(compressed_bytes / 1024).toFixed(1)} KB`, color: 'text-emerald-400' },
            { label: 'Ratio', value: `${compression_ratio}×`, color: 'text-cyan-400' },
            { label: 'Dimensions', value: `${dimensions?.width}×${dimensions?.height}`, color: 'text-purple-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-slate-900/60 rounded-xl p-3">
              <div className="text-xs text-slate-500">{label}</div>
              <div className={`text-lg font-mono font-bold mt-1 ${color}`}>{value}</div>
            </div>
          ))}
        </div>

        <CompressionBar compressed={compressed_bytes} original={original_bytes} />

        <div className="text-xs text-slate-500 space-y-1">
          <p>
            <span className="text-slate-300">Raw pixels</span> is the uncompressed RGB size
            (w × h × 3 bytes) of the preprocessed image — the baseline before any coding.
          </p>
          <p>
            <span className="text-cyan-400">PSNR</span> measures pixel-level fidelity.
            Above 35 dB is generally considered high quality.
          </p>
          <p>
            <span className="text-amber-400">bpp</span> is the effective compression rate.
            JPEG typically uses 0.5–2.0 bpp for similar quality.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
