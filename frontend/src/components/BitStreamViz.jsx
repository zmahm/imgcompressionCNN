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
  const bits = Array.from({ length: 48 }, () => Math.round(Math.random()));
  return (
    <div className="font-mono text-xs leading-relaxed break-all text-green-500/70 select-none">
      {bits.map((b, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.7] }}
          transition={{ delay: i * 0.02, duration: 0.4 }}
          className={b === 1 ? 'text-green-400' : 'text-slate-600'}
        >
          {b}
        </motion.span>
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

      <p className="text-xs text-slate-500">
        <span className="text-green-400 font-medium">Arithmetic coding</span> assigns shorter bit
        sequences to frequently occurring latent symbols, exploiting the entropy model's learned
        probability distribution.
      </p>
    </motion.div>
  );
}
