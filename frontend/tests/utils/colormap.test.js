import { describe, it, expect } from 'vitest';
import { viridisColor, plasmaColor, drawHeatmap } from '../../src/utils/colormap';

describe('viridisColor', () => {
  it('returns array of 3 numbers', () => {
    const result = viridisColor(0.5);
    expect(result).toHaveLength(3);
    result.forEach((v) => expect(typeof v).toBe('number'));
  });

  it('returns values in [0, 255]', () => {
    [0, 0.25, 0.5, 0.75, 1].forEach((t) => {
      const [r, g, b] = viridisColor(t);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(255);
      expect(g).toBeGreaterThanOrEqual(0);
      expect(g).toBeLessThanOrEqual(255);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(255);
    });
  });

  it('t=0 is dark purple', () => {
    const [r, g, b] = viridisColor(0);
    expect(r).toBeLessThan(100);
    expect(b).toBeGreaterThan(50);
  });

  it('t=1 is yellow', () => {
    const [r, g, b] = viridisColor(1);
    expect(r).toBeGreaterThan(200);
    expect(g).toBeGreaterThan(200);
    expect(b).toBeLessThan(100);
  });

  it('interpolates smoothly (monotonic-ish in luminance)', () => {
    const colors = [0, 0.5, 1].map(viridisColor);
    // Just check they are different
    expect(colors[0]).not.toEqual(colors[1]);
    expect(colors[1]).not.toEqual(colors[2]);
  });
});

describe('plasmaColor', () => {
  it('returns array of 3 values in [0, 255]', () => {
    [0, 0.5, 1].forEach((t) => {
      const result = plasmaColor(t);
      expect(result).toHaveLength(3);
      result.forEach((v) => {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(255);
      });
    });
  });
});

describe('drawHeatmap', () => {
  it('calls canvas context methods', () => {
    const mockCtx = {
      createImageData: vi.fn().mockReturnValue({ data: new Uint8ClampedArray(16) }),
      putImageData: vi.fn(),
    };
    const mockCanvas = { getContext: vi.fn().mockReturnValue(mockCtx) };
    const data = [[0.5, 0.8], [0.2, 0.9]];

    drawHeatmap(mockCanvas, data);

    expect(mockCtx.createImageData).toHaveBeenCalledWith(2, 2);
    expect(mockCtx.putImageData).toHaveBeenCalled();
  });

  it('does nothing if canvas is null', () => {
    expect(() => drawHeatmap(null, [[0.5]])).not.toThrow();
  });

  it('does nothing if data is empty', () => {
    const mockCtx = { createImageData: vi.fn(), putImageData: vi.fn() };
    const mockCanvas = { getContext: () => mockCtx };
    drawHeatmap(mockCanvas, []);
    expect(mockCtx.createImageData).not.toHaveBeenCalled();
  });
});
