import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  Chip,
  LinearProgress,
} from '@mui/material';
import { TrainingQuestion as TrainingQuestionType, ActionType } from '../types';
import { ACTION_COLORS, ACTION_LABELS } from '../utils/constants';
import { getActionLabel } from '../utils/helpers';
import RangeGrid from './RangeGrid';
import { generateRangeGrid } from '../utils/helpers';

interface TrainingQuestionProps {
  question: TrainingQuestionType;
  onAnswer: (answer: string) => void;
  isLastQuestion?: boolean;
  questionNumber: number;
  totalQuestions: number;
  timeLeft?: number;
}

const TrainingQuestion: React.FC<TrainingQuestionProps> = ({
  question,
  onAnswer,
  isLastQuestion = false,
  questionNumber,
  totalQuestions,
  timeLeft,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showHint, setShowHint] = useState<boolean>(false);

  // Réinitialiser la réponse sélectionnée quand la question change
  useEffect(() => {
    setSelectedAnswer('');
    setShowHint(false);
  }, [question]);

  const handleAnswer = useCallback((answer: string) => {
    setSelectedAnswer(answer);
    onAnswer(answer);
  }, [onAnswer]);

  const handleShowHint = useCallback(() => {
    setShowHint(true);
  }, []);

  const renderQuestionContent = () => {
    switch (question.type) {
      case 'fill':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              {question.question}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Sélectionnez l'action pour la main : <strong>{question.hand}</strong>
            </Typography>
            
            {/* Boutons pour les actions */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {Object.entries(ACTION_LABELS).map(([action, label]) => (
                <Button
                  key={action}
                  variant={selectedAnswer === action ? 'contained' : 'outlined'}
                  onClick={() => handleAnswer(action)}
                  disabled={!!selectedAnswer}
                  sx={{
                    backgroundColor: selectedAnswer === action 
                      ? ACTION_COLORS[action as ActionType] 
                      : 'transparent',
                    borderColor: ACTION_COLORS[action as ActionType],
                    color: selectedAnswer === action || action === 'undefined' 
                      ? 'white' 
                      : ACTION_COLORS[action as ActionType],
                    '&:hover': {
                      backgroundColor: ACTION_COLORS[action as ActionType],
                      color: 'white',
                    },
                  }}
                >
                  {label}
                </Button>
              ))}
            </Box>
          </Box>
        );

      case 'guess':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              {question.question}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              La main <strong>{question.hand}</strong> fait-elle partie de cette range ?
            </Typography>
            
            {/* Boutons Oui/Non */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button
                variant={selectedAnswer === 'true' ? 'contained' : 'outlined'}
                onClick={() => handleAnswer('true')}
                disabled={!!selectedAnswer}
                color="success"
                sx={{ flex: 1 }}
              >
                Oui
              </Button>
              <Button
                variant={selectedAnswer === 'false' ? 'contained' : 'outlined'}
                onClick={() => handleAnswer('false')}
                disabled={!!selectedAnswer}
                color="error"
                sx={{ flex: 1 }}
              >
                Non
              </Button>
            </Box>
          </Box>
        );

      case 'complete':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              {question.question}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Quelle est l'action pour la main : <strong>{question.hand}</strong>
            </Typography>
            
            {/* Boutons pour les actions */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {Object.entries(ACTION_LABELS).map(([action, label]) => (
                <Button
                  key={action}
                  variant={selectedAnswer === action ? 'contained' : 'outlined'}
                  onClick={() => handleAnswer(action)}
                  disabled={!!selectedAnswer}
                  sx={{
                    backgroundColor: selectedAnswer === action 
                      ? ACTION_COLORS[action as ActionType] 
                      : 'transparent',
                    borderColor: ACTION_COLORS[action as ActionType],
                    color: selectedAnswer === action || action === 'undefined' 
                      ? 'white' 
                      : ACTION_COLORS[action as ActionType],
                    '&:hover': {
                      backgroundColor: ACTION_COLORS[action as ActionType],
                      color: 'white',
                    },
                  }}
                >
                  {label}
                </Button>
              ))}
            </Box>
          </Box>
        );

      default:
        return (
          <Typography variant="body1">
            Type de question inconnu.
          </Typography>
        );
    }
  };

  return (
    <Paper
      sx={{
        p: 3,
        maxWidth: 800,
        margin: 'auto',
      }}
    >
      {/* Barre de progression */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Question {questionNumber} sur {totalQuestions}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={(questionNumber / totalQuestions) * 100}
          sx={{
            height: 8,
            borderRadius: 4,
          }}
        />
        {timeLeft !== undefined && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Temps restant : {Math.floor(timeLeft / 60)}m {timeLeft % 60}s
          </Typography>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Contenu de la question */}
      {renderQuestionContent()}

      <Divider sx={{ my: 2 }} />

      {/* Indice (si disponible) */}
      {showHint && question.type === 'fill' && (
        <Chip
          label={`Indice : ${getActionLabel(question.correct_answer as ActionType)}`}
          color="info"
          size="small"
        />
      )}

      {/* Bouton pour afficher l'indice (si pas encore montré) */}
      {!showHint && !selectedAnswer && (
        <Button
          variant="text"
          onClick={handleShowHint}
          color="info"
          size="small"
          sx={{ mt: 1 }}
        >
          Besoin d'un indice ?
        </Button>
      )}
    </Paper>
  );
};

export default TrainingQuestion;
