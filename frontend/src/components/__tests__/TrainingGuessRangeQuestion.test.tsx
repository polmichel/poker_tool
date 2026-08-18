/**
 * Unit tests for the TrainingGuessRangeQuestion component
 * ("Deviner une range" mode: identify a displayed grid among the library).
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TrainingGuessRangeQuestion from '../TrainingGuessRangeQuestion';
import { TrainingQuestion as TrainingQuestionType } from '../../types';

const displayHands = { AA: 'raise', KK: 'open', AKs: 'open' };

const baseQuestion: TrainingQuestionType = {
  type: 'guess',
  hand: 'grid',
  question: 'À quelle range de la bibliothèque correspond cette grille ?',
  correct_answer: 'UTG Open',
  options: ['BTN Steal', 'UTG Open', 'SB Push'],
  grid: JSON.stringify(displayHands),
};

const renderGuess = (props: Partial<Parameters<typeof TrainingGuessRangeQuestion>[0]> = {}) =>
  render(
    <TrainingGuessRangeQuestion
      question={baseQuestion}
      onAnswer={jest.fn()}
      onNext={jest.fn()}
      feedback={null}
      questionNumber={1}
      totalQuestions={3}
      {...props}
    />,
  );

describe('TrainingGuessRangeQuestion', () => {
  it('renders the question text, the displayed grid and the option buttons', () => {
    renderGuess();
    expect(
      screen.getByText('À quelle range de la bibliothèque correspond cette grille ?'),
    ).toBeInTheDocument();
    // The displayed grid renders cells (read-only).
    expect(screen.getByTestId('range-cell-AA')).toBeInTheDocument();
    // Each option is rendered as a button.
    expect(screen.getByText('UTG Open')).toBeInTheDocument();
    expect(screen.getByText('BTN Steal')).toBeInTheDocument();
    expect(screen.getByText('SB Push')).toBeInTheDocument();
  });

  it('calls onAnswer with the selected range name', () => {
    const onAnswer = jest.fn();
    renderGuess({ onAnswer });

    fireEvent.click(screen.getByText('UTG Open'));
    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onAnswer).toHaveBeenCalledWith('UTG Open');
  });

  it('disables option buttons once answered (feedback present)', () => {
    renderGuess({
      feedback: { isCorrect: true, correctAnswer: 'UTG Open', sessionComplete: false },
    });
    // With feedback, all option buttons are disabled.
    const buttons = screen.getAllByTestId('guess-option-button');
    buttons.forEach((b) => expect(b).toBeDisabled());
  });

  it('shows the feedback panel with the correct answer when wrong', () => {
    const feedback = {
      isCorrect: false,
      correctAnswer: 'UTG Open',
      sessionComplete: false,
    };
    renderGuess({ feedback });

    expect(screen.getByTestId('feedback-panel')).toBeInTheDocument();
    expect(screen.getByText(/La bonne réponse était/i)).toBeInTheDocument();
    expect(screen.getByText('Question suivante')).toBeInTheDocument();
  });

  it('shows the "Voir les résultats" button when the session is complete', () => {
    const feedback = {
      isCorrect: true,
      correctAnswer: 'UTG Open',
      sessionComplete: true,
    };
    renderGuess({ feedback });

    expect(screen.getByTestId('feedback-panel')).toBeInTheDocument();
    expect(screen.getByText('Voir les résultats')).toBeInTheDocument();
  });
});
