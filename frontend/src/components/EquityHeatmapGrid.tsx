/**
 * Equity heatmap grid: a 13x13 grid colored by the hero's equity against each
 * opposing hand. Cells not in the range are left dim.
 *
 * Reuses generateHandGrid() from types so the layout matches RangeGrid exactly.
 */
import React from 'react';
import { Box, Paper, Tooltip } from '@mui/material';
import { EquityByHand } from '../types';
import { RANKS } from '../utils/constants';
import { generateHandGrid } from '../utils/helpers';

interface EquityHeatmapGridProps {
  byHand: EquityByHand[];
  cellSize?: number;
}

// Map an equity percentage (0-100) to a red → yellow → green color.
function equityColor(win: number): string {
  const clamped = Math.max(0, Math.min(100, win)) / 100;
  // Interpolate from red (0) through yellow (50) to green (100).
  let r: number;
  let g: number;
  if (clamped <= 0.5) {
    // red -> yellow
    const t = clamped * 2;
    r = 244;
    g = Math.round(63 + (226 - 63) * t);
  } else {
    // yellow -> green
    const t = (clamped - 0.5) * 2;
    r = Math.round(244 - (244 - 34) * t);
    g = Math.round(226 - (226 - 197) * t);
  }
  const b = Math.round(94 - 94 * clamped);
  return `rgb(${r}, ${g}, ${b})`;
}

const EquityHeatmapGrid: React.FC<EquityHeatmapGridProps> = ({ byHand, cellSize = 40 }) => {
  const grid = generateHandGrid();
  const equityMap = new Map<string, EquityByHand>();
  byHand.forEach((h) => equityMap.set(h.hand, h));

  const getTextColor = (win: number): string => (win > 45 && win < 70 ? '#000000' : '#FFFFFF');

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
      <Box sx={{ position: 'relative', display: 'inline-block' }}>
        {/* Column labels (top) */}
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
              {RANKS[colIndex]}
            </Box>
          ))}
        </Box>

        <Box sx={{ display: 'flex' }}>
          {/* Row labels (left) */}
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {grid.map((_, rowIndex) => (
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
                {RANKS[rowIndex]}
              </Box>
            ))}
          </Box>

          {/* Cells */}
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {grid.map((row, rowIndex) => (
              <Box key={rowIndex} sx={{ display: 'flex' }}>
                {row.map((hand) => {
                  const entry = equityMap.get(hand);
                  const bgColor = entry ? equityColor(entry.win) : 'rgba(148,163,184,0.08)';
                  const textColor = entry ? getTextColor(entry.win) : 'rgba(148,163,184,0.4)';
                  const label = entry
                    ? `${hand} — win ${entry.win.toFixed(1)}% / tie ${entry.tie.toFixed(
                        1,
                      )}% / lose ${entry.lose.toFixed(1)}% (${entry.combos} combos)`
                    : `${hand} (hors range)`;

                  return (
                    <Tooltip key={hand} title={label} arrow>
                      <Paper
                        data-testid={`equity-cell-${hand}`}
                        elevation={0}
                        sx={{
                          width: cellSize,
                          height: cellSize,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: bgColor,
                          border: '1px solid rgba(0, 0, 0, 0.15)',
                          fontSize: 10,
                          fontWeight: 'bold',
                          color: textColor,
                          userSelect: 'none',
                          transition: 'transform 0.15s ease',
                          '&:hover': { transform: 'scale(1.08)', opacity: 0.92 },
                        }}
                      >
                        {hand}
                      </Paper>
                    </Tooltip>
                  );
                })}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default EquityHeatmapGrid;
