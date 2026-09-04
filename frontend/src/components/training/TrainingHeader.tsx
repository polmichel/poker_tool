/**
 * TrainingHeader - Training page header component
 *
 * Displays:
 * - Page title
 * - Focus mode toggle button
 * - Settings button
 * - Quick start button
 *
 * @component
 */
import React from 'react';
import { Box, Button, IconButton, Tooltip, Typography } from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Settings as SettingsIcon,
  Fullscreen as FullscreenIcon,
} from '@mui/icons-material';

export interface TrainingHeaderProps {
  onFocusMode: () => void;
  onSettings: () => void;
  onQuickStart: () => void;
  quickStartDisabled: boolean;
}

/**
 * Training page header component
 */
export const TrainingHeader: React.FC<TrainingHeaderProps> = ({
  onFocusMode,
  onSettings,
  onQuickStart,
  quickStartDisabled,
}) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Typography variant="h4" component="h1">
        Entrainement
      </Typography>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Tooltip title="Mode Focus (Ctrl+M)">
          <IconButton onClick={onFocusMode} color="inherit">
            <FullscreenIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Parametres">
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={onSettings}
            color="inherit"
          >
            Parametres
          </Button>
        </Tooltip>

        <Tooltip title="Demarrer rapidement">
          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={onQuickStart}
            color="success"
            disabled={quickStartDisabled}
            data-testid="quick-start-button"
          >
            Demarrer
          </Button>
        </Tooltip>
      </Box>
    </Box>
  );
};
