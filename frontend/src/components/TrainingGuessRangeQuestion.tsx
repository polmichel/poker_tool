import React, { useState, useEffect, useMemo } from 'react';
import { Box, Paper, Typography, Button, Divider, LinearProgress } from '@mui/material';
import { CheckCircle, Cancel, ArrowForward } from '@mui/icons-material';
import RangeGrid from './RangeGrid';
import { TrainingQuestion as TrainingQuestionType, ActionType, RangeGridCell } from '../types';
import { generateRangeGrid } from '../utils/helpers';

interface TrainingGuessRangeQuestionProps {
  question: TrainingQuestionType;
  onAnswer: (answer: string) => void;
  onNext: () => void;
  feedback?: { isCorrect: boolean; correctAnswer: string | null; sessionComplete: boolean } | null;
  questionNumber: number;
  totalQuestions: number;
}

// Parse the displayed grid stored as JSON in the question's `grid` field.
function parseDisplayGrid(gridJson: string | undefined): RangeGridCell[][] {
  if (!gridJson) return generateRangeGrid({});
  try {
    const hands = JSON.parse(gridJson) as Record<string, string>;
    return generateRangeGrid(hands as Record<string, ActionType>);
  } catch {
    return generateRangeGrid({});
  }
}

const TrainingGuessRangeQuestion: React.FC<TrainingGuessRangeQuestionProps> = ({
  question,
  onAnswer,
  onNext,
  feedback,
  questionNumber,
  totalQuestions,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');

  // Reset when a new question appears (feedback is cleared).
  useEffect(() => {
    setSelectedAnswer('');
  }, [question, feedback]);

  const displayGrid = useMemo(() => parseDisplayGrid(question.grid), [question.grid]);

  const handleAnswer = (answer: string) => {
    if (feedback) return; // Don't allow re-answering
    setSelectedAnswer(answer);
    onAnswer(answer);
  };

  const isAnswered = !!feedback;
  const progressPercent = (questionNumber / totalQuestions) * 100;
  const options = question.options ?? [];

  return (
    <Paper sx={{ p: 3, maxWidth: 900, margin: 'auto' }} data-testid="guess-range-paper">
      {/* Progress bar */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="body2"
          color="text.secondary"
          gutterBottom
          data-testid="question-indicator"
        >
          Question {questionNumber} sur {totalQuestions}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={progressPercent}
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>
          {question.question}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 2 }}>
          À quelle range de votre bibliothèque correspond cette grille ?
        </Typography>
      </Box>

      {/* Read-only displayed grid (the range to identify) */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <RangeGrid grid={displayGrid} editable={false} cellSize={32} showLabels={false} />
      </Box>

      {/* Range name choices */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, justifyContent: 'center' }}>
        {options.map((option) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = feedback?.correctAnswer === option;
          const showCorrect = isAnswered && isCorrect;
          const showWrong = isAnswered && isSelected && !isCorrect;

          return (
            <Button
              key={option}
              variant={isSelected || showCorrect ? 'contained' : 'outlined'}
              onClick={() => handleAnswer(option)}
              disabled={isAnswered}
              data-testid="guess-option-button"
              sx={{
                minWidth: 120,
                py: 1.5,
                fontSize: '1rem',
                backgroundColor: showCorrect
                  ? 'success.main'
                  : showWrong
                    ? 'error.main'
                    : isSelected
                      ? 'primary.main'
                      : 'transparent',
                borderColor: showCorrect
                  ? 'success.main'
                  : showWrong
                    ? 'error.main'
                    : 'primary.main',
                color: isSelected || showCorrect || showWrong ? 'white' : 'primary.main',
              }}
            >
              {option}
              {showCorrect ? ' \u2713' : ''}
              {showWrong ? ' \u2717' : ''}
            </Button>
          );
        })}
      </Box>

      {/* Feedback panel after answering */}
      {feedback && (
        <Box
          data-testid="feedback-panel"
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 2,
            backgroundColor: feedback.isCorrect ? 'success.dark' : 'error.dark',
            color: 'white',
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              mb: 1,
            }}
          >
            {feedback.isCorrect ? <CheckCircle /> : <Cancel />}
            <Typography variant="h6">{feedback.isCorrect ? 'Correct !' : 'Faux'}</Typography>
          </Box>
          {!feedback.isCorrect && feedback.correctAnswer && (
            <Typography variant="body1" sx={{ mb: 2 }}>
              La bonne réponse était : <strong>{feedback.correctAnswer}</strong>
            </Typography>
          )}
          {feedback.isCorrect && (
            <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
              Vous avez répondu : {selectedAnswer}
            </Typography>
          )}
          <Button
            variant="contained"
            onClick={onNext}
            endIcon={<ArrowForward />}
            sx={{
              backgroundColor: 'white',
              color: feedback.isCorrect ? 'success.dark' : 'error.dark',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' },
            }}
            data-testid="next-question-button"
          >
            {feedback.sessionComplete ? 'Voir les résultats' : 'Question suivante'}
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default TrainingGuessRangeQuestion;
