import React from 'react';
import { Box, Card, CardActionArea, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { getIcon } from '../app/icons';
import type { AppEntry } from '../app/theme';
import { THEME_COLORS } from '../utils/constants';

interface AppCardProps {
  entry: AppEntry;
  onSelect: (entry: AppEntry) => void;
}

/**
 * A single hub vignette: glassy card with an accent glow, an icon badge,
 * title, tagline and description. Disables interaction for "soon" modules.
 */
const AppCard: React.FC<AppCardProps> = ({ entry, onSelect }) => {
  const Icon = getIcon(entry.icon);
  const disabled = !!entry.soon;

  return (
    <Card
      sx={{
        position: 'relative',
        height: '100%',
        overflow: 'hidden',
        borderColor: THEME_COLORS.border,
        transition: 'transform .2s ease, border-color .2s ease, box-shadow .2s ease',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(220px 140px at 12% 0%, ${entry.accent}26, transparent 70%)`,
          opacity: 0.9,
          pointerEvents: 'none',
          transition: 'opacity .2s ease',
        },
        '&:hover': disabled
          ? {}
          : {
              transform: 'translateY(-4px)',
              borderColor: `${entry.accent}66`,
              boxShadow: `0 18px 40px -22px ${entry.accent}aa`,
              '&::before': { opacity: 1 },
            },
      }}
    >
      <CardActionArea
        onClick={() => !disabled && onSelect(entry)}
        disabled={disabled}
        sx={{ height: '100%', p: 3, alignItems: 'flex-start' }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 52,
            height: 52,
            borderRadius: 3,
            mb: 2,
            color: entry.accent,
            background: `linear-gradient(135deg, ${entry.accent}26, ${entry.accent}0d)`,
            border: `1px solid ${entry.accent}40`,
            transition: 'transform .2s ease',
          }}
        >
          <Icon fontSize="large" />
        </Box>

        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          {entry.title}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: entry.accent, fontWeight: 600, letterSpacing: '0.02em' }}
        >
          {entry.tagline}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.6 }}>
          {entry.description}
        </Typography>

        <Box
          sx={{ mt: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          {disabled ? (
            <Box
              component="span"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                height: 22,
                px: 1,
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                color: THEME_COLORS.textSecondary,
                backgroundColor: 'rgba(148,163,184,0.12)',
                border: `1px solid ${THEME_COLORS.border}`,
              }}
            >
              Bientôt
            </Box>
          ) : (
            <Typography
              variant="button"
              sx={{
                color: entry.accent,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                fontWeight: 600,
              }}
            >
              Ouvrir
              <ArrowForwardIcon sx={{ fontSize: 16, transition: 'transform .2s ease' }} />
            </Typography>
          )}
        </Box>
      </CardActionArea>
    </Card>
  );
};

export default AppCard;
