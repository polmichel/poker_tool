/**
 * TrainingRangeSelector - Range selection component for training
 *
 * Displays available ranges as chips for selection
 * Shows empty state with link to create a range
 *
 * @component
 */
import React from 'react';
import { Box, Button, Chip, Paper, Typography } from '@mui/material';
import { Range } from '../../types';

export interface TrainingRangeSelectorProps {
  ranges: Range[];
  selectedRange: Range | null;
  onRangeSelect: (range: Range) => void;
  disabled?: boolean;
  onCreateRange?: () => void;
}

/**
 * Training range selector component
 */
export const TrainingRangeSelector: React.FC<TrainingRangeSelectorProps> = ({
  ranges,
  selectedRange,
  onRangeSelect,
  disabled = false,
  onCreateRange,
}) => {
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        Selectionner une Range
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {ranges.map((range) => (
          <Chip
            key={range.id}
            label={range.name}
            onClick={() => !disabled && onRangeSelect(range)}
            color={selectedRange?.id === range.id ? 'primary' : 'default'}
            variant={selectedRange?.id === range.id ? 'filled' : 'outlined'}
            clickable
            disabled={disabled}
          />
        ))}
      </Box>

      {ranges.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Aucune range disponible.{' '}
          <Button onClick={onCreateRange || (() => {})} color="primary">
            Creer une range
          </Button>
        </Typography>
      )}
    </Paper>
  );
};
