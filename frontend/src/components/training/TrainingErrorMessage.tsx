/**
 * TrainingErrorMessage - Displays error messages for training
 *
 * Shows error in a styled Paper component
 * Also handles the "no questions available" error state
 *
 * @component
 */
import React from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';

export interface TrainingErrorMessageProps {
  error?: string | null;
  isSessionActive: boolean;
  currentQuestion: boolean;
  onReset: () => void;
}

/**
 * Training error message component
 */
export const TrainingErrorMessage: React.FC<TrainingErrorMessageProps> = ({
  error,
  isSessionActive,
  currentQuestion,
  onReset,
}) => {
  // Error display
  if (error) {
    return (
      <Paper sx={{ p: 2, mb: 2, backgroundColor: 'error.main', color: 'error.contrastText' }}>
        <Typography variant="body1">{error}</Typography>
      </Paper>
    );
  }

  // Session active but no question error
  if (isSessionActive && !currentQuestion) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>
          Aucune question disponible
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          La range selectionnee ne contient pas assez de mains pour generer des questions.
        </Typography>
        <Button variant="contained" onClick={onReset} color="inherit">
          Retour
        </Button>
      </Paper>
    );
  }

  return null;
};
