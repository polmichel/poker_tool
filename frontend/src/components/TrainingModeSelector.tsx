import React from 'react';
import {
  Box,
  Typography,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
} from '@mui/material';
import { TrainingMode } from '../types';
import { TRAINING_MODES } from '../utils/constants';
import { HelpOutline, Edit, CheckBox, AutoAwesome } from '@mui/icons-material';

interface TrainingModeSelectorProps {
  selectedMode: TrainingMode;
  onModeChange: (mode: TrainingMode) => void;
  disabled?: boolean;
}

const modeIcons: Record<TrainingMode, React.ReactNode> = {
  fill: <Edit />,
  guess: <HelpOutline />,
  complete: <CheckBox />,
};

const modeDescriptions: Record<TrainingMode, string> = {
  fill: 'Complétez une grille de range vide avec les bonnes actions pour chaque main.',
  guess: 'Déterminez si des mains font partie d\'une range donnée.',
  complete: 'Complétez une range partiellement remplie.',
};

const TrainingModeSelector: React.FC<TrainingModeSelectorProps> = ({
  selectedMode,
  onModeChange,
  disabled = false,
}) => {
  const handleModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newMode: TrainingMode | null
  ) => {
    if (newMode !== null) {
      onModeChange(newMode);
    }
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        Mode d'entraînement
      </Typography>
      
      <ToggleButtonGroup
        value={selectedMode}
        exclusive
        onChange={handleModeChange}
        disabled={disabled}
        sx={{ mb: 2 }}
      >
        {TRAINING_MODES.map((mode) => (
          <ToggleButton
            key={mode.value}
            value={mode.value}
            disabled={disabled}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
              p: 1.5,
              minWidth: 120,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {modeIcons[mode.value as TrainingMode]}
              <Typography variant="body2" fontWeight="bold">
                {mode.label}
              </Typography>
            </Box>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {/* Description du mode sélectionné */}
      <Tooltip title={modeDescriptions[selectedMode]} arrow>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            backgroundColor: 'background.paper',
            borderLeft: `4px solid ${selectedMode === 'fill' ? '#4CAF50' : selectedMode === 'guess' ? '#2196F3' : '#FF9800'}`,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {modeDescriptions[selectedMode]}
          </Typography>
        </Paper>
      </Tooltip>
    </Paper>
  );
};

export default TrainingModeSelector;
