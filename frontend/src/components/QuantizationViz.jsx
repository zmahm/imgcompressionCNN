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

      <div className="bg-slate-900/60 rounded-xl p-3 text-xs text-slate-400 space-y-1">
        <p>
          <span className="text-amber-400 font-medium">Rounding</span> maps each float to the
          nearest integer, enabling lossless entropy coding of discrete symbols.
        </p>
        <p>
          During training, uniform noise <span className="font-mono text-purple-400">U(−0.5, 0.5)</span> is
          added to simulate quantization while keeping gradients defined.
        </p>
      </div>
    </motion.div>
  );
}
