/**
 * TrainingQuestionArea - Displays the current training question
 *
 * Handles different question types:
 * - grid_paint: TrainingGridQuestion
 * - guess: TrainingGuessRangeQuestion
 * - default: TrainingQuestion
 *
 * @component
 */
import React from 'react';
import { Box } from '@mui/material';
import { TrainingQuestion, TrainingGridQuestion, TrainingGuessRangeQuestion } from '../';
import { TrainingQuestion as TrainingQuestionType } from '../../types';

export interface Feedback {
  isCorrect: boolean;
  correctAnswer: string | null;
  sessionComplete: boolean;
}

export interface TrainingQuestionAreaProps {
  question: TrainingQuestionType;
  onAnswer: (answer: string) => Promise<void>;
  onNext: () => void;
  feedback: Feedback | null;
  questionNumber?: number;
  totalQuestions?: number;
}

/**
 * Training question area component
 *
 * Renders the appropriate question component based on question type
 */
export const TrainingQuestionArea: React.FC<TrainingQuestionAreaProps> = ({
  question,
  onAnswer,
  onNext,
  feedback,
  questionNumber,
  totalQuestions,
}) => {
  return (
    <Box sx={{ mb: 3 }}>
      {question.type === 'grid_paint' ? (
        <TrainingGridQuestion
          question={question}
          onAnswer={onAnswer}
          onNext={onNext}
          feedback={feedback}
        />
      ) : question.type === 'guess' && question.grid ? (
        <TrainingGuessRangeQuestion
          question={question}
          onAnswer={onAnswer}
          onNext={onNext}
          feedback={feedback}
          questionNumber={questionNumber}
          totalQuestions={totalQuestions}
        />
      ) : (
        <TrainingQuestion
          question={question}
          onAnswer={onAnswer}
          onNext={onNext}
          feedback={feedback}
          questionNumber={questionNumber}
          totalQuestions={totalQuestions}
        />
      )}
    </Box>
  );
};
