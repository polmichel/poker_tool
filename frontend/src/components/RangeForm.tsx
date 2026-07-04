import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Typography,
  Paper,
  Divider,
  Chip,
  IconButton,
} from '@mui/material';
import { Range, RangeType, Position, ActionType } from '../types';
import { RANGE_TYPES, POSITIONS, ACTION_LABELS } from '../utils/constants';
import { generateUniqueRangeName } from '../utils/helpers';

interface RangeFormProps {
  range?: Range | null;
  onSubmit: (range: Omit<Range, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel?: () => void;
  existingRangeNames?: string[];
}

const RangeForm: React.FC<RangeFormProps> = ({
  range,
  onSubmit,
  onCancel,
  existingRangeNames = [],
}) => {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [rangeType, setRangeType] = useState<RangeType>('preflop');
  const [position, setPosition] = useState<Position>('UTG');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialiser le formulaire avec les valeurs de la range existante
  useEffect(() => {
    if (range) {
      setName(range.name);
      setDescription(range.description || '');
      setRangeType(range.range_type);
      setPosition(range.position);
    } else {
      // Générer un nom unique pour une nouvelle range
      setName(generateUniqueRangeName(existingRangeNames));
      setDescription('');
      setRangeType('preflop');
      setPosition('UTG');
    }
  }, [range, existingRangeNames]);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = 'Le nom est requis';
    }
    
    if (existingRangeNames.includes(name) && (!range || range.name !== name)) {
      newErrors.name = 'Ce nom est déjà utilisé';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, existingRangeNames, range]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      onSubmit({
        name,
        description,
        range_type: rangeType,
        position,
        hands: range?.hands || {},
      });
    }
  }, [name, description, rangeType, position, range, validate, onSubmit]);

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  return (
    <Paper
      sx={{
        p: 3,
        maxWidth: 600,
        margin: 'auto',
      }}
    >
      <Typography variant="h6" gutterBottom>
        {range ? 'Modifier la Range' : 'Nouvelle Range'}
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Nom */}
          <TextField
            label="Nom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            fullWidth
            variant="outlined"
            size="small"
          />

          {/* Description */}
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
            fullWidth
            variant="outlined"
            size="small"
          />

          {/* Type de Range */}
          <FormControl fullWidth size="small">
            <InputLabel>Type de Range</InputLabel>
            <Select
              value={rangeType}
              onChange={(e) => setRangeType(e.target.value as RangeType)}
              label="Type de Range"
            >
              {RANGE_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Position */}
          <FormControl fullWidth size="small">
            <InputLabel>Position</InputLabel>
            <Select
              value={position}
              onChange={(e) => setPosition(e.target.value as Position)}
              label="Position"
            >
              {POSITIONS.map((pos) => (
                <MenuItem key={pos.value} value={pos.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label={pos.value} size="small" />
                    {pos.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Actions disponibles (info) */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Actions disponibles :
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.entries(ACTION_LABELS).map(([action, label]) => (
                <Chip
                  key={action}
                  label={label}
                  size="small"
                  sx={{
                    backgroundColor: action === 'undefined' 
                      ? 'grey.500' 
                      : `${action}.main`,
                    color: action === 'undefined' || action === 'fold' 
                      ? 'text.primary' 
                      : 'white',
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Boutons */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button
              variant="outlined"
              onClick={handleCancel}
              disabled={!onCancel}
            >
              Annuler
            </Button>
            <Button
              variant="contained"
              type="submit"
              color="primary"
              disabled={!!errors.name}
            >
              {range ? 'Mettre à jour' : 'Créer'}
            </Button>
          </Box>
        </Box>
      </form>
    </Paper>
  );
};

export default RangeForm;
