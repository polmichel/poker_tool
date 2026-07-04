import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Divider,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as ContentCopyIcon,
  ArrowBack as ArrowBackIcon,
  ImportExport as ImportExportIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { RangeGrid, RangeStats } from '../components';
import { useRanges } from '../hooks';
import { Range } from '../types';
import { generateRangeGrid } from '../utils/helpers';

const RangeView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    ranges,
    loading,
    error,
    selectedRange,
    setSelectedRange,
    fetchRange,
    deleteRange,
  } = useRanges();

  const [range, setRange] = useState<Range | null>(null);

  // Charger la range au montage
  useEffect(() => {
    if (id) {
      fetchRange(parseInt(id));
    }
  }, [id, fetchRange]);

  // Mettre à jour la range locale quand selectedRange change
  useEffect(() => {
    if (selectedRange) {
      setRange(selectedRange);
    }
  }, [selectedRange]);

  // Retour à la liste des ranges
  const handleBack = useCallback(() => {
    navigate('/ranges');
  }, [navigate]);

  // Modifier la range
  const handleEdit = useCallback(() => {
    if (range) {
      navigate(`/ranges/${range.id}/edit`);
    }
  }, [range, navigate]);

  // Supprimer la range
  const handleDelete = useCallback(async () => {
    if (!range) return;
    
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la range "${range.name}" ?`)) {
      await deleteRange(range.id!);
      navigate('/ranges');
    }
  }, [range, deleteRange, navigate]);

  // Dupliquer la range
  const handleDuplicate = useCallback(() => {
    if (!range) return;
    
    navigate('/ranges/new', {
      state: {
        duplicateFrom: range,
      },
    });
  }, [range, navigate]);

  // Exporter la range
  const handleExport = useCallback(() => {
    if (range) {
      navigate('/import-export', {
        state: {
          exportRangeId: range.id,
        },
      });
    }
  }, [range, navigate]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Chargement...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!range) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Range non trouvée</Typography>
      </Box>
    );
  }

  // Compter le nombre de mains par action
  const countHandsByAction = () => {
    const counts: Record<string, number> = {};
    for (const action of Object.values(range.hands)) {
      counts[action] = (counts[action] || 0) + 1;
    }
    return counts;
  };

  const actionCounts = countHandsByAction();
  const totalHands = Object.values(actionCounts).reduce((sum, count) => sum + count, 0);

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title="Retour à la liste">
            <IconButton onClick={handleBack}>
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="h4" component="h1">
            {range.name}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Exporter">
            <Button
              variant="outlined"
              startIcon={<ImportExportIcon />}
              onClick={handleExport}
              color="inherit"
              size="small"
            >
              Exporter
            </Button>
          </Tooltip>
          
          <Tooltip title="Dupliquer">
            <Button
              variant="outlined"
              startIcon={<ContentCopyIcon />}
              onClick={handleDuplicate}
              color="inherit"
              size="small"
            >
              Dupliquer
            </Button>
          </Tooltip>
          
          <Tooltip title="Modifier">
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleEdit}
              color="primary"
              size="small"
            >
              Modifier
            </Button>
          </Tooltip>
          
          <Tooltip title="Supprimer">
            <IconButton onClick={handleDelete} color="error">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Informations de base */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" paragraph>
          {range.description}
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Chip label={`Type: ${range.range_type}`} color="primary" variant="outlined" />
          <Chip label={`Position: ${range.position}`} color="secondary" variant="outlined" />
          <Chip label={`Créée: ${new Date(range.created_at || '').toLocaleDateString()}`} 
                color="info" variant="outlined" />
          <Chip label={`Mise à jour: ${new Date(range.updated_at || '').toLocaleDateString()}`} 
                color="success" variant="outlined" />
        </Box>

        {/* Statistiques rapides */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Chip label={`Total: ${totalHands} mains`} color="primary" variant="filled" />
          {Object.entries(actionCounts).map(([action, count]) => (
            <Chip
              key={action}
              label={`${count}`}
              size="small"
              sx={{
                backgroundColor: action === 'undefined' ? 'grey.500' : 'transparent',
                color: action === 'undefined' ? 'white' : 'inherit',
                borderColor: action === 'undefined' ? 'grey.500' : 'inherit',
              }}
            />
          ))}
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Grille de la range */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Grille de la Range
        </Typography>
        <Box sx={{ overflow: 'auto' }}>
          <RangeGrid
            grid={generateRangeGrid(range.hands)}
            editable={false}
            cellSize={40}
          />
        </Box>
      </Paper>

      {/* Statistiques détaillées */}
      <Paper sx={{ p: 2 }}>
        <RangeStats range={range} />
      </Paper>
    </Box>
  );
};

export default RangeView;
