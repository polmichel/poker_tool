import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Divider,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  List as ListIcon,
  School as SchoolIcon,
  BarChart as BarChartIcon,
  ImportExport as ImportExportIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { StatsCard } from '../components';
import { useStats } from '../hooks';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { globalStats, loading, error } = useStats();

  const featureCards = [
    {
      title: 'Créer une Range',
      description: 'Créez et personnalisez vos propres ranges de poker pour différentes positions et scénarios.',
      icon: <AddIcon fontSize="large" color="primary" />,
      path: '/ranges/new',
      color: '#4CAF50',
    },
    {
      title: 'Mes Ranges',
      description: 'Consultez, modifiez ou supprimez vos ranges existantes.',
      icon: <ListIcon fontSize="large" color="secondary" />,
      path: '/ranges',
      color: '#2196F3',
    },
    {
      title: "S'entraîner",
      description: 'Entraînez-vous à reconnaître et compléter vos ranges avec différents modes.',
      icon: <SchoolIcon fontSize="large" color="warning" />,
      path: '/training',
      color: '#FF9800',
    },
    {
      title: 'Statistiques',
      description: 'Suivez vos progrès et analysez vos performances.',
      icon: <BarChartIcon fontSize="large" color="info" />,
      path: '/stats',
      color: '#00BCD4',
    },
    {
      title: 'Importer/Exporter',
      description: 'Importez ou exportez vos ranges dans différents formats.',
      icon: <ImportExportIcon fontSize="large" color="success" />,
      path: '/import-export',
      color: '#8BC34A',
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Poker Tool
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Outil complet de gestion et d'entraînement aux ranges poker
        </Typography>
      </Box>

      {/* Statistiques globales */}
      {loading ? (
        <Typography>Chargement des statistiques...</Typography>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : globalStats ? (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Statistiques Globales
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Ranges"
                stats={{ total_ranges: globalStats.total_ranges }}
                icon={<ListIcon color="primary" />}
                color="#4CAF50"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Sessions"
                stats={{ total_training_sessions: globalStats.total_training_sessions }}
                icon={<SchoolIcon color="secondary" />}
                color="#2196F3"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Score Moyen"
                stats={{ avg_score: globalStats.avg_score }}
                icon={<BarChartIcon color="info" />}
                color="#FF9800"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Temps Total"
                stats={{ total_time_spent: globalStats.total_time_spent }}
                icon={<ImportExportIcon color="success" />}
                color="#8BC34A"
              />
            </Grid>
          </Grid>
        </Box>
      ) : null}

      <Divider sx={{ my: 4 }} />

      {/* Cartes des fonctionnalités */}
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Fonctionnalités
      </Typography>
      
      <Grid container spacing={3}>
        {featureCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2.4} key={index}>
            <Paper
              sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                borderLeft: `4px solid ${card.color}`,
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                },
              }}
              onClick={() => navigate(card.path)}
            >
              <Box sx={{ mb: 2 }}>{card.icon}</Box>
              <Typography variant="h6" gutterBottom>
                {card.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                {card.description}
              </Typography>
              <Button
                variant="text"
                color="primary"
                size="small"
                sx={{ mt: 1, alignSelf: 'flex-start' }}
              >
                Accéder
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Section d'aide */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Besoin d'aide ?
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Consultez la documentation ou contactez le support pour toute question.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Home;
