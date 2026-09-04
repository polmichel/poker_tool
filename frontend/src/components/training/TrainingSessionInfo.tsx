/**
 * TrainingSessionInfo - Displays current session progress and controls
 *
 * Shows:
 * - Current score
 * - Time spent
 * - Progress bar
 * - End session button
 *
 * @component
 */
import React from 'react';
import { Box, Chip, IconButton, LinearProgress, Paper, Tooltip, Typography } from '@mui/material';
import { Stop as StopIcon } from '@mui/icons-material';

export interface TrainingSessionInfoProps {
  score: number;
  timeSpent: number;
  onEndSession: () => void;
}

/**
 * Training session info component
 */
export const TrainingSessionInfo: React.FC<TrainingSessionInfoProps> = ({
  score,
  timeSpent,
  onEndSession,
}) => {
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
      >
        <Typography variant="h6">Session en cours</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip label={`Score: ${Math.round(score)}%`} color="primary" />
          <Chip
            label={`Temps: ${Math.floor(timeSpent / 60)}m ${timeSpent % 60}s`}
            color="secondary"
          />
        </Box>
      </Box>

      <LinearProgress
        variant="determinate"
        value={score}
        sx={{ height: 8, borderRadius: 4, mb: 2 }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Tooltip title="Terminer la session">
          <IconButton
            onClick={onEndSession}
            color="error"
            data-testid="end-session-button"
          >
            <StopIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  );
};
