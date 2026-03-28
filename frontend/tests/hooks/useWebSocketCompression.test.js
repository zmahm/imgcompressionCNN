import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWebSocketCompression, STAGE_ORDER } from '../../src/hooks/useWebSocketCompression';

describe('useWebSocketCompression', () => {
  it('starts in idle status', () => {
    const { result } = renderHook(() => useWebSocketCompression());
    expect(result.current.status).toBe('idle');
  });

  it('has null currentStage initially', () => {
    const { result } = renderHook(() => useWebSocketCompression());
    expect(result.current.currentStage).toBeNull();
  });

  it('has empty completedStages initially', () => {
    const { result } = renderHook(() => useWebSocketCompression());
    expect(result.current.completedStages.size).toBe(0);
  });

  it('has null result and error initially', () => {
    const { result } = renderHook(() => useWebSocketCompression());
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('exports STAGE_ORDER with correct stages', () => {
    expect(STAGE_ORDER).toContain('preprocessing');
    expect(STAGE_ORDER).toContain('encoding');
    expect(STAGE_ORDER).toContain('latent');
    expect(STAGE_ORDER).toContain('quantizing');
    expect(STAGE_ORDER).toContain('entropy_coding');
    expect(STAGE_ORDER).toContain('decoding');
    expect(STAGE_ORDER).toContain('postprocessing');
    expect(STAGE_ORDER.length).toBe(7);
  });

  it('transitions to connecting state when compress is called', async () => {
    const { result } = renderHook(() => useWebSocketCompression());
    const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' });

    act(() => {
      result.current.compress(file, 4);
    });

    expect(result.current.status).toBe('connecting');
  });

  it('resets state on reset() call', async () => {
    const { result } = renderHook(() => useWebSocketCompression());
    const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' });

    act(() => { result.current.compress(file, 4); });
    act(() => { result.current.reset(); });

    expect(result.current.status).toBe('idle');
    expect(result.current.currentStage).toBeNull();
    expect(result.current.completedStages.size).toBe(0);
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
