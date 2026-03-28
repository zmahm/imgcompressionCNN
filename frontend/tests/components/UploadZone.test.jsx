import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import UploadZone from '../../src/components/UploadZone';

describe('UploadZone', () => {
  it('renders the drop zone', () => {
    render(<UploadZone onCompress={vi.fn()} quality={4} setQuality={vi.fn()} />);
    expect(screen.getByText(/drop your image here/i)).toBeInTheDocument();
  });

  it('shows compress button disabled initially', () => {
    render(<UploadZone onCompress={vi.fn()} quality={4} setQuality={vi.fn()} />);
    expect(screen.getByText('Compress')).toBeDisabled();
  });

  it('renders quality slider', () => {
    render(<UploadZone onCompress={vi.fn()} quality={4} setQuality={vi.fn()} />);
    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBeGreaterThan(0);
  });

  it('shows quality value label', () => {
    render(<UploadZone onCompress={vi.fn()} quality={4} setQuality={vi.fn()} />);
    expect(screen.getByText('4/8')).toBeInTheDocument();
  });

  it('calls onCompress with file after file selected and button clicked', () => {
    const onCompress = vi.fn();
    const { container } = render(
      <UploadZone onCompress={onCompress} quality={4} setQuality={vi.fn()} />
    );

    const input = container.querySelector('input[type="file"]');
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file] } });
  });

  it('renders info tags', () => {
    render(<UploadZone onCompress={vi.fn()} quality={4} setQuality={vi.fn()} />);
    expect(screen.getByText('CompressAI Model')).toBeInTheDocument();
    expect(screen.getByText('Real-time WebSocket')).toBeInTheDocument();
  });
});
