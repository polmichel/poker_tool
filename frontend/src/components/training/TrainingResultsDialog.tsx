/**
 * TrainingResultsDialog - Results modal after completing a training session
 *
 * Displays:
 * - Final score percentage
 * - Correct answers count
 * - Total questions count
 * - Time spent
 * - Progress bar
 * - Actions: Close, Restart
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
  Divider,
  LinearProgress,
  Typography,
} from '@mui/material';
import { Replay as ReplayIcon } from '@mui/icons-material';

export interface TrainingResultsDialogProps {
  open: boolean;
  onClose: () => void;
  onRestart: () => void;
  score: number;
  correctCount: number;
  totalCount: number;
  timeSpent: number;
}

/**
 * Training results dialog component
 */
export const TrainingResultsDialog: React.FC<TrainingResultsDialogProps> = ({
  open,
  onClose,
  onRestart,
  score,
  correctCount,
  totalCount,
  timeSpent,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      data-testid="results-dialog"
    >
      <DialogTitle>Resultats de la Session</DialogTitle>
      <DialogContent>
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" color="primary" gutterBottom data-testid="final-score">
            {Math.round(score)}%
          </Typography>
          <Typography variant="h6" gutterBottom>
            Score final
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Bonnes reponses
              </Typography>
              <Typography variant="h6">{correctCount}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Questions
              </Typography>
              <Typography variant="h6">{totalCount}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Temps
              </Typography>
              <Typography variant="h6">
                {Math.floor(timeSpent / 60)}m {timeSpent % 60}s
              </Typography>
            </Box>
          </Box>

          <LinearProgress
            variant="determinate"
            value={score}
            sx={{ height: 8, borderRadius: 4, mb: 2 }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Fermer
        </Button>
        <Button
          onClick={onRestart}
          color="primary"
          startIcon={<ReplayIcon />}
        >
          Recommencer
        </Button>
      </DialogActions>
    </Dialog>
  );
};
