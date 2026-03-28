import { motion, AnimatePresence } from 'framer-motion';

function ValuePill({ value, quantized, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex flex-col items-center gap-1"
    >
      {/* Original continuous value */}
      <div className="px-2 py-1 rounded bg-purple-500/10 border border-purple-500/30 text-xs font-mono text-purple-300 min-w-[52px] text-center">
        {value > 0 ? '+' : ''}{value.toFixed(3)}
      </div>

      {/* Arrow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.04 + 0.15 }}
        className="flex justify-center"
      >
        <svg className="w-3 h-3 text-slate-600" viewBox="0 0 12 12" fill="currentColor">
          <path d="M6 1v8M3.5 6.5L6 9l2.5-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </motion.div>

      {/* Quantized integer */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: index * 0.04 + 0.25, type: 'spring' }}
        className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/40 text-xs font-mono text-amber-300 min-w-[52px] text-center font-bold"
      >
        {quantized >= 0 ? '+' : ''}{quantized}
      </motion.div>
    </motion.div>
  );
}

export default function QuantizationViz({ data }) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-600 text-sm">
        Waiting for quantization data…
      </div>
    );
  }

  const { original_values = [], quantized_values = [] } = data;

  const avgError = original_values.length > 0
    ? (original_values.reduce((sum, v, i) => sum + Math.abs(v - (quantized_values[i] ?? Math.round(v))), 0) / original_values.length).toFixed(3)
    : null;
  const maxError = original_values.length > 0
    ? Math.max(...original_values.map((v, i) => Math.abs(v - (quantized_values[i] ?? Math.round(v))))).toFixed(3)
    : null;
  const unchanged = original_values.filter((v, i) => (quantized_values[i] ?? Math.round(v)) === Math.round(v) && Math.abs(v - Math.round(v)) < 0.05).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-purple-500/40 border border-purple-500/60" />
          <span className="text-slate-400">Continuous (float32)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-amber-500/40 border border-amber-500/60" />
          <span className="text-slate-400">Quantized (int)</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        {original_values.map((v, i) => (
          <ValuePill
            key={i}
            value={v}
            quantized={quantized_values[i] ?? Math.round(v)}
            index={i}
          />
        ))}
      </div>

      {avgError && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-900/60 rounded-lg p-2 text-center">
            <div className="text-xs text-slate-500">Avg rounding error</div>
            <div className="text-sm font-mono text-amber-400">±{avgError}</div>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-2 text-center">
            <div className="text-xs text-slate-500">Max rounding error</div>
            <div className="text-sm font-mono text-amber-400">±{maxError}</div>
          </div>
        </div>
      )}

      <div className="bg-slate-900/60 rounded-xl p-3 text-xs text-slate-400 space-y-1.5">
        <p>
          Each float is rounded to the nearest integer — an average error of <span className="text-amber-400 font-medium">±{avgError}</span> per value in this sample.
          Small individually, but this rounding is <span className="text-slate-300">irreversible</span> and is the only lossy step in the entire pipeline.
        </p>
        <p>
          The upside: integers can be entropy-coded without any ambiguity. During training, uniform noise <span className="font-mono text-purple-400">U(−0.5, 0.5)</span> is substituted for rounding so gradients remain defined.
        </p>
      </div>
    </motion.div>
  );
}
