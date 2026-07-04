import React, { useState, useEffect, useCallback } from 'react';
import { Box, Paper, Tooltip, MenuItem, Menu } from '@mui/material';
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

// Fonction pour déterminer la couleur du texte en fonction de la couleur de fond
const getTextColor = (bgColor: string): string => {
  // Convertir le code hex en RGB
  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };
  
  // Calculer la luminosité (formule standard)
  const getBrightness = (r: number, g: number, b: number) => {
    return (r * 299 + g * 587 + b * 114) / 1000;
  };
  
  try {
    const { r, g, b } = hexToRgb(bgColor);
    const brightness = getBrightness(r, g, b);
    // Si la couleur est claire, utiliser du texte noir, sinon du texte blanc
    return brightness > 130 ? '#000000' : '#FFFFFF';
  } catch {
    // Par défaut, texte noir
    return '#000000';
  }
};

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
      onCellClick(hand, action);
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

  // Position pour le menu contextuel
  const menuPosition = contextMenu ? {
    top: contextMenu.mouseY,
    left: contextMenu.mouseX,
  } : undefined;

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
              {row.map((cell) => {
                // Déterminer la couleur du texte en fonction de la couleur de fond
                const bgColor = cell.color || ACTION_COLORS['undefined'];
                const textColor = getTextColor(bgColor);
                
                return (
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
                        backgroundColor: bgColor,
                        border: editable ? '1px solid rgba(0, 0, 0, 0.2)' : 'none',
                        cursor: editable ? 'pointer' : 'default',
                        fontSize: 10,
                        fontWeight: 'bold',
                        color: textColor,
                        transition: 'all 0.2s ease',
                        '&:hover': editable ? {
                          opacity: 0.8,
                          border: '1px solid rgba(0, 0, 0, 0.4)',
                          transform: 'scale(1.05)',
                        } : {
                          opacity: 0.9,
                        },
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
                );
              })}
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
          anchorPosition={menuPosition}
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
                  backgroundColor: ACTION_COLORS[action as ActionType] || '#607D8B',
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
