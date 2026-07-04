import React, { useState, useEffect, useCallback } from 'react';
import { Box, Paper, Tooltip, MenuItem, Menu, IconButton } from '@mui/material';
import { RangeGridCell, ActionType, RANKS } from '../types';
import { ACTION_COLORS, ACTION_LABELS } from '../utils/constants';
import { getActionLabel } from '../utils/helpers';

interface RangeGridProps {
  grid: RangeGridCell[][];
  onCellClick?: (hand: string, currentAction: ActionType) => void;
  editable?: boolean;
  selectedAction?: ActionType;
  cellSize?: number;
  showLabels?: boolean;
}

const RangeGrid: React.FC<RangeGridProps> = ({
  grid,
  onCellClick,
  editable = false,
  selectedAction,
  cellSize = 40,
  showLabels = true,
}) => {
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    hand: string;
    currentAction: ActionType;
  } | null>(null);

  const handleContextMenu = useCallback((
    e: React.MouseEvent,
    hand: string,
    currentAction: ActionType
  ) => {
    e.preventDefault();
    setContextMenu({
      mouseX: e.clientX + 2,
      mouseY: e.clientY - 6,
      hand,
      currentAction,
    });
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleActionSelect = useCallback((
    action: ActionType,
    hand: string,
    currentAction: ActionType
  ) => {
    if (onCellClick) {
      onCellClick(hand, currentAction);
    }
    handleCloseContextMenu();
  }, [onCellClick, handleCloseContextMenu]);

  const handleCellClick = useCallback((
    hand: string,
    currentAction: ActionType
  ) => {
    if (editable && onCellClick) {
      onCellClick(hand, currentAction);
    }
  }, [editable, onCellClick]);

  // Générer les labels pour les axes
  const getRowLabel = (rowIndex: number): string => {
    return RANKS[rowIndex];
  };

  const getColLabel = (colIndex: number): string => {
    return RANKS[colIndex];
  };

  return (
    <Box sx={{ position: 'relative', display: 'inline-block' }}>
      {/* Labels des colonnes (en haut) */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5 }}>
        {grid[0]?.map((_, colIndex) => (
          <Box
            key={colIndex}
            sx={{
              width: cellSize,
              height: cellSize / 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 'bold',
              color: 'text.secondary',
            }}
          >
            {getColLabel(colIndex)}
          </Box>
        ))}
      </Box>

      {/* Grille */}
      <Box sx={{ display: 'flex' }}>
        {/* Labels des lignes (à gauche) */}
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {grid.map((row, rowIndex) => (
            <Box
              key={rowIndex}
              sx={{
                width: cellSize / 2,
                height: cellSize,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 'bold',
                color: 'text.secondary',
              }}
            >
              {getRowLabel(rowIndex)}
            </Box>
          ))}
        </Box>

        {/* Cellules de la grille */}
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {grid.map((row, rowIndex) => (
            <Box key={rowIndex} sx={{ display: 'flex' }}>
              {row.map((cell) => (
                <Tooltip
                  key={cell.hand}
                  title={`Main: ${cell.hand} | Action: ${getActionLabel(cell.action as ActionType)}`}
                  arrow
                  placement="top"
                >
                  <Paper
                    sx={{
                      width: cellSize,
                      height: cellSize,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: cell.color || ACTION_COLORS.undefined,
                      border: editable ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                      cursor: editable ? 'pointer' : 'default',
                      fontSize: 10,
                      fontWeight: 'bold',
                      color: cell.action === 'undefined' ? 'text.disabled' : 'text.primary',
                      '&:hover': editable ? {
                        opacity: 0.8,
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                      } : {},
                    }}
                    onClick={() => handleCellClick(cell.hand, cell.action as ActionType)}
                    onContextMenu={(e) => {
                      if (editable) {
                        handleContextMenu(e, cell.hand, cell.action as ActionType);
                      }
                    }}
                  >
                    {showLabels && cell.hand}
                  </Paper>
                </Tooltip>
              ))}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Menu contextuel pour sélectionner une action */}
      {editable && contextMenu && (
        <Menu
          open={!!contextMenu}
          onClose={handleCloseContextMenu}
          anchorReference="anchorPosition"
          anchorPosition={
            top: contextMenu.mouseY,
            left: contextMenu.mouseX,
          }
          PaperProps={{
            style: {
              maxHeight: 300,
              width: 200,
            },
          }}
        >
          {Object.entries(ACTION_LABELS).map(([action, label]) => (
            <MenuItem
              key={action}
              onClick={() => handleActionSelect(
                action as ActionType,
                contextMenu.hand,
                contextMenu.currentAction
              )}
              sx={{
                backgroundColor: action === contextMenu.currentAction 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'transparent',
              }}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  backgroundColor: ACTION_COLORS[action as ActionType] || '#FFFFFF',
                  mr: 1,
                  borderRadius: '2px',
                }}
              />
              {label}
            </MenuItem>
          ))}
        </Menu>
      )}
    </Box>
  );
};

export default RangeGrid;
