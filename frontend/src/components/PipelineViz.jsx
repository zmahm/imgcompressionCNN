import { motion, AnimatePresence } from 'framer-motion';
import { STAGE_ORDER, STAGE_META } from '../hooks/useWebSocketCompression';

const COLOR_CLASSES = {
  blue:    { border: 'border-blue-500/60',    bg: 'bg-blue-500/10',    text: 'text-blue-400',    glow: 'shadow-blue-500/30' },
  purple:  { border: 'border-purple-500/60',  bg: 'bg-purple-500/10',  text: 'text-purple-400',  glow: 'shadow-purple-500/30' },
  cyan:    { border: 'border-cyan-500/60',     bg: 'bg-cyan-500/10',    text: 'text-cyan-400',    glow: 'shadow-cyan-500/30' },
  amber:   { border: 'border-amber-500/60',    bg: 'bg-amber-500/10',   text: 'text-amber-400',   glow: 'shadow-amber-500/30' },
  green:   { border: 'border-green-500/60',    bg: 'bg-green-500/10',   text: 'text-green-400',   glow: 'shadow-green-500/30' },
  indigo:  { border: 'border-indigo-500/60',  bg: 'bg-indigo-500/10',  text: 'text-indigo-400',  glow: 'shadow-indigo-500/30' },
  emerald: { border: 'border-emerald-500/60', bg: 'bg-emerald-500/10', text: 'text-emerald-400', glow: 'shadow-emerald-500/30' },
};

function StageNode({ stageKey, isActive, isComplete, progress, index }) {
  const meta = STAGE_META[stageKey];
  const colors = COLOR_CLASSES[meta.color];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-500 flex-1 min-w-[80px] max-w-[110px] ${
        isActive
          ? `${colors.border} ${colors.bg} shadow-lg ${colors.glow} stage-active-glow`
          : isComplete
          ? 'border-emerald-500/40 bg-emerald-500/5'
          : 'border-slate-800 bg-slate-900/40'
      }`}
    >
      {/* Icon */}
      <motion.div
        animate={isActive ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
        className="flex items-center justify-center w-8 h-8"
      >
        {isComplete ? (
          <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <span className={`text-[10px] font-bold font-mono tracking-widest ${isActive ? colors.text : 'text-slate-600'}`}>
            {meta.icon}
          </span>
        )}
      </motion.div>

      {/* Label */}
      <span className={`text-xs font-medium text-center leading-tight ${
        isActive ? colors.text : isComplete ? 'text-emerald-400' : 'text-slate-500'
      }`}>
        {meta.label}
      </span>

      {/* Progress bar */}
      {isActive && progress !== undefined && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full overflow-hidden bg-slate-800">
          <motion.div
            className={`h-full ${colors.bg.replace('/10', '')} bg-current`}
            style={{ width: `${progress * 100}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* Active indicator */}
      {isActive && !progress && (
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5">
          <motion.div
            className={`absolute inset-0 rounded-full ${colors.bg.replace('/10', '-400')}`}
            animate={{ scale: [1, 2, 1], opacity: [1, 0, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          <div className={`absolute inset-0 rounded-full bg-cyan-400`} />
        </div>
      )}
    </motion.div>
  );
}

function Connector({ fromActive, toActive, isActive }) {
  return (
    <div className="flex-shrink-0 flex items-center justify-center w-6 relative">
      <div className="w-full h-px bg-slate-800 relative overflow-hidden">
        <AnimatePresence>
          {isActive && (
            <motion.div
              key="flow"
              className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '300%' }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
          )}
        </AnimatePresence>
      </div>
      <svg className="absolute" width="8" height="8" viewBox="0 0 8 8">
        <path d="M0 4 L6 4 M4 2 L6 4 L4 6" stroke={isActive ? '#06b6d4' : '#1e293b'} strokeWidth="1.5" fill="none" />
      </svg>
    </div>
  );
}

export default function PipelineViz({ currentStage, currentMessage, completedStages, stageProgress }) {
  const currentIdx = STAGE_ORDER.indexOf(currentStage);

  return (
    <div className="glass rounded-2xl p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <h2 className="text-sm font-semibold text-slate-300">Compression Pipeline</h2>
        {currentStage === 'complete' && (
          <motion.span
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="ml-auto text-xs text-emerald-400 font-medium"
          >
            Complete
          </motion.span>
        )}
      </div>

      {/* Pipeline nodes */}
      <div className="flex items-stretch gap-1 overflow-x-auto pb-2">
        {STAGE_ORDER.map((stage, idx) => {
          const isActive = stage === currentStage;
          const isComplete = completedStages.has(stage);
          const progress = stageProgress[stage];

          return (
            <div key={stage} className="flex items-center gap-1 flex-1 min-w-0">
              <StageNode
                stageKey={stage}
                isActive={isActive}
                isComplete={isComplete}
                progress={progress}
                index={idx}
              />
              {idx < STAGE_ORDER.length - 1 && (
                <Connector
                  isActive={idx < currentIdx || completedStages.has(stage)}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Current stage message */}
      <AnimatePresence mode="wait">
        {currentStage && currentStage !== 'complete' && (
          <motion.div
            key={currentStage}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mt-3"
          >
            {currentMessage && currentMessage.length > 60 ? (
              // Slow-mode: rich explanation message
              <p className="text-xs text-slate-400 text-center leading-relaxed px-2">
                {currentMessage}
              </p>
            ) : (
              <p className="text-xs text-slate-500 text-center">
                {STAGE_META[currentStage]?.label || currentStage} in progress…
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
