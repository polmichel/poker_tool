import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, Button, Divider, IconButton, Tooltip, Chip } from '@mui/material';
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { RangeGrid, RangeStats } from '../components';
import { useRanges } from '../hooks';
import { Range, ActionType } from '../types';
import { generateRangeGrid, gridToHands } from '../utils/helpers';
import { ACTION_COLORS, ACTION_LABELS } from '../utils/constants';

const RangeEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // autoFetch=false : on n'a pas besoin de charger la liste de toutes les
  // ranges dans l'éditeur. Cela évite que loading passe à true au montage
  // et masque la range ciblée (ce qui causait le bug « Range non trouvée »).
  const { loading, error, selectedRange, setSelectedRange, fetchRange, updateRange, deleteRange } =
    useRanges(undefined, false);

  const [range, setRange] = useState<Range | null>(null);
  const [grid, setGrid] = useState<any[][]>([]);
  const [history, setHistory] = useState<any[][][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  // Indique si on a tenté de charger la range (fetchRange appelé au moins une
  // fois). Sert à ne pas afficher « Range non trouvée » pendant le tout premier
  // rendu, avant même que le fetch n'ait commencé.
  const [fetchAttempted, setFetchAttempted] = useState<boolean>(false);
  // Action actuellement sélectionnée dans la légende, appliquée au clic/glissé
  // sur la grille. Par défaut 'open'.
  const [selectedAction, setSelectedAction] = useState<ActionType>('open');

  // Charger la range au montage
  useEffect(() => {
    if (id) {
      setFetchAttempted(true);
      fetchRange(parseInt(id));
    }
  }, [id, fetchRange]);

  // Mettre à jour la range locale quand selectedRange change
  useEffect(() => {
    if (selectedRange) {
      setRange(selectedRange);
      setGrid(generateRangeGrid(selectedRange.hands));
      setHistory([generateRangeGrid(selectedRange.hands)]);
      setHistoryIndex(0);
    }
  }, [selectedRange]);

  // Gérer le clic/glissé sur une cellule de la grille : applique directement
  // l'action sélectionnée dans la légende (au lieu de cycler les actions).
  const handleCellClick = useCallback(
    (hand: string, _currentAction: ActionType) => {
      // Trouver la position de la main dans la grille
      const newGrid = grid.map((row) => row.map((cell: any) => ({ ...cell })));
      let found = false;

      for (let i = 0; i < newGrid.length && !found; i++) {
        for (let j = 0; j < newGrid[i].length; j++) {
          if (newGrid[i][j].hand === hand) {
            const newAction = selectedAction;
            newGrid[i][j].action = newAction;
            // ✅ FIX: Mettre à jour la couleur avec ACTION_COLORS
            newGrid[i][j].color = ACTION_COLORS[newAction] || '#FFFFFF';
            found = true;
            break;
          }
        }
      }

      if (found) {
        // Sauvegarder dans l'historique
        const newHistory = [...history.slice(0, historyIndex + 1), newGrid];
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setGrid(newGrid);
      }
    },
    [grid, history, historyIndex, selectedAction],
  );

  // Annuler la dernière modification
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setGrid(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  // Rétablir la dernière modification
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setGrid(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  // Sauvegarder la range
  const handleSave = useCallback(async () => {
    if (!range || !id) return;

    const hands = gridToHands(grid);
    const updatedRange = range.id ? await updateRange(range.id, { hands }) : null;

    if (updatedRange) {
      setRange(updatedRange);
      setSelectedRange(updatedRange);
      // Réinitialiser l'historique
      setHistory([generateRangeGrid(updatedRange.hands)]);
      setHistoryIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, id, grid, updateRange]);

  // Supprimer la range
  const handleDelete = useCallback(async () => {
    if (!range || !id) return;

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la range "${range.name}" ?`)) {
      if (range.id) await deleteRange(range.id);
      navigate('/ranges');
    }
  }, [range, id, deleteRange, navigate]);

  // Dupliquer la range
  const handleDuplicate = useCallback(() => {
    if (!range) return;

    navigate('/ranges/new', {
      state: {
        duplicateFrom: range,
      },
    });
  }, [range, navigate]);

  // Compter le nombre de mains par action
  const countHandsByAction = useCallback(() => {
    const counts: Record<string, number> = {};
    for (const row of grid) {
      for (const cell of row) {
        if (cell.action !== 'undefined') {
          counts[cell.action] = (counts[cell.action] || 0) + 1;
        }
      }
    }
    return counts;
  }, [grid]);

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

  // N'afficher « Range non trouvée » que si on a réellement tenté de charger
  // la range (id présent + fetch tenté) et qu'elle n'est toujours pas là.
  if (!range && fetchAttempted && id) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Range non trouvée</Typography>
      </Box>
    );
  }

  if (!range) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Chargement...</Typography>
      </Box>
    );
  }

  const actionCounts = countHandsByAction();
  const totalHands = Object.values(actionCounts).reduce((sum, count) => sum + count, 0);

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1">
            {range.name}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {range.description}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Annuler">
            <Button
              variant="outlined"
              startIcon={<UndoIcon />}
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              size="small"
            >
              Annuler
            </Button>
          </Tooltip>

          <Tooltip title="Rétablir">
            <Button
              variant="outlined"
              startIcon={<RedoIcon />}
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              size="small"
            >
              Rétablir
            </Button>
          </Tooltip>

          <Tooltip title="Sauvegarder">
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              color="primary"
              size="small"
            >
              Sauvegarder
            </Button>
          </Tooltip>

          <Tooltip title="Dupliquer">
            <IconButton onClick={handleDuplicate}>
              <ContentCopyIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Supprimer">
            <IconButton onClick={handleDelete} color="error">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Statistiques rapides */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
        <Chip label={`Total: ${totalHands} mains`} color="primary" variant="outlined" />
        {Object.entries(actionCounts).map(([action, count]) => (
          <Chip
            key={action}
            label={`${ACTION_LABELS[action] || action}: ${count}`}
            size="small"
            sx={{
              backgroundColor: ACTION_COLORS[action as ActionType] || 'grey.500',
              color:
                action === 'open' || action === 'raise' || action === 'all_in' ? 'white' : 'black',
            }}
          />
        ))}
      </Box>

      {/* Grille de la range */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Grille de la Range
        </Typography>
        <Box sx={{ overflow: 'auto' }}>
          <RangeGrid
            grid={grid}
            onCellClick={handleCellClick}
            editable={true}
            cellSize={40}
            selectedAction={selectedAction}
            onActionSelect={setSelectedAction}
          />
        </Box>
      </Paper>

      {/* Statistiques détaillées */}
      <Paper sx={{ p: 2 }}>
        <RangeStats range={{ ...range, hands: gridToHands(grid) }} />
      </Paper>
    </Box>
  );
};

export default RangeEditor;
