import { useState, useRef, useCallback } from 'react';

export const STAGE_ORDER = [
  'preprocessing',
  'encoding',
  'latent',
  'quantizing',
  'entropy_coding',
  'decoding',
  'postprocessing',
];

export const STAGE_META = {
  preprocessing: { label: 'Pre-process',  icon: 'PRE', color: 'blue' },
  encoding:      { label: 'Encoder CNN',  icon: 'ENC', color: 'purple' },
  latent:        { label: 'Latent Space', icon: 'LAT', color: 'cyan' },
  quantizing:    { label: 'Quantize',     icon: 'QNT', color: 'amber' },
  entropy_coding:{ label: 'Entropy Code', icon: 'ENT', color: 'green' },
  decoding:      { label: 'Decoder CNN',  icon: 'DEC', color: 'indigo' },
  postprocessing:{ label: 'Post-process', icon: 'OUT', color: 'emerald' },
};

export function useWebSocketCompression() {
  const [status, setStatus] = useState('idle');
  const [currentStage, setCurrentStage] = useState(null);
  const [currentMessage, setCurrentMessage] = useState(null);
  const [completedStages, setCompletedStages] = useState(new Set());
  const [stageProgress, setStageProgress] = useState({});
  const [stageData, setStageData] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [slow, setSlow] = useState(false);
  const wsRef = useRef(null);
  const prevStageRef = useRef(null);

  // Toggle slow mode live — sends a WS message if a compression is in flight.
  const setSlowMode = useCallback((value) => {
    setSlow(value);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'slow_toggle', slow: value }));
    }
  }, []);

  const compress = useCallback((imageFile, quality = 4, slowInit = false) => {
    // Reset
    setSlow(slowInit);
    setStatus('connecting');
    setCurrentStage(null);
    setCurrentMessage(null);
    setCompletedStages(new Set());
    setStageProgress({});
    setStageData({});
    setResult(null);
    setError(null);
    prevStageRef.current = null;

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${proto}//${window.location.host}/ws/compress`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('compressing');
      ws.send(JSON.stringify({ type: 'config', quality, slow: slowInit }));
      const reader = new FileReader();
      reader.onload = (e) => ws.send(e.target.result);
      reader.readAsArrayBuffer(imageFile);
    };

    ws.onmessage = (event) => {
      let msg;
      try { msg = JSON.parse(event.data); } catch { return; }

      switch (msg.type) {
        case 'stage_start':
          // Mark previous stage as completed
          if (prevStageRef.current) {
            setCompletedStages((prev) => new Set([...prev, prevStageRef.current]));
          }
          prevStageRef.current = msg.stage;
          setCurrentStage(msg.stage);
          setCurrentMessage(msg.message || null);
          break;

        case 'stage_progress':
          setStageProgress((prev) => ({ ...prev, [msg.stage]: msg.progress }));
          break;

        case 'stage_data':
          setStageData((prev) => ({ ...prev, [msg.stage]: msg.data }));
          break;

        case 'complete':
          setCompletedStages(new Set(STAGE_ORDER));
          setResult(msg.data);
          setCurrentStage('complete');
          setStatus('complete');
          ws.close();
          break;

        case 'error':
          setError(msg.message);
          setStatus('error');
          ws.close();
          break;
      }
    };

    ws.onerror = () => {
      setError('WebSocket connection failed. Is the backend running?');
      setStatus('error');
    };

    ws.onclose = () => {
      if (wsRef.current === ws) wsRef.current = null;
    };
  }, []);

  const reset = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus('idle');
    setCurrentStage(null);
    setCurrentMessage(null);
    setCompletedStages(new Set());
    setStageProgress({});
    setStageData({});
    setResult(null);
    setError(null);
    prevStageRef.current = null;
  }, []);

  return {
    compress,
    reset,
    slow,
    setSlowMode,
    status,
    currentStage,
    currentMessage,
    completedStages,
    stageProgress,
    stageData,
    result,
    error,
  };
}
