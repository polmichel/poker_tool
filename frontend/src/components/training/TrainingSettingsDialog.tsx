/**
 * TrainingSettingsDialog - Settings modal for training configuration
 *
 * Allows user to configure:
 * - Number of questions
 *
 * @component
 */
import React from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';

export interface TrainingSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  totalQuestions: number;
  onSetTotalQuestions: (num: number) => void;
}

const QUESTION_OPTIONS = [5, 10, 20, 50];

/**
 * Training settings dialog component
 */
export const TrainingSettingsDialog: React.FC<TrainingSettingsDialogProps> = ({
  open,
  onClose,
  totalQuestions,
  onSetTotalQuestions,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Parametres d'entrainement</DialogTitle>
      <DialogContent>
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Nombre de questions
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            {QUESTION_OPTIONS.map((num) => (
              <Button
                key={num}
                variant={totalQuestions === num ? 'contained' : 'outlined'}
                onClick={() => onSetTotalQuestions(num)}
              >
                {num}
              </Button>
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};
