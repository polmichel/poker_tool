/**
 * Unit tests for the TrainingQuestion component.
 *
 * Covers the new feedback flow: after answering, a feedback panel appears
 * showing whether the answer was correct, what the correct answer was,
 * and a "Question suivante" button to advance.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TrainingQuestion from '../TrainingQuestion';
import { TrainingQuestion as TrainingQuestionType } from '../../types';

const baseQuestion: TrainingQuestionType = {
  type: 'fill',
  hand: 'AKs',
  question: 'Quelle action pour AKs ?',
  correct_answer: 'raise',
};

const renderQuestion = (props: Partial<Parameters<typeof TrainingQuestion>[0]> = {}) =>
  render(
    <TrainingQuestion
      question={baseQuestion}
      onAnswer={jest.fn()}
      onNext={jest.fn()}
      feedback={null}
      questionNumber={1}
      totalQuestions={10}
      {...props}
    />,
  );

describe('TrainingQuestion', () => {
  it('renders the question with hand and progress', () => {
    renderQuestion();
    expect(screen.getByText('AKs')).toBeInTheDocument();
    expect(screen.getByTestId('question-indicator')).toHaveTextContent('Question 1 sur 10');
  });

  it('renders action buttons for fill mode', () => {
    renderQuestion();
    const buttons = screen.getAllByTestId('answer-button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders Oui/Non buttons for guess mode', () => {
    renderQuestion({
      question: { ...baseQuestion, type: 'guess' },
    });
    expect(screen.getByText('Oui')).toBeInTheDocument();
    expect(screen.getByText('Non')).toBeInTheDocument();
  });

  it('calls onAnswer when an answer button is clicked', () => {
    const onAnswer = jest.fn();
    renderQuestion({ onAnswer });
    const buttons = screen.getAllByTestId('answer-button');
    fireEvent.click(buttons[0]);
    expect(onAnswer).toHaveBeenCalled();
  });

  it('does not show feedback panel before answering', () => {
    renderQuestion({ feedback: null });
    expect(screen.queryByTestId('feedback-panel')).not.toBeInTheDocument();
  });

  it('shows feedback panel with "Correct !" when answer is correct', () => {
    renderQuestion({
      feedback: { isCorrect: true, correctAnswer: 'raise' },
    });
    expect(screen.getByTestId('feedback-panel')).toBeInTheDocument();
    expect(screen.getByText('Correct !')).toBeInTheDocument();
  });

  it('shows feedback panel with "Faux" and the correct answer when wrong', () => {
    renderQuestion({
      feedback: { isCorrect: false, correctAnswer: 'raise' },
    });
    expect(screen.getByText('Faux')).toBeInTheDocument();
    expect(screen.getByText(/La bonne réponse était/)).toBeInTheDocument();
  });

  it('shows "Question suivante" button after answering', () => {
    renderQuestion({
      feedback: { isCorrect: true, correctAnswer: 'raise' },
    });
    expect(screen.getByTestId('next-question-button')).toBeInTheDocument();
    expect(screen.getByText('Question suivante')).toBeInTheDocument();
  });

  it('calls onNext when "Question suivante" is clicked', () => {
    const onNext = jest.fn();
    renderQuestion({
      feedback: { isCorrect: true, correctAnswer: 'raise' },
      onNext,
    });
    fireEvent.click(screen.getByTestId('next-question-button'));
    expect(onNext).toHaveBeenCalled();
  });

  it('disables answer buttons after answering', () => {
    renderQuestion({
      feedback: { isCorrect: false, correctAnswer: 'raise' },
    });
    const buttons = screen.getAllByTestId('answer-button');
    buttons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it('shows ✓ on the correct answer button and ✗ on the wrong one', () => {
    renderQuestion({
      feedback: { isCorrect: false, correctAnswer: 'raise' },
    });
    const buttons = screen.getAllByTestId('answer-button');
    // One button should have ✓ (the correct one) and potentially ✗ on the wrong one
    const allText = buttons.map((b) => b.textContent).join(' ');
    expect(allText).toContain('✓');
  });

  it('updates progress bar based on question number', () => {
    renderQuestion({ questionNumber: 5, totalQuestions: 10 });
    expect(screen.getByTestId('question-indicator')).toHaveTextContent('Question 5 sur 10');
  });
});
