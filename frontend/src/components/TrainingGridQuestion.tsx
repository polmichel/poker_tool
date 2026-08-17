import React, { useState, useMemo, useCallback } from 'react';
import { Box, Paper, Typography, Button, Divider, LinearProgress, Chip } from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import RangeGrid from './RangeGrid';
import { TrainingQuestion as TrainingQuestionType, ActionType, RangeGridCell } from '../types';
import { generateRangeGrid, gridToHands } from '../utils/helpers';
import { ACTION_COLORS } from '../utils/constants';

interface TrainingGridQuestionProps {
  question: TrainingQuestionType;
  onAnswer: (answer: string) => void;
  onNext: () => void;
  feedback?: { isCorrect: boolean; correctAnswer: string | null; sessionComplete: boolean } | null;
}

// Build an empty grid (all cells "fold") for the user to paint.
function buildEmptyGrid(): RangeGridCell[][] {
  return generateRangeGrid({});
}

// Parse the reference grid stored as JSON in the question's correct_answer.
function parseReferenceGrid(correctAnswer: string | null): RangeGridCell[][] {
  if (!correctAnswer) return buildEmptyGrid();
  try {
    const hands = JSON.parse(correctAnswer) as Record<string, string>;
    // generateRangeGrid expects Record<string, ActionType>; cast safely.
    return generateRangeGrid(hands as Record<string, ActionType>);
  } catch {
    return buildEmptyGrid();
  }
}

// Merge the painted grid against the reference, marking each cell correct/wrong.
function buildDiffGrid(
  painted: RangeGridCell[][],
  reference: RangeGridCell[][],
): { grid: RangeGridCell[][]; correctCells: number } {
  let correctCells = 0;
  const grid = painted.map((row, i) =>
    row.map((cell, j) => {
      const ref = reference[i]?.[j];
      const isCorrect = (ref?.action || 'fold') === (cell.action || 'fold');
      if (isCorrect) correctCells += 1;
      return { ...cell, color: cell.color };
    }),
  );
  return { grid, correctCells };
}

const TrainingGridQuestion: React.FC<TrainingGridQuestionProps> = ({
  question,
  onAnswer,
  onNext,
  feedback,
}) => {
  const [grid, setGrid] = useState<RangeGridCell[][]>(buildEmptyGrid);
  const [selectedAction, setSelectedAction] = useState<ActionType>('open');

  const referenceGrid = useMemo(
    () => parseReferenceGrid(feedback?.correctAnswer ?? question.correct_answer),
    [feedback, question.correct_answer],
  );

  const handleCellClick = useCallback(
    (hand: string, _currentAction: ActionType) => {
      if (feedback) return; // Locked after validation
      setGrid((prev) =>
        prev.map((row) =>
          row.map((cell) =>
            cell.hand === hand
              ? {
                  ...cell,
                  action: selectedAction,
                  color: ACTION_COLORS[selectedAction] || '#FFFFFF',
                }
              : cell,
          ),
        ),
      );
    },
    [feedback, selectedAction],
  );

  const handleActionSelect = useCallback((action: ActionType) => {
    setSelectedAction(action);
  }, []);

  const handleValidate = useCallback(() => {
    if (feedback) return;
    const hands = gridToHands(grid);
    // Cells left as "undefined"/default are treated as "fold" by the backend.
    const payload: Record<string, ActionType> = {};
    for (const [hand, action] of Object.entries(hands)) {
      payload[hand] = action === 'undefined' ? 'fold' : action;
    }
    onAnswer(JSON.stringify(payload));
  }, [feedback, grid, onAnswer]);

  const isAnswered = !!feedback;
  const diff = useMemo(
    () => (isAnswered ? buildDiffGrid(grid, referenceGrid) : null),
    [isAnswered, grid, referenceGrid],
  );
  const totalCells = 169;
  const correctCells = diff?.correctCells ?? 0;
  const progressPercent = Math.round((correctCells / totalCells) * 100);

  return (
    <Paper sx={{ p: 3, maxWidth: 900, margin: 'auto' }} data-testid="grid-question-paper">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          {question.question}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sélectionnez une action dans la légende, puis coloriez la grille (clic ou glissé). Validez
          quand vous avez terminé.
        </Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      <RangeGrid
        grid={isAnswered && diff ? diff.grid : grid}
        editable={!isAnswered}
        selectedAction={selectedAction}
        onActionSelect={handleActionSelect}
        onCellClick={handleCellClick}
        cellSize={34}
      />

      {!isAnswered && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleValidate}
            data-testid="validate-grid-button"
          >
            Valider la range
          </Button>
        </Box>
      )}

      {feedback && (
        <Box
          data-testid="feedback-panel"
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 2,
            backgroundColor: feedback.isCorrect ? 'success.dark' : 'error.dark',
            color: 'white',
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              mb: 1,
            }}
          >
            {feedback.isCorrect ? <CheckCircle /> : <Cancel />}
            <Typography variant="h6">{progressPercent}% de cellules correctes</Typography>
          </Box>
          <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
            {correctCells} / {totalCells} cellules correspondent à la range de référence.
          </Typography>
          <Box sx={{ mb: 2, px: 2 }}>
            <LinearProgress
              variant="determinate"
              value={progressPercent}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
          <Chip
            label="Grille de référence affichée ci-dessus"
            color="default"
            sx={{ mb: 2, backgroundColor: 'rgba(255,255,255,0.15)', color: 'white' }}
          />
          <Box>
            <Button
              variant="contained"
              onClick={onNext}
              sx={{
                backgroundColor: 'white',
                color: feedback.isCorrect ? 'success.dark' : 'error.dark',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' },
              }}
              data-testid="next-question-button"
            >
              {feedback.sessionComplete ? 'Voir les résultats' : 'Terminer'}
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default TrainingGridQuestion;
