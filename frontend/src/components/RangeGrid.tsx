import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Box, Paper, MenuItem, Menu } from '@mui/material';
import { RangeGridCell, ActionType, RANKS } from '../types';
import { ACTION_COLORS, ACTION_LABELS } from '../utils/constants';

interface RangeGridProps {
  grid: RangeGridCell[][];
  onCellClick?: (hand: string, currentAction: ActionType) => void;
  editable?: boolean;
  selectedAction?: ActionType;
  onActionSelect?: (action: ActionType) => void;
  cellSize?: number;
  showLabels?: boolean;
}

// Actions disponibles dans la légende, dans l'ordre d'affichage.
const LEGEND_ACTIONS: ActionType[] = [
  'fold',
  'open',
  'call',
  'raise',
  'all_in',
  'check',
  'undefined',
];

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
  onActionSelect,
  cellSize = 40,
  showLabels = true,
}) => {
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    hand: string;
    currentAction: ActionType;
  } | null>(null);

  // Mode peinture : true tant que le bouton de la souris est enfoncé sur la grille.
  const [isPainting, setIsPainting] = useState(false);
  // Mains déjà peintes pendant le glissé courant, pour éviter de déclencher
  // plusieurs fois onCellClick sur la même cellule.
  const paintedRef = useRef<Set<string>>(new Set());

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, hand: string, currentAction: ActionType) => {
      e.preventDefault();
      setContextMenu({
        mouseX: e.clientX + 2,
        mouseY: e.clientY - 6,
        hand,
        currentAction,
      });
    },
    [],
  );

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleActionSelect = useCallback(
    (action: ActionType, hand: string, _currentAction: ActionType) => {
      if (onCellClick) {
        onCellClick(hand, action);
      }
      handleCloseContextMenu();
    },
    [onCellClick, handleCloseContextMenu],
  );

  // Applique l'action sélectionnée à une cellule, en mode peinture ou clic simple.
  const paintCell = useCallback(
    (hand: string, currentAction: ActionType) => {
      if (!editable || !onCellClick) return;
      // En mode peinture, on peint avec l'action sélectionnée. Si aucune
      // action n'est sélectionnée, on retombe sur l'action courante de la
      // cellule (comportement historique du clic simple).
      const actionToApply = selectedAction ?? currentAction;
      onCellClick(hand, actionToApply);
    },
    [editable, onCellClick, selectedAction],
  );

  const handleCellClick = useCallback(
    (hand: string, currentAction: ActionType) => {
      // Clic simple hors peinture : on applique l'action sélectionnée.
      paintCell(hand, currentAction);
    },
    [paintCell],
  );

  // Démarre le mode peinture au clic enfoncé sur une cellule éditable.
  const handleCellMouseDown = useCallback(
    (e: React.MouseEvent, hand: string, currentAction: ActionType) => {
      if (!editable || e.button !== 0) return;
      // Empêche la sélection de texte pendant le glissé.
      e.preventDefault();
      setIsPainting(true);
      paintedRef.current = new Set([hand]);
      paintCell(hand, currentAction);
    },
    [editable, paintCell],
  );

  // Peint la cellule survolée pendant le glissé.
  const handleCellMouseEnter = useCallback(
    (hand: string, currentAction: ActionType) => {
      if (!isPainting) return;
      if (paintedRef.current.has(hand)) return;
      paintedRef.current.add(hand);
      paintCell(hand, currentAction);
    },
    [isPainting, paintCell],
  );

  // Arrête le mode peinture quand le bouton est relâché, partout dans le
  // document (au cas où la souris quitte la grille).
  useEffect(() => {
    if (!editable) return;
    const handleMouseUp = () => {
      if (isPainting) {
        setIsPainting(false);
        paintedRef.current = new Set();
      }
    };
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [editable, isPainting]);

  // Gérer les labels pour les axes
  const getRowLabel = (rowIndex: number): string => {
    return RANKS[rowIndex];
  };

  const getColLabel = (colIndex: number): string => {
    return RANKS[colIndex];
  };

  // Position pour le menu contextuel
  const menuPosition = contextMenu
    ? {
        top: contextMenu.mouseY,
        left: contextMenu.mouseX,
      }
    : undefined;

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
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
                  // Per-cell comparison border (training feedback). Takes
                  // precedence over the default editable border so wrong cells
                  // stay highlighted even on hover.
                  const statusBorder =
                    cell.status === 'wrong'
                      ? '2px solid'
                      : cell.status === 'correct'
                        ? '2px solid'
                        : editable
                          ? '1px solid rgba(0, 0, 0, 0.2)'
                          : 'none';
                  const statusBorderColor =
                    cell.status === 'wrong'
                      ? 'error.main'
                      : cell.status === 'correct'
                        ? 'success.main'
                        : undefined;

                  return (
                    <Paper
                      key={cell.hand}
                      data-testid={`range-cell-${cell.hand}`}
                      sx={{
                        width: cellSize,
                        height: cellSize,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: bgColor,
                        border: statusBorder,
                        borderColor: statusBorderColor,
                        cursor: editable ? 'pointer' : 'default',
                        fontSize: 10,
                        fontWeight: 'bold',
                        color: textColor,
                        userSelect: 'none',
                        transition: 'all 0.2s ease',
                        '&:hover': editable
                          ? {
                              opacity: 0.8,
                              border: '1px solid rgba(0, 0, 0, 0.4)',
                              transform: 'scale(1.05)',
                            }
                          : {
                              opacity: 0.9,
                            },
                      }}
                      onClick={() => handleCellClick(cell.hand, cell.action as ActionType)}
                      onMouseDown={(e) =>
                        handleCellMouseDown(e, cell.hand, cell.action as ActionType)
                      }
                      onMouseEnter={() =>
                        handleCellMouseEnter(cell.hand, cell.action as ActionType)
                      }
                      onContextMenu={(e) => {
                        if (editable) {
                          handleContextMenu(e, cell.hand, cell.action as ActionType);
                        }
                      }}
                    >
                      {showLabels && cell.hand}
                    </Paper>
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
                onClick={() =>
                  handleActionSelect(
                    action as ActionType,
                    contextMenu.hand,
                    contextMenu.currentAction,
                  )
                }
                sx={{
                  backgroundColor:
                    action === contextMenu.currentAction
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

      {/* Légende cliquable à droite de la grille */}
      {editable && (
        <Box
          data-testid="range-legend"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            minWidth: 130,
          }}
        >
          {LEGEND_ACTIONS.map((action) => {
            const isSelected = selectedAction === action;
            const color = ACTION_COLORS[action] || '#607D8B';
            return (
              <Box
                key={action}
                data-testid={`legend-item-${action}`}
                onClick={() => onActionSelect?.(action)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1,
                  py: 0.5,
                  cursor: onActionSelect ? 'pointer' : 'default',
                  borderRadius: 1,
                  border: isSelected ? '2px solid' : '1px solid rgba(255, 255, 255, 0.12)',
                  borderColor: isSelected ? 'primary.main' : 'transparent',
                  backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                  '&:hover': onActionSelect ? { backgroundColor: 'rgba(255, 255, 255, 0.05)' } : {},
                }}
              >
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    backgroundColor: color,
                    borderRadius: '2px',
                    flexShrink: 0,
                  }}
                />
                <Box component="span" sx={{ fontSize: 12, color: 'text.primary' }}>
                  {ACTION_LABELS[action] || action}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default RangeGrid;
