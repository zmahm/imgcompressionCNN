import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocketCompression } from './hooks/useWebSocketCompression';
import Header from './components/Header';
import UploadZone from './components/UploadZone';
import PipelineViz from './components/PipelineViz';
import StageDetail from './components/StageDetail';
import ImageComparison from './components/ImageComparison';
import MetricsDisplay from './components/MetricsDisplay';
import { useState } from 'react';

function NeuralBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Grid */}
      <div className="absolute inset-0 neural-grid opacity-30" />

      {/* Radial gradient blobs */}
      <div
        className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #06b6d4, transparent 70%)' }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full opacity-8"
        style={{ background: 'radial-gradient(circle, #a855f7, transparent 70%)' }}
      />
    </div>
  );
}

function ErrorDisplay({ error, onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto mt-20 glass rounded-2xl p-8 text-center space-y-4"
    >
      <svg className="w-10 h-10 text-amber-400 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      <h3 className="text-lg font-semibold text-white">Compression Failed</h3>
      <p className="text-sm text-slate-400">{error}</p>
      <button
        onClick={onRetry}
        className="px-6 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/30 transition-colors text-sm"
      >
        Try Again
      </button>
    </motion.div>
  );
}

export default function App() {
  const {
    compress, reset,
    slow, setSlowMode,
    status, currentStage, currentMessage, completedStages, stageProgress, stageData, result, error,
  } = useWebSocketCompression();

  const [quality, setQuality] = useState(4);

  const handleCompress = (file) => compress(file, quality, slow);

  return (
    <div className="relative min-h-screen bg-neural-950 text-white">
      <NeuralBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header
          quality={quality}
          setQuality={setQuality}
          onReset={reset}
          status={status}
          slow={slow}
          setSlowMode={setSlowMode}
        />

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-4">
          <AnimatePresence mode="wait">
            {/* Idle: show upload zone */}
            {status === 'idle' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <UploadZone
                  onCompress={handleCompress}
                  quality={quality}
                  setQuality={setQuality}
                />
              </motion.div>
            )}

            {/* Connecting */}
            {status === 'connecting' && (
              <motion.div
                key="connecting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center min-h-[50vh]"
              >
                <div className="text-center space-y-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-10 h-10 mx-auto border-2 border-cyan-500/30 border-t-cyan-400 rounded-full"
                  />
                  <p className="text-slate-400">Connecting to compression service…</p>
                </div>
              </motion.div>
            )}

            {/* Error */}
            {status === 'error' && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <ErrorDisplay error={error} onRetry={reset} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pipeline + results (shown during compressing AND complete) */}
          {(status === 'compressing' || status === 'complete') && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <PipelineViz
                  currentStage={currentStage}
                  currentMessage={currentMessage}
                  completedStages={completedStages}
                  stageProgress={stageProgress}
                />
              </motion.div>

              {/* Stage-specific detail visualization */}
              {status === 'compressing' && (
                <StageDetail
                  currentStage={currentStage}
                  stageData={stageData}
                />
              )}

              {/* Results */}
              <AnimatePresence>
                {status === 'complete' && result && (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    <MetricsDisplay result={result} />
                    <ImageComparison
                      original={result.original_image}
                      reconstructed={result.reconstructed_image}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </main>

        <footer className="relative z-10 text-center py-4 text-xs text-slate-700 border-t border-slate-900">
          Neural Image Compression · bmshj2018 Factorized Prior · CompressAI · PyTorch
        </footer>
      </div>
    </div>
  );
}
