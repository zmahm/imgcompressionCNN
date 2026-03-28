import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { drawHeatmap } from '../utils/colormap';

export default function LatentHeatmap({ data }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!data?.heatmap || !canvasRef.current) return;
    drawHeatmap(canvasRef.current, data.heatmap);
  }, [data]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-600 text-sm">
        Waiting for latent data…
      </div>
    );
  }

  const [, C, H, W] = data.shape || [1, '?', '?', '?'];
  const spatialReduction = (H !== '?' && W !== '?') ? H * W : null;
  const valueRange = (data.min != null && data.max != null) ? (data.max - data.min).toFixed(2) : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-3"
    >
      {/* Heatmap canvas */}
      <div className="relative rounded-xl overflow-hidden border border-cyan-900/40">
        <canvas
          ref={canvasRef}
          width={data.heatmap[0]?.length || 32}
          height={data.heatmap.length || 32}
          className="w-full h-40 object-contain"
          style={{ imageRendering: 'pixelated' }}
        />
        {/* Colorbar legend */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-black/60 rounded px-2 py-1">
          <div className="w-16 h-2 rounded" style={{
            background: 'linear-gradient(to right, #440154, #3b528b, #21918c, #5ec962, #fde725)'
          }} />
          <span className="text-xs text-slate-400 font-mono">viridis</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Shape (C×H×W)', value: `${C}×${H}×${W}` },
          { label: 'Min', value: data.min?.toFixed(3) },
          { label: 'Max', value: data.max?.toFixed(3) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-slate-900/60 rounded-lg p-2 text-center">
            <div className="text-xs text-slate-500">{label}</div>
            <div className="text-sm font-mono text-cyan-400 mt-0.5">{value}</div>
          </div>
        ))}
      </div>

      {/* Dynamic explanation */}
      <div className="bg-slate-900/60 rounded-xl p-3 text-xs text-slate-400 space-y-1.5">
        <p>
          The encoder output is a <span className="text-cyan-400 font-medium">{C}×{H}×{W}</span> tensor — {C} feature channels, each a {H}×{W} spatial grid.{' '}
          {spatialReduction && <span>That's <span className="text-cyan-400 font-medium">{spatialReduction.toLocaleString()}</span> positions per channel, compared to the full pixel grid of the input.</span>}
        </p>
        <p>
          The heatmap shows the <span className="text-slate-300">mean activation</span> across all {C} channels — bright yellow regions hold the most energy and will be harder to compress than the dark areas.
          {valueRange && <span> The values span a range of <span className="text-cyan-400 font-medium">{valueRange}</span>, from {data.min?.toFixed(2)} to {data.max?.toFixed(2)}.</span>}
        </p>
      </div>

      {/* Sample latent values */}
      <div>
        <p className="text-xs text-slate-500 mb-2">Sample latent values — continuous floats, about to be rounded</p>
        <div className="flex flex-wrap gap-1.5">
          {(data.sample_values || []).slice(0, 12).map((v, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-purple-400"
            >
              {v > 0 ? '+' : ''}{v.toFixed(2)}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
