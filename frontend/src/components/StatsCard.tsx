import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Timer as TimerIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { Stats } from '../types';
import { formatPercentage, formatTime } from '../utils/helpers';

interface StatsCardProps {
  title: string;
  stats: Partial<Stats>;
  icon?: React.ReactNode;
  color?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  stats,
  icon,
  color = '#4CAF50',
}) => {
  return (
    <Paper
      sx={{
        p: 2,
        minWidth: 250,
        borderLeft: `4px solid ${color}`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        {icon || <TrendingUpIcon color="primary" />}
        <Typography variant="subtitle1" fontWeight="bold">
          {title}
        </Typography>
      </Box>

      <Divider sx={{ my: 1 }} />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {stats.total_ranges !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip label="Ranges" size="small" color="primary" />
            <Typography variant="body2">{stats.total_ranges}</Typography>
          </Box>
        )}

        {stats.total_training_sessions !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip label="Sessions" size="small" color="secondary" />
            <Typography variant="body2">{stats.total_training_sessions}</Typography>
          </Box>
        )}

        {stats.avg_score !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon color="success" fontSize="small" />
            <Typography variant="body2">
              Précision: {formatPercentage(stats.avg_score)}
            </Typography>
          </Box>
        )}

        {stats.total_time_spent !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimerIcon color="action" fontSize="small" />
            <Typography variant="body2">
              Temps: {formatTime(stats.total_time_spent)}
            </Typography>
          </Box>
        )}

        {stats.avg_score !== undefined && (
          <Box sx={{ mt: 1 }}>
            <LinearProgress
              variant="determinate"
              value={stats.avg_score}
              sx={{
                height: 8,
                borderRadius: 4,
              }}
            />
            <Typography variant="caption" color="text.secondary">
              Score moyen
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default StatsCard;
