import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../src/App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
  });

  it('shows the app title in header', () => {
    render(<App />);
    expect(screen.getByText('Neural Image')).toBeInTheDocument();
  });

  it('shows upload zone initially', () => {
    render(<App />);
    expect(screen.getByText(/drop your image/i)).toBeInTheDocument();
  });

  it('shows compress button disabled when no file selected', () => {
    render(<App />);
    const compressBtn = screen.getByText('Compress');
    expect(compressBtn).toBeDisabled();
  });
});
