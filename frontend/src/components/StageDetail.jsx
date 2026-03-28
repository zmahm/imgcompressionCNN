import { AnimatePresence, motion } from 'framer-motion';
import LatentHeatmap from './LatentHeatmap';
import QuantizationViz from './QuantizationViz';
import BitStreamViz from './BitStreamViz';

function CNNAnimation({ label, reverse = false }) {
  const layers = [64, 128, 192, 192];
  const ordered = reverse ? [...layers].reverse() : layers;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center gap-2 py-6"
    >
      {!reverse && (
        <div className="text-xs text-slate-500 text-center">
          <svg className="w-6 h-6 mx-auto mb-1 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" />
            <path strokeLinecap="round" d="M3 16l5-5a2 2 0 012.8 0l5 5M14 14l1.5-1.5a2 2 0 012.8 0L21 15" />
          </svg>
          Input
        </div>
      )}

      {ordered.map((channels, i) => (
        <div key={i} className="flex items-center gap-2">
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: i * 0.15, duration: 0.4, ease: 'easeOut' }}
            className="flex flex-col gap-0.5"
          >
            {Array.from({ length: Math.min(6, Math.round(channels / 32)) }).map((_, j) => (
              <motion.div
                key={j}
                className="rounded-sm"
                style={{
                  width: 20 - i * 2,
                  height: 8,
                  background: reverse
                    ? `hsl(${180 + i * 30}, 70%, ${40 + j * 5}%)`
                    : `hsl(${260 + i * 20}, 70%, ${40 + j * 5}%)`,
                  opacity: 0.7 + j * 0.05,
                }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: j * 0.1 }}
              />
            ))}
            <div className="text-xs text-slate-500 text-center mt-0.5">{channels}ch</div>
          </motion.div>

          {i < ordered.length - 1 && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: i * 0.15 + 0.3 }}
              className="w-4 h-px bg-gradient-to-r from-purple-500 to-cyan-500"
            />
          )}
        </div>
      ))}

      {reverse && (
        <div className="text-xs text-slate-500 text-center">
          <svg className="w-6 h-6 mx-auto mb-1 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" />
            <path strokeLinecap="round" d="M3 16l5-5a2 2 0 012.8 0l5 5M14 14l1.5-1.5a2 2 0 012.8 0L21 15" />
          </svg>
          Output
        </div>
      )}

      {!reverse && (
        <div className="text-xs text-slate-500 text-center">
          <svg className="w-6 h-6 mx-auto mb-1 text-cyan-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" d="M3 12c2-4 4-6 6-6s4 4 6 4 4-4 6-4M3 18c2-4 4-6 6-6s4 4 6 4 4-4 6-4" />
          </svg>
          Latent
        </div>
      )}
    </motion.div>
  );
}

function PreprocessingDetail({ data }) {
  const rawKB = data ? (data.original_bytes / 1024).toFixed(1) : null;
  const padW = data ? Math.ceil(data.width / 64) * 64 : null;
  const padH = data ? Math.ceil(data.height / 64) * 64 : null;
  const wasPadded = data && (padW !== data.width || padH !== data.height);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {data?.preview && (
          <div className="col-span-2 flex justify-center">
            <img
              src={`data:image/webp;base64,${data.preview}`}
              alt="Preprocessed"
              className="max-h-40 rounded-xl border border-slate-700 object-contain"
            />
          </div>
        )}
        {data && (
          <>
            <div className="bg-slate-900/60 rounded-lg p-2 text-center">
              <div className="text-xs text-slate-500">Model input size</div>
              <div className="text-sm font-mono text-blue-400">{data.width} × {data.height}</div>
            </div>
            <div className="bg-slate-900/60 rounded-lg p-2 text-center">
              <div className="text-xs text-slate-500">Uncompressed RGB</div>
              <div className="text-sm font-mono text-blue-400">{rawKB} KB</div>
            </div>
          </>
        )}
      </div>
      {data && (
        <div className="bg-slate-900/60 rounded-xl p-3 text-xs text-slate-400 space-y-1.5">
          <p>
            The image is <span className="text-blue-400 font-medium">{data.width}×{data.height} px</span> — stored as raw RGB that would take <span className="text-blue-400 font-medium">{rawKB} KB</span> with no compression at all. This is the true baseline the neural bitstream will be measured against.
          </p>
          {wasPadded && (
            <p>
              The encoder requires dimensions that are multiples of 64, so the image was silently padded to <span className="text-slate-300 font-mono">{padW}×{padH}</span> with black pixels before being converted to a float tensor.
            </p>
          )}
          {!wasPadded && (
            <p>
              Dimensions are already multiples of 64, so no padding was needed. Pixel values were normalised from <span className="font-mono text-slate-300">0–255</span> integers to <span className="font-mono text-slate-300">0.0–1.0</span> floats before being fed into the encoder.
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}

function EncodingDetail() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      <CNNAnimation label="Encoder" />
      <div className="bg-slate-900/60 rounded-xl p-3 text-xs text-slate-400 space-y-1.5">
        <p>
          The encoder network (<span className="text-purple-400 font-medium">g_a</span>) applies four convolutional layers, each followed by a downsampling step. With every layer the spatial resolution shrinks while the number of channels grows — trading pixel detail for compact abstract features.
        </p>
        <p>
          By the final layer the spatial grid is <span className="text-purple-400 font-medium">16× smaller</span> in each dimension than the input, but the 192 channels capture the patterns needed to reconstruct a convincing image on the other side.
        </p>
      </div>
    </motion.div>
  );
}

function DecodingDetail() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      <CNNAnimation label="Decoder" reverse />
      <div className="bg-slate-900/60 rounded-xl p-3 text-xs text-slate-400 space-y-1.5">
        <p>
          The synthesis network (<span className="text-indigo-400 font-medium">g_s</span>) mirrors the encoder in reverse — transposed convolutions upsample the latent grid back to full image resolution, progressively rebuilding pixel values from the abstract channel features.
        </p>
        <p>
          Because the quantization in the previous step was lossy, the decoder is <span className="text-slate-300">reconstructing</span> rather than recovering. Fine textures and sharp edges may be slightly softened — how much depends on the quality level chosen.
        </p>
      </div>
    </motion.div>
  );
}

// PSNR scale: 0–50 dB, with labelled quality zones
const PSNR_ZONES = [
  { max: 25, label: 'Poor',      color: '#ef4444', bg: 'bg-red-500' },
  { max: 32, label: 'Acceptable',color: '#f97316', bg: 'bg-orange-500' },
  { max: 38, label: 'Good',      color: '#eab308', bg: 'bg-yellow-500' },
  { max: 43, label: 'Very good', color: '#22c55e', bg: 'bg-green-500' },
  { max: 50, label: 'Excellent', color: '#10b981', bg: 'bg-emerald-400' },
];

function PsnrGauge({ psnr }) {
  const SCALE_MAX = 50;
  const pct = Math.min((psnr / SCALE_MAX) * 100, 100);
  const zone = PSNR_ZONES.find(z => psnr < z.max) || PSNR_ZONES[PSNR_ZONES.length - 1];

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <span className="text-xs text-slate-400">PSNR</span>
        <span className="text-lg font-bold font-mono" style={{ color: zone.color }}>
          {psnr} dB
          <span className="text-xs font-normal text-slate-400 ml-2">— {zone.label}</span>
        </span>
      </div>
      {/* Gradient track */}
      <div className="relative h-4 rounded-full overflow-hidden"
        style={{ background: 'linear-gradient(to right, #ef4444 0%, #f97316 20%, #eab308 42%, #22c55e 66%, #10b981 90%)' }}>
        {/* Dark overlay for the portion beyond current value */}
        <div className="absolute inset-y-0 right-0 bg-slate-900/70 rounded-r-full transition-all"
          style={{ left: `${pct}%` }} />
        {/* Marker */}
        <motion.div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow"
          initial={{ left: '0%' }}
          animate={{ left: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-600 font-mono">
        <span>0</span><span>25</span><span>32</span><span>38</span><span>43</span><span>50 dB</span>
      </div>
    </div>
  );
}

function SsimBar({ ssim }) {
  const pct = Math.min(ssim * 100, 100);
  const color = ssim >= 0.97 ? '#10b981' : ssim >= 0.92 ? '#22c55e' : ssim >= 0.85 ? '#eab308' : '#f97316';
  const label = ssim >= 0.97 ? 'Near-transparent' : ssim >= 0.92 ? 'Good' : ssim >= 0.85 ? 'Acceptable' : 'Noticeable loss';

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <span className="text-xs text-slate-400">MS-SSIM</span>
        <span className="text-lg font-bold font-mono" style={{ color }}>
          {ssim}
          <span className="text-xs font-normal text-slate-400 ml-2">— {label}</span>
        </span>
      </div>
      <div className="relative h-4 rounded-full bg-slate-800 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: `linear-gradient(to right, #f97316, ${color})` }}
          initial={{ width: '0%' }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-600 font-mono">
        <span>0</span><span>0.5</span><span>0.85</span><span>0.92</span><span>0.97</span><span>1.0</span>
      </div>
    </div>
  );
}

function PostprocessingDetail({ result }) {
  if (!result) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
        <div className="flex items-center justify-center gap-3 py-6 text-slate-500">
          <motion.div
            className="w-4 h-4 border-2 border-emerald-500/40 border-t-emerald-400 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <span className="text-sm">Computing PSNR and MS-SSIM…</span>
        </div>
        <div className="bg-slate-900/60 rounded-xl p-3 text-xs text-slate-400 space-y-1.5">
          <p><span className="text-emerald-400 font-medium">PSNR</span> measures pixel-level error in decibels — higher is better. &gt;35 dB is good quality; &gt;40 dB is near-transparent.</p>
          <p><span className="text-emerald-400 font-medium">MS-SSIM</span> compares luminance, contrast, and structure across scales. Above 0.95 is typically indistinguishable at a glance.</p>
        </div>
      </motion.div>
    );
  }

  const { psnr, ssim, bpp, compressed_bytes, original_bytes, compression_ratio } = result;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <PsnrGauge psnr={psnr} />
      <SsimBar ssim={ssim} />

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Bits / pixel', value: bpp?.toFixed(4), color: 'text-cyan-400' },
          { label: 'Compression', value: `${compression_ratio}×`, color: 'text-amber-400' },
          { label: 'Bitstream', value: `${(compressed_bytes / 1024).toFixed(1)} KB`, color: 'text-emerald-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-slate-900/60 rounded-lg p-2 text-center">
            <div className="text-xs text-slate-500">{label}</div>
            <div className={`text-sm font-mono font-bold mt-0.5 ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900/60 rounded-xl p-3 text-xs text-slate-400 space-y-1.5">
        <p>
          <span className="text-emerald-400 font-medium">PSNR</span> measures the pixel-level difference as a signal-to-noise ratio — every +6 dB roughly halves the average error per pixel.
          At <span className="font-mono" style={{ color: (PSNR_ZONES.find(z => psnr < z.max) || PSNR_ZONES[4]).color }}>{psnr} dB</span>, the reconstruction is {psnr >= 38 ? 'very close to the original — differences are hard to spot without side-by-side comparison' : psnr >= 32 ? 'broadly faithful but fine textures and sharp edges show some softening' : 'noticeably degraded — consider using a higher quality level'}.
        </p>
        <p>
          <span className="text-emerald-400 font-medium">MS-SSIM</span> is more aligned with human perception — it compares luminance, contrast, and local structure at multiple scales rather than raw pixel values.
          A score of <span className="font-mono text-emerald-300">{ssim}</span> means the reconstructed image preserves {Math.round(ssim * 100)}% of the original's structural similarity.
        </p>
      </div>
    </motion.div>
  );
}

const DETAIL_COMPONENTS = {
  preprocessing:  (stageData, result) => <PreprocessingDetail data={stageData.preprocessing} />,
  encoding:       (stageData, result) => <EncodingDetail />,
  latent:         (stageData, result) => <LatentHeatmap data={stageData.latent} />,
  quantizing:     (stageData, result) => <QuantizationViz data={stageData.quantizing} />,
  entropy_coding: (stageData, result) => <BitStreamViz data={stageData.entropy_coding} />,
  decoding:       (stageData, result) => <DecodingDetail />,
  postprocessing: (stageData, result) => <PostprocessingDetail result={result} />,
};

const STAGE_LABELS = {
  preprocessing:  { title: 'Pre-processing', subtitle: 'Resize, pad, normalise' },
  encoding:       { title: 'Encoder CNN', subtitle: '4 conv layers, stride downsampling' },
  latent:         { title: 'Latent Representation', subtitle: 'Compact feature tensor' },
  quantizing:     { title: 'Quantization', subtitle: 'Continuous → discrete integers' },
  entropy_coding: { title: 'Entropy Coding', subtitle: 'Arithmetic coding with learned priors' },
  decoding:       { title: 'Decoder CNN', subtitle: 'Transposed conv upsampling' },
  postprocessing: { title: 'Post-processing', subtitle: 'Metrics computation' },
};

export default function StageDetail({ stage, stageData, result }) {
  if (!stage || stage === 'complete') return null;

  const render = DETAIL_COMPONENTS[stage];
  const meta = STAGE_LABELS[stage];

  if (!render || !meta) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stage}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.3 }}
        className="glass rounded-2xl p-4 sm:p-6"
      >
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-white">{meta.title}</h3>
          <p className="text-xs text-slate-500">{meta.subtitle}</p>
        </div>
        {render(stageData, result)}
      </motion.div>
    </AnimatePresence>
  );
}
