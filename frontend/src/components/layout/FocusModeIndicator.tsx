/**
 * FocusModeIndicator - Displayed when in focus mode
 *
 * Shows a small indicator bar at the top of the screen with
 * a button to exit focus mode
 *
 * @component
 */
import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { FullscreenExit as FullscreenExitIcon } from '@mui/icons-material';
import { THEME_COLORS } from '../../utils/constants';

export interface FocusModeIndicatorProps {
  onExitFocusMode: () => void;
}

/**
 * FocusModeIndicator component
 *
 * Only visible when in focus mode, provides a way to exit
 */
export const FocusModeIndicator: React.FC<FocusModeIndicatorProps> = ({
  onExitFocusMode,
}) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        px: 2,
        backgroundColor: 'rgba(11,15,20,0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${THEME_COLORS.border}`,
        zIndex: 1200,
        transition: 'opacity 0.3s ease',
      }}
    >
      <Tooltip title="Quitter le mode focus (Ctrl+M)" arrow>
        <IconButton
          color="inherit"
          onClick={onExitFocusMode}
          sx={{
            color: THEME_COLORS.textPrimary,
            backgroundColor: THEME_COLORS.paper,
            border: `1px solid ${THEME_COLORS.border}`,
            '&:hover': {
              backgroundColor: THEME_COLORS.paperElevated,
            },
          }}
          aria-label="Quitter le mode focus"
        >
          <FullscreenExitIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
