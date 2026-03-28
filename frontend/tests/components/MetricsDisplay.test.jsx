import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MetricsDisplay from '../../src/components/MetricsDisplay';

const mockResult = {
  psnr: 32.5,
  ssim: 0.912,
  bpp: 0.487,
  compressed_bytes: 12288,
  original_bytes: 98304,
  compression_ratio: 8.0,
  dimensions: { width: 512, height: 512 },
  quality: 4,
};

describe('MetricsDisplay', () => {
  it('renders nothing when result is null', () => {
    const { container } = render(<MetricsDisplay result={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders quality metrics section', () => {
    render(<MetricsDisplay result={mockResult} />);
    expect(screen.getByText('Quality Metrics')).toBeInTheDocument();
  });

  it('renders compression stats section', () => {
    render(<MetricsDisplay result={mockResult} />);
    expect(screen.getByText('Compression Stats')).toBeInTheDocument();
  });

  it('displays PSNR value', () => {
    render(<MetricsDisplay result={mockResult} />);
    expect(screen.getByText('32.5 dB')).toBeInTheDocument();
  });

  it('displays SSIM value', () => {
    render(<MetricsDisplay result={mockResult} />);
    expect(screen.getByText('0.9120')).toBeInTheDocument();
  });

  it('displays bpp value', () => {
    render(<MetricsDisplay result={mockResult} />);
    expect(screen.getByText('0.4870')).toBeInTheDocument();
  });

  it('displays compression ratio', () => {
    render(<MetricsDisplay result={mockResult} />);
    expect(screen.getByText('8×')).toBeInTheDocument();
  });

  it('displays image dimensions', () => {
    render(<MetricsDisplay result={mockResult} />);
    expect(screen.getByText('512×512')).toBeInTheDocument();
  });

  it('shows quality level', () => {
    render(<MetricsDisplay result={mockResult} />);
    expect(screen.getByText('4/8')).toBeInTheDocument();
  });
});
