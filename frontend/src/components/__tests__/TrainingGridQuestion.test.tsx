/**
 * Unit tests for the TrainingGridQuestion component (grid-painting 'fill' mode).
 *
 * Covers: rendering the editable grid, painting a cell, validating the grid
 * (calls onAnswer with a JSON payload), and the feedback panel showing the
 * share of correct cells.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TrainingGridQuestion from '../TrainingGridQuestion';
import { TrainingQuestion as TrainingQuestionType } from '../../types';

const referenceHands = { AA: 'raise', KK: 'call' };

const baseQuestion: TrainingQuestionType = {
  type: 'grid_paint',
  hand: 'grid',
  question: 'Remplissez la range en coloriant la grille, puis validez.',
  correct_answer: JSON.stringify({ ...referenceHands }),
};

const renderGrid = (props: Partial<Parameters<typeof TrainingGridQuestion>[0]> = {}) =>
  render(
    <TrainingGridQuestion
      question={baseQuestion}
      onAnswer={jest.fn()}
      onNext={jest.fn()}
      feedback={null}
      {...props}
    />,
  );

describe('TrainingGridQuestion', () => {
  it('renders the question and the validate button', () => {
    renderGrid();
    expect(
      screen.getByText('Remplissez la range en coloriant la grille, puis validez.'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('validate-grid-button')).toBeInTheDocument();
  });

  it('paints a cell and submits the grid as JSON on validate', () => {
    const onAnswer = jest.fn();
    renderGrid({ onAnswer });

    // Paint the AA cell with the default selected action ('open').
    const cell = screen.getByTestId('range-cell-AA');
    fireEvent.mouseDown(cell, { button: 0 });
    fireEvent.mouseUp(cell);

    fireEvent.click(screen.getByTestId('validate-grid-button'));

    expect(onAnswer).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(onAnswer.mock.calls[0][0]);
    // AA was painted with 'open' (the default selectedAction).
    expect(payload.AA).toBe('open');
  });

  it('shows the feedback panel after validation', () => {
    const feedback = {
      isCorrect: false,
      correctAnswer: baseQuestion.correct_answer,
      sessionComplete: true,
    };
    renderGrid({ feedback });

    expect(screen.getByTestId('feedback-panel')).toBeInTheDocument();
    expect(screen.getByText(/cellules correspondent/i)).toBeInTheDocument();
    expect(screen.getByTestId('next-question-button')).toBeInTheDocument();
  });

  it('locks the grid after validation (no validate button)', () => {
    renderGrid({
      feedback: {
        isCorrect: false,
        correctAnswer: baseQuestion.correct_answer,
        sessionComplete: true,
      },
    });
    expect(screen.queryByTestId('validate-grid-button')).not.toBeInTheDocument();
  });
});
