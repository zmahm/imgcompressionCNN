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

function PostprocessingDetail() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      <div className="flex justify-center py-4">
        <svg className="w-8 h-8 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      </div>
      <div className="bg-slate-900/60 rounded-xl p-3 text-xs text-slate-400 space-y-1.5">
        <p>
          <span className="text-emerald-400 font-medium">PSNR</span> (Peak Signal-to-Noise Ratio) measures pixel-level difference in decibels — higher is better. Above 35 dB is generally considered good quality; above 40 dB is near-transparent.
        </p>
        <p>
          <span className="text-emerald-400 font-medium">MS-SSIM</span> (Multi-Scale Structural Similarity) mimics human perception by comparing luminance, contrast, and local structure across multiple resolutions. A score above 0.95 is typically indistinguishable from the original at a glance.
        </p>
      </div>
    </motion.div>
  );
}

const DETAIL_COMPONENTS = {
  preprocessing:  (stageData) => <PreprocessingDetail data={stageData.preprocessing} />,
  encoding:       () => <EncodingDetail />,
  latent:         (stageData) => <LatentHeatmap data={stageData.latent} />,
  quantizing:     (stageData) => <QuantizationViz data={stageData.quantizing} />,
  entropy_coding: (stageData) => <BitStreamViz data={stageData.entropy_coding} />,
  decoding:       () => <DecodingDetail />,
  postprocessing: () => <PostprocessingDetail />,
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

export default function StageDetail({ stage, stageData }) {
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
        {render(stageData)}
      </motion.div>
    </AnimatePresence>
  );
}
