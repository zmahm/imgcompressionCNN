import { motion } from 'framer-motion';

function BitsBar({ compressed, original, bpp }) {
  const ratio = original > 0 ? compressed / original : 0;
  const pct = Math.round(ratio * 100);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-slate-400">
        <span>Compressed size</span>
        <span className="font-mono text-green-400">{(compressed / 1024).toFixed(1)} KB</span>
      </div>
      <div className="relative h-6 rounded-lg overflow-hidden bg-slate-800">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-600 to-green-400 rounded-lg"
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(pct, 2)}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
        <div className="absolute inset-0 bg-slate-600/30" style={{ left: `${pct}%` }} />
        <span className="absolute inset-0 flex items-center justify-center text-xs font-mono text-white z-10">
          {pct}% of original
        </span>
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>Original: {(original / 1024).toFixed(1)} KB</span>
        <span className="text-green-400">{bpp?.toFixed(3)} bpp</span>
      </div>
    </div>
  );
}

function BitStream() {
  // 96 bits in 6 groups of 16 — each group fades in together so the full
  // stream is visible within ~0.35 s, well inside the 1 s fast-mode stage.
  const groups = Array.from({ length: 6 }, () =>
    Array.from({ length: 16 }, () => Math.round(Math.random()))
  );
  return (
    <div className="font-mono text-xs leading-relaxed select-none space-y-0.5">
      {groups.map((group, gi) => (
        <motion.div
          key={gi}
          className="flex gap-px flex-wrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: gi * 0.05, duration: 0.2 }}
        >
          {group.map((b, bi) => (
            <span key={bi} className={b === 1 ? 'text-green-400' : 'text-slate-600'}>
              {b}
            </span>
          ))}
        </motion.div>
      ))}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="text-green-400"
      >
        █
      </motion.span>
    </div>
  );
}

export default function BitStreamViz({ data }) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-600 text-sm">
        Waiting for entropy coding data…
      </div>
    );
  }

  const { compressed_bytes, bpp, total_pixels, compression_ratio } = data;

  // Rough bpp context: lossless PNG ~16 bpp for photos, JPEG medium quality ~2 bpp
  const vsPng = bpp ? (16 / bpp).toFixed(1) : null;
  const vsJpeg = bpp ? (2 / bpp).toFixed(1) : null;
  const qualityLabel = bpp < 0.5 ? 'very aggressive — expect visible quality loss'
    : bpp < 1.0 ? 'efficient — good quality with significant savings'
    : bpp < 2.0 ? 'moderate — close to JPEG quality at similar sizes'
    : 'conservative — high quality, modest compression';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Compressed bitstream preview */}
      <div className="glass rounded-xl p-3">
        <p className="text-xs text-slate-500 mb-2">Entropy-coded bitstream (preview)</p>
        <BitStream />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: 'Bits/pixel', value: bpp?.toFixed(4), color: 'text-green-400' },
          { label: 'Compressed', value: `${(compressed_bytes / 1024).toFixed(1)} KB`, color: 'text-cyan-400' },
          { label: 'Pixels', value: total_pixels?.toLocaleString(), color: 'text-purple-400' },
          { label: 'Ratio', value: `${compression_ratio}×`, color: 'text-amber-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-slate-900/60 rounded-lg p-2 text-center">
            <div className="text-xs text-slate-500">{label}</div>
            <div className={`text-sm font-mono font-bold mt-0.5 ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Compression bar */}
      {compressed_bytes && (
        <BitsBar
          compressed={compressed_bytes}
          original={total_pixels * 3}
          bpp={bpp}
        />
      )}

      <div className="bg-slate-900/60 rounded-xl p-3 text-xs text-slate-400 space-y-1.5">
        <p>
          At <span className="text-green-400 font-medium">{bpp?.toFixed(3)} bits per pixel</span> this is{' '}
          <span className="text-slate-300 font-medium">{vsPng}× smaller than lossless PNG</span> and{' '}
          <span className="text-slate-300 font-medium">{vsJpeg}× smaller than a typical JPEG</span> at the same pixel count.
          That puts this compression in the <span className="text-green-400">{qualityLabel}</span> range.
        </p>
        <p>
          <span className="text-green-400 font-medium">Arithmetic coding</span> assigns shorter codes to latent integers that the entropy model predicted as likely, and longer codes to surprises — squeezing out redundancy without losing any more information.
        </p>
      </div>
    </motion.div>
  );
}
