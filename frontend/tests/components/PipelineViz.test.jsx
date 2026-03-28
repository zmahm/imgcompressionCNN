import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PipelineViz from '../../src/components/PipelineViz';

describe('PipelineViz', () => {
  it('renders all stage labels', () => {
    render(
      <PipelineViz
        currentStage={null}
        completedStages={new Set()}
        stageProgress={{}}
      />
    );
    expect(screen.getByText('Pre-process')).toBeInTheDocument();
    expect(screen.getByText('Encoder CNN')).toBeInTheDocument();
    expect(screen.getByText('Latent Space')).toBeInTheDocument();
    expect(screen.getByText('Quantize')).toBeInTheDocument();
    expect(screen.getByText('Entropy Code')).toBeInTheDocument();
    expect(screen.getByText('Decoder CNN')).toBeInTheDocument();
    expect(screen.getByText('Post-process')).toBeInTheDocument();
  });

  it('shows pipeline heading', () => {
    render(
      <PipelineViz currentStage="encoding" completedStages={new Set()} stageProgress={{}} />
    );
    expect(screen.getByText('Compression Pipeline')).toBeInTheDocument();
  });

  it('shows complete text when done', () => {
    render(
      <PipelineViz
        currentStage="complete"
        completedStages={new Set(['preprocessing', 'encoding'])}
        stageProgress={{}}
      />
    );
    expect(screen.getByText('Complete')).toBeInTheDocument();
  });
});
