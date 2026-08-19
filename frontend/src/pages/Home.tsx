import React, { useState } from 'react';
import { Box, Typography, Grid, Container, Skeleton, Chip, Stack, Button } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useNavigate } from 'react-router-dom';
import { AppCard, DonationDialog } from '../components';
import { useStats } from '../hooks';
import { useAuthContext } from '../auth/AuthContext';
import { APP_ENTRIES, moduleRoute, type AppEntry } from '../app/theme';
import { THEME_COLORS } from '../utils/constants';

/**
 * Home hub — the application landing screen.
 *
 * Presents a set of "vignettes" (cards), each opening a dedicated sub-app:
 * Le Ranger, Le Simulateur, Statistiques, etc. Designed as a fluid, modern
 * dashboard rather than a flat feature list.
 */
const Home: React.FC = () => {
  const navigate = useNavigate();
  const { globalStats, loading } = useStats();
  const { isAuthenticated, user } = useAuthContext();
  const [donationOpen, setDonationOpen] = useState(false);

  const handleSelect = (entry: AppEntry) => {
    const route = moduleRoute(entry.slug);
    if (route) navigate(route);
  };

  const handleDonationOpen = () => setDonationOpen(true);
  const handleDonationClose = () => setDonationOpen(false);

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
      {/* Hero */}
      <Box
        sx={{
          position: 'relative',
          mb: 5,
          overflow: 'hidden',
          borderRadius: 4,
          border: `1px solid ${THEME_COLORS.border}`,
          background:
            'radial-gradient(700px 320px at 85% -20%, rgba(34,211,238,0.16), transparent 60%),' +
            'radial-gradient(520px 280px at 5% 10%, rgba(16,185,129,0.18), transparent 60%),' +
            'linear-gradient(180deg, rgba(18,24,33,0.9), rgba(11,15,20,0.9))',
          px: { xs: 3, md: 6 },
          py: { xs: 4, md: 6 },
        }}
      >
        <Chip
          icon={<AutoAwesomeIcon sx={{ fontSize: 16 }} />}
          label="Suite poker · tout-en-un"
          size="small"
          sx={{
            mb: 2,
            color: THEME_COLORS.primaryLight,
            backgroundColor: 'rgba(16,185,129,0.12)',
            border: `1px solid ${THEME_COLORS.primary}33`,
            fontWeight: 600,
          }}
        />
        <Typography
          variant="h3"
          component="h1"
          sx={{ fontWeight: 800, maxWidth: 760, lineHeight: 1.1 }}
        >
          Choisissez votre module et entrez dans la partie.
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ mt: 1.5, maxWidth: 680, fontWeight: 400 }}
        >
          {isAuthenticated
            ? `Bonjour ${user?.username}, reprenez là où vous vous êtes arrêté.`
            : 'Construisez vos ranges, entraînez-vous et suivez vos progrès — chaque outil dans son espace dédié.'}
        </Typography>

        {/* Quick stat strip */}
        <Stack
          direction="row"
          spacing={{ xs: 2, md: 4 }}
          sx={{ mt: 4, flexWrap: 'wrap', rowGap: 2 }}
        >
          <StatPill
            label="Ranges"
            value={loading || !globalStats ? null : globalStats.total_ranges}
          />
          <StatPill
            label="Sessions"
            value={loading || !globalStats ? null : globalStats.total_sessions}
          />
          <StatPill
            label="Précision moy."
            value={loading || !globalStats ? null : `${Math.round(globalStats.avg_score || 0)}%`}
          />
          <StatPill
            label="Utilisateurs"
            value={loading || !globalStats ? null : globalStats.total_users}
          />
        </Stack>
      </Box>

      {/* Vignettes grid */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Modules
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ display: { xs: 'none', sm: 'block' } }}
        >
          Sélectionnez un outil pour y accéder
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {APP_ENTRIES.map((entry) => (
          <Grid item xs={12} sm={6} md={4} key={entry.slug}>
            <AppCard entry={entry} onSelect={handleSelect} />
          </Grid>
        ))}
      </Grid>

      {/* Footer hint */}
      <Box
        sx={{
          mt: 5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          color: THEME_COLORS.textMuted,
        }}
      >
        <Typography variant="body2">D'autres modules poker arrivent bientôt.</Typography>
        <ArrowForwardIcon sx={{ fontSize: 16 }} />
      </Box>

      {/* Donation button */}
      <Box
        sx={{
          mt: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Button
          variant="outlined"
          startIcon={<FavoriteIcon />}
          onClick={handleDonationOpen}
          sx={{
            borderColor: THEME_COLORS.borderStrong,
            color: THEME_COLORS.textSecondary,
            '&:hover': {
              borderColor: THEME_COLORS.primary,
              backgroundColor: 'rgba(16,185,129,0.08)',
              color: THEME_COLORS.primaryLight,
            },
          }}
        >
          Faire un don au développeur
        </Button>
      </Box>

      {/* Donation Dialog */}
      <DonationDialog open={donationOpen} onClose={handleDonationClose} />
    </Container>
  );
};

/** A single glassy stat pill for the hero strip. */
const StatPill: React.FC<{ label: string; value: string | number | null }> = ({ label, value }) => (
  <Box
    sx={{
      minWidth: 96,
      px: 2,
      py: 1.25,
      borderRadius: 3,
      border: `1px solid ${THEME_COLORS.border}`,
      background: 'rgba(15,21,30,0.6)',
      backdropFilter: 'blur(6px)',
    }}
  >
    <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1, display: 'block' }}>
      {label}
    </Typography>
    {value === null ? (
      <Skeleton variant="text" width={48} height={26} />
    ) : (
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        {value}
      </Typography>
    )}
  </Box>
);

export default Home;
