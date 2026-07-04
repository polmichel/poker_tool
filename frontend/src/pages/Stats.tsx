import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Grid,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  Leaderboard as LeaderboardIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useStats } from '../hooks';
import { StatsCard } from '../components';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

const Stats: React.FC = () => {
  const {
    globalStats,
    userStats,
    loading,
    error,
    fetchGlobalStats,
    fetchUserStats,
    fetchTrainingHistory,
    fetchLeaderboard,
    exportStats,
  } = useStats();

  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'leaderboard'>('overview');
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);

  // Charger les données au montage
  useEffect(() => {
    fetchGlobalStats();
    loadHistoryData();
    loadLeaderboardData();
  }, [fetchGlobalStats]);

  // Charger les données de l'historique
  const loadHistoryData = useCallback(async () => {
    const data = await fetchTrainingHistory();
    if (data) {
      setHistoryData(data);
    }
  }, [fetchTrainingHistory]);

  // Charger les données du classement
  const loadLeaderboardData = useCallback(async () => {
    const data = await fetchLeaderboard();
    if (data) {
      setLeaderboardData(data);
    }
  }, [fetchLeaderboard]);

  // Changer d'onglet
  const handleTabChange = useCallback((
    event: React.SyntheticEvent,
    newValue: 'overview' | 'history' | 'leaderboard'
  ) => {
    setActiveTab(newValue);
    
    if (newValue === 'history') {
      loadHistoryData();
    } else if (newValue === 'leaderboard') {
      loadLeaderboardData();
    }
  }, [loadHistoryData, loadLeaderboardData]);

  // Exporter les statistiques
  const handleExportStats = useCallback(async () => {
    const data = await exportStats('json');
    if (data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `poker_tool_stats_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [exportStats]);

  // Préparer les données pour le graphique des scores
  const getScoreChartData = () => {
    if (!historyData || historyData.length === 0) {
      return [];
    }

    // Grouper par date et calculer le score moyen
    const groupedByDate: Record<string, { sum: number; count: number }> = {};
    historyData.forEach((session) => {
      const date = new Date(session.created_at).toLocaleDateString();
      if (!groupedByDate[date]) {
        groupedByDate[date] = { sum: 0, count: 0 };
      }
      groupedByDate[date].sum += session.score;
      groupedByDate[date].count += 1;
    });

    return Object.entries(groupedByDate).map(([date, values]) => ({
      date,
      score: values.sum / values.count,
    }));
  };

  // Préparer les données pour le graphique des sessions
  const getSessionsChartData = () => {
    if (!historyData || historyData.length === 0) {
      return [];
    }

    // Compter le nombre de sessions par jour
    const groupedByDate: Record<string, number> = {};
    historyData.forEach((session) => {
      const date = new Date(session.created_at).toLocaleDateString();
      groupedByDate[date] = (groupedByDate[date] || 0) + 1;
    });

    return Object.entries(groupedByDate).map(([date, count]) => ({
      date,
      sessions: count,
    }));
  };

  // Préparer les données pour le graphique des modes
  const getModesChartData = () => {
    if (!historyData || historyData.length === 0) {
      return [];
    }

    const modeCounts: Record<string, number> = {};
    historyData.forEach((session) => {
      modeCounts[session.mode] = (modeCounts[session.mode] || 0) + 1;
    });

    return Object.entries(modeCounts).map(([mode, count]) => ({
      mode,
      sessions: count,
    }));
  };

  const scoreChartData = getScoreChartData();
  const sessionsChartData = getSessionsChartData();
  const modesChartData = getModesChartData();

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Statistiques
        </Typography>
        
        <Tooltip title="Exporter les statistiques">
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportStats}
            color="inherit"
          >
            Exporter
          </Button>
        </Tooltip>
      </Box>

      {/* Onglets */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab label="Aperçu" value="overview" icon={<BarChartIcon />} iconPosition="start" />
          <Tab label="Historique" value="history" icon={<TimelineIcon />} iconPosition="start" />
          <Tab label="Classement" value="leaderboard" icon={<LeaderboardIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Contenu des onglets */}
      {loading ? (
        <Typography>Chargement des statistiques...</Typography>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <>
          {/* Onglet Aperçu */}
          {activeTab === 'overview' && (
            <Box>
              {/* Statistiques globales */}
              {globalStats && (
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatsCard
                      title="Ranges"
                      stats={{ total_ranges: globalStats.total_ranges }}
                      icon={<BarChartIcon color="primary" />}
                      color="#4CAF50"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatsCard
                      title="Sessions"
                      stats={{ total_training_sessions: globalStats.total_training_sessions }}
                      icon={<TimelineIcon color="secondary" />}
                      color="#2196F3"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatsCard
                      title="Score Moyen"
                      stats={{ avg_score: globalStats.avg_score }}
                      icon={<LeaderboardIcon color="info" />}
                      color="#FF9800"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatsCard
                      title="Temps Total"
                      stats={{ total_time_spent: globalStats.total_time_spent }}
                      icon={<TimelineIcon color="success" />}
                      color="#8BC34A"
                    />
                  </Grid>
                </Grid>
              )}

              <Divider sx={{ my: 4 }} />

              {/* Graphiques */}
              <Grid container spacing={3}>
                {/* Graphique des scores */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, height: '100%' }}>
                    <Typography variant="h6" gutterBottom>
                      Évolution du Score
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={scoreChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 100]} />
                        <RechartsTooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="score"
                          name="Score moyen"
                          stroke="#4CAF50"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>

                {/* Graphique des sessions */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, height: '100%' }}>
                    <Typography variant="h6" gutterBottom>
                      Sessions par Jour
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={sessionsChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="sessions" name="Nombre de sessions" fill="#2196F3" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>

                {/* Graphique des modes */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, height: '100%' }}>
                    <Typography variant="h6" gutterBottom>
                      Répartition par Mode
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={modesChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="mode" type="category" width={100} />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="sessions" name="Nombre de sessions" fill="#FF9800" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Onglet Historique */}
          {activeTab === 'history' && (
            <Box>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Historique des Sessions
                  </Typography>
                  <IconButton onClick={loadHistoryData}>
                    <RechartsTooltip title="Rafraîchir" />
                  </IconButton>
                </Box>

                {historyData.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Aucune session d'entraînement enregistrée.
                  </Typography>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Range</TableCell>
                          <TableCell>Mode</TableCell>
                          <TableCell align="right">Score</TableCell>
                          <TableCell align="right">Questions</TableCell>
                          <TableCell align="right">Temps</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {historyData.map((session, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {new Date(session.created_at).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {session.range?.name || 'Inconnue'}
                            </TableCell>
                            <TableCell>
                              {session.mode}
                            </TableCell>
                            <TableCell align="right">
                              {Math.round(session.score)}%
                            </TableCell>
                            <TableCell align="right">
                              {session.correct_answers}/{session.total_questions}
                            </TableCell>
                            <TableCell align="right">
                              {Math.floor(session.time_spent / 60)}m {session.time_spent % 60}s
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            </Box>
          )}

          {/* Onglet Classement */}
          {activeTab === 'leaderboard' && (
            <Box>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Classement
                  </Typography>
                  <IconButton onClick={loadLeaderboardData}>
                    <RechartsTooltip title="Rafraîchir" />
                  </IconButton>
                </Box>

                {leaderboardData.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Aucun utilisateur dans le classement.
                  </Typography>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Rang</TableCell>
                          <TableCell>Utilisateur</TableCell>
                          <TableCell align="right">Sessions</TableCell>
                          <TableCell align="right">Score Moyen</TableCell>
                          <TableCell align="right">Temps Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {leaderboardData.map((user, index) => (
                          <TableRow key={user.user?.id || index}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                              {user.user?.username || 'Anonyme'}
                            </TableCell>
                            <TableCell align="right">{user.total_sessions}</TableCell>
                            <TableCell align="right">
                              {Math.round(user.avg_score)}%
                            </TableCell>
                            <TableCell align="right">
                              {Math.floor(user.total_time_spent / 60)}m
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default Stats;
