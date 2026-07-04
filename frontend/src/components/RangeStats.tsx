import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Range, ActionType } from '../types';
import { ACTION_COLORS, ACTION_LABELS } from '../utils/constants';
import { calculateRangeStats } from '../utils/helpers';

interface RangeStatsProps {
  range: Range;
}

const RangeStats: React.FC<RangeStatsProps> = ({ range }) => {
  const stats = calculateRangeStats(range.hands);

  // Préparer les données pour le graphique
  const pieData = Object.entries(stats.byAction)
    .filter(([action]) => action !== 'undefined')
    .map(([action, count]) => ({
      name: ACTION_LABELS[action as ActionType] || action,
      value: count,
      action,
    }));

  // Couleurs pour le graphique
  const COLORS = Object.values(ACTION_COLORS).filter(
    (color) => color !== '#FFFFFF'
  );

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Statistiques de la Range
      </Typography>

      <Divider sx={{ my: 2 }} />

      {/* Résumé */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Chip
          label={`Total: ${stats.total} mains`}
          color="primary"
          variant="outlined"
        />
        <Chip
          label={`Couverture: ${formatPercentage(stats.percentage)}`}
          color="secondary"
          variant="outlined"
        />
        <Chip
          label={`Type: ${range.range_type}`}
          color="info"
          variant="outlined"
        />
        <Chip
          label={`Position: ${range.position}`}
          color="success"
          variant="outlined"
        />
      </Box>

      {/* Graphique en secteurs */}
      <Box sx={{ mb: 3, height: 300 }}>
        <Typography variant="subtitle2" gutterBottom>
          Répartition par action
        </Typography>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {pieData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <RechartsTooltip
              formatter={(value: number, name: string, props: any) => [
                `${props.payload.name}: ${value} mains`,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </Box>

      {/* Tableau détaillé */}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Action</TableCell>
              <TableCell align="right">Nombre de mains</TableCell>
              <TableCell align="right">Pourcentage</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(stats.byAction)
              .filter(([action]) => action !== 'undefined')
              .map(([action, count]) => (
                <TableRow key={action}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          backgroundColor: ACTION_COLORS[action as ActionType],
                          borderRadius: '2px',
                        }}
                      />
                      {ACTION_LABELS[action as ActionType] || action}
                    </Box>
                  </TableCell>
                  <TableCell align="right">{count}</TableCell>
                  <TableCell align="right">
                    {formatPercentage(count / stats.total)}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

// Fonction utilitaire pour formater un pourcentage
function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export default RangeStats;
