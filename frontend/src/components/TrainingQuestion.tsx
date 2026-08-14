import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Button, Divider, LinearProgress, Chip } from '@mui/material';
import { CheckCircle, Cancel, ArrowForward } from '@mui/icons-material';
import { TrainingQuestion as TrainingQuestionType, ActionType } from '../types';
import { ACTION_COLORS, ACTION_LABELS } from '../utils/constants';

interface TrainingQuestionProps {
  question: TrainingQuestionType;
  onAnswer: (answer: string) => void;
  onNext: () => void;
  feedback?: { isCorrect: boolean; correctAnswer: string | null } | null;
  questionNumber: number;
  totalQuestions: number;
}

const TrainingQuestion: React.FC<TrainingQuestionProps> = ({
  question,
  onAnswer,
  onNext,
  feedback,
  questionNumber,
  totalQuestions,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');

  // Reset when a new question appears (feedback is cleared)
  useEffect(() => {
    setSelectedAnswer('');
  }, [question, feedback]);

  const handleAnswer = (answer: string) => {
    if (feedback) return; // Don't allow re-answering
    setSelectedAnswer(answer);
    onAnswer(answer);
  };

  const getAnswerLabel = (answer: string): string => {
    if (answer === 'true') return 'Oui';
    if (answer === 'false') return 'Non';
    return ACTION_LABELS[answer as ActionType] || answer;
  };

  const isAnswered = !!feedback;
  const progressPercent = (questionNumber / totalQuestions) * 100;

  return (
    <Paper sx={{ p: 3, maxWidth: 800, margin: 'auto' }} data-testid="question-paper">
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

      {/* Question content */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" gutterBottom sx={{ textAlign: 'center' }}>
          {question.hand}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
          {question.type === 'guess'
            ? 'Cette main fait-elle partie de la range ?'
            : 'Quelle action pour cette main ?'}
        </Typography>
      </Box>

      {/* Answer buttons */}
      {question.type === 'guess' ? (
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button
            variant={selectedAnswer === 'true' ? 'contained' : 'outlined'}
            onClick={() => handleAnswer('true')}
            disabled={isAnswered}
            color="success"
            sx={{ flex: 1, py: 2, fontSize: '1.2rem' }}
          >
            Oui
          </Button>
          <Button
            variant={selectedAnswer === 'false' ? 'contained' : 'outlined'}
            onClick={() => handleAnswer('false')}
            disabled={isAnswered}
            color="error"
            sx={{ flex: 1, py: 2, fontSize: '1.2rem' }}
          >
            Non
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, justifyContent: 'center' }}>
          {Object.entries(ACTION_LABELS).map(([action, label]) => {
            const isSelected = selectedAnswer === action;
            const isCorrect = feedback?.correctAnswer === action;
            const showCorrect = isAnswered && isCorrect;
            const showWrong = isAnswered && isSelected && !isCorrect;

            return (
              <Button
                key={action}
                variant={isSelected || showCorrect ? 'contained' : 'outlined'}
                onClick={() => handleAnswer(action)}
                disabled={isAnswered}
                data-testid="answer-button"
                sx={{
                  minWidth: 100,
                  py: 1.5,
                  fontSize: '1rem',
                  backgroundColor: showCorrect
                    ? ACTION_COLORS[action as ActionType]
                    : showWrong
                      ? 'error.main'
                      : isSelected
                        ? ACTION_COLORS[action as ActionType]
                        : 'transparent',
                  borderColor: showCorrect
                    ? ACTION_COLORS[action as ActionType]
                    : showWrong
                      ? 'error.main'
                      : ACTION_COLORS[action as ActionType],
                  color: isSelected || showCorrect ? 'white' : ACTION_COLORS[action as ActionType],
                  '&:hover': {
                    backgroundColor: ACTION_COLORS[action as ActionType],
                    color: 'white',
                  },
                }}
              >
                {label}
                {showCorrect ? ' ✓' : ''}
                {showWrong ? ' ✗' : ''}
              </Button>
            );
          })}
        </Box>
      )}

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
              La bonne réponse était : <strong>{getAnswerLabel(feedback.correctAnswer)}</strong>
            </Typography>
          )}
          {feedback.isCorrect && (
            <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
              Vous avez répondu : {getAnswerLabel(selectedAnswer)}
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
            Question suivante
          </Button>
        </Box>
      )}

      {/* Show selected answer before feedback arrives (brief loading state) */}
      {isAnswered === false && selectedAnswer && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Chip label={`Vous avez répondu : ${getAnswerLabel(selectedAnswer)}`} color="info" />
        </Box>
      )}
    </Paper>
  );
};

export default TrainingQuestion;
