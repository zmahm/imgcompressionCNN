import { motion } from 'framer-motion';

export default function Header({ quality, setQuality, onReset, status, slow, setSlowMode }) {
  const isActive = status === 'compressing' || status === 'complete';

  return (
    <header className="relative z-10 border-b border-cyan-900/30 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
        {/* Logo + Title */}
        <div className="flex items-center gap-3">
          <motion.div
            className="relative w-10 h-10 flex-shrink-0"
            animate={{ rotate: status === 'compressing' ? 360 : 0 }}
            transition={{ duration: 2, repeat: status === 'compressing' ? Infinity : 0, ease: 'linear' }}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 opacity-80" />
            <div className="absolute inset-1 rounded-full bg-neural-950 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="5"  cy="6"  r="2" />
                <circle cx="19" cy="6"  r="2" />
                <circle cx="5"  cy="18" r="2" />
                <circle cx="19" cy="18" r="2" />
                <circle cx="12" cy="12" r="2.5" />
                <line x1="7"  y1="6"  x2="10" y2="12" />
                <line x1="17" y1="6"  x2="14" y2="12" />
                <line x1="7"  y1="18" x2="10" y2="12" />
                <line x1="17" y1="18" x2="14" y2="12" />
              </svg>
            </div>
          </motion.div>

          <div>
            <h1 className="text-lg font-bold text-white leading-tight">
              Neural Image{' '}
              <span className="text-glow-cyan bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Compression
              </span>
            </h1>
            <p className="text-xs text-slate-500 leading-none">
              Rate–distortion optimised · CompressAI
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Quality selector */}
          <div className="hidden sm:flex items-center gap-2 glass rounded-lg px-3 py-2">
            <span className="text-xs text-slate-400 whitespace-nowrap">Quality</span>
            <input
              type="range"
              min={1}
              max={8}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              disabled={status === 'compressing'}
              className="w-24 accent-cyan-400 cursor-pointer disabled:opacity-40"
              aria-label="Compression quality"
            />
            <span className="text-xs font-mono text-cyan-400 w-4 text-center">{quality}</span>
          </div>

          {/* Status badge */}
          {status !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                status === 'compressing'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : status === 'complete'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
              }`}
            >
              <motion.span
                className={`w-1.5 h-1.5 rounded-full ${
                  status === 'compressing' ? 'bg-cyan-400' :
                  status === 'complete'    ? 'bg-emerald-400' : 'bg-red-400'
                }`}
                animate={status === 'compressing' ? { opacity: [1, 0.3, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
              />
              {status === 'compressing' ? 'Processing' :
               status === 'complete'    ? 'Complete'   : 'Error'}
            </motion.div>
          )}

          {/* Slow visualisation toggle */}
          <div className="hidden sm:flex items-center gap-2 glass rounded-lg px-3 py-2">
            <span className="text-xs text-slate-400 whitespace-nowrap">Slow viz</span>
            <button
              role="switch"
              aria-checked={slow}
              onClick={() => setSlowMode(!slow)}
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
                slow ? 'bg-purple-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                  slow ? 'translate-x-[18px]' : 'translate-x-[3px]'
                }`}
              />
            </button>
          </div>

          {/* Reset button */}
          {isActive && (
            <motion.button
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={onReset}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
            >
              New Image
            </motion.button>
          )}
        </div>
      </div>
    </header>
  );
}
