/**
 * TrainingStartPrompt - Prompt to start training when no session is active
 *
 * Displays when user needs to select mode and range before starting
 * Shows "Ready to train?" message
 *
 * @component
 */
import React from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { PlayArrow as PlayArrowIcon } from '@mui/icons-material';

export interface TrainingStartPromptProps {
  onStart: () => void;
  disabled: boolean;
}

/**
 * Training start prompt component
 */
export const TrainingStartPrompt: React.FC<TrainingStartPromptProps> = ({
  onStart,
  disabled,
}) => {
  return (
    <Paper sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h6" gutterBottom>
        Pret a vous entrainer ?
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Selectionnez un mode et une range, puis cliquez sur "Demarrer"
      </Typography>

      <Button
        variant="contained"
        startIcon={<PlayArrowIcon />}
        onClick={onStart}
        disabled={disabled}
        size="large"
        data-testid="start-training-button"
      >
        Demarrer l'entrainement
      </Button>
    </Paper>
  );
};
