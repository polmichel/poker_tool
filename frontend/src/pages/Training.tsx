import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Divider,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Replay as ReplayIcon,
  Settings as SettingsIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { TrainingModeSelector, TrainingQuestion } from '../components';
import { useTraining, useRanges } from '../hooks';
import { TrainingMode, Range } from '../types';

const Training: React.FC = () => {
  const navigate = useNavigate();
  const {
    sessions,
    currentSession,
    currentQuestion,
    loading,
    error,
    score,
    isSessionActive,
    timeSpent,
    setCurrentSession,
    setCurrentQuestion,
    setIsSessionActive,
    createSession,
    startSession,
    nextQuestion,
    endSession,
    quickStart,
    fetchTrainingModes,
    resetTrainingState,
  } = useTraining();

  const { ranges, fetchRanges } = useRanges();

  const [selectedMode, setSelectedMode] = useState<TrainingMode>('fill');
  const [selectedRange, setSelectedRange] = useState<Range | null>(null);
  const [openSettingsDialog, setOpenSettingsDialog] = useState<boolean>(false);
  const [openResultsDialog, setOpenResultsDialog] = useState<boolean>(false);
  const [questionNumber, setQuestionNumber] = useState<number>(1);
  const [totalQuestions, setTotalQuestions] = useState<number>(10);

  // Charger les données au montage
  useEffect(() => {
    fetchRanges();
    fetchTrainingModes();
  }, [fetchRanges, fetchTrainingModes]);

  // Démarrer une nouvelle session
  const handleStartTraining = useCallback(async () => {
    if (!selectedRange) {
      alert('Veuillez sélectionner une range');
      return;
    }

    const session = await createSession(selectedMode, selectedRange.id!);
    if (session) {
      const result = await startSession(session.id);
      if (result) {
        setCurrentSession(result.session);
        setCurrentQuestion(result.first_question);
        setIsSessionActive(true);
        setQuestionNumber(1);
      }
    }
  }, [selectedMode, selectedRange, createSession, startSession, setCurrentSession, setCurrentQuestion, setIsSessionActive]);

  // Démarrer rapidement avec des paramètres par défaut
  const handleQuickStart = useCallback(async () => {
    if (ranges.length === 0) {
      alert('Aucune range disponible. Veuillez en créer une d\'abord.');
      return;
    }

    // Utiliser la première range disponible
    const result = await quickStart(selectedMode, ranges[0].id!);
    if (result) {
      setCurrentSession(result.session);
      setCurrentQuestion(result.first_question);
      setIsSessionActive(true);
      setSelectedRange(ranges[0]);
      setQuestionNumber(1);
    }
  }, [selectedMode, ranges, quickStart, setCurrentSession, setCurrentQuestion, setIsSessionActive]);

  // Soumettre une réponse
  const handleAnswer = useCallback(async (answer: string) => {
    if (!currentSession) return;

    const result = await nextQuestion(currentSession.id, answer);
    if (result) {
      if (result.next_question) {
        setCurrentQuestion(result.next_question);
        setQuestionNumber(prev => prev + 1);
      } else {
        // Fin de la session
        setIsSessionActive(false);
        setOpenResultsDialog(true);
      }
    }
  }, [currentSession, nextQuestion, setCurrentQuestion, setIsSessionActive]);

  // Terminer la session
  const handleEndSession = useCallback(async () => {
    if (!currentSession) return;

    await endSession(currentSession.id);
    setIsSessionActive(false);
    setOpenResultsDialog(true);
  }, [currentSession, endSession, setIsSessionActive]);

  // Réinitialiser la session
  const handleResetSession = useCallback(() => {
    resetTrainingState();
    setQuestionNumber(1);
  }, [resetTrainingState]);

  // Ouvrir les paramètres
  const handleOpenSettings = useCallback(() => {
    setOpenSettingsDialog(true);
  }, []);

  // Fermer les paramètres
  const handleCloseSettings = useCallback(() => {
    setOpenSettingsDialog(false);
  }, []);

  // Fermer les résultats
  const handleCloseResults = useCallback(() => {
    setOpenResultsDialog(false);
    resetTrainingState();
    setQuestionNumber(1);
  }, [resetTrainingState]);

  // Changer le mode d'entraînement
  const handleModeChange = useCallback((mode: TrainingMode) => {
    setSelectedMode(mode);
  }, []);

  // Sélectionner une range
  const handleRangeSelect = useCallback((range: Range) => {
    setSelectedRange(range);
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Entraînement
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Paramètres">
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={handleOpenSettings}
              color="inherit"
            >
              Paramètres
            </Button>
          </Tooltip>
          
          <Tooltip title="Démarrer rapidement">
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={handleQuickStart}
              color="success"
              disabled={ranges.length === 0}
            >
              Démarrer
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {/* Sélection du mode */}
      <TrainingModeSelector
        selectedMode={selectedMode}
        onModeChange={handleModeChange}
        disabled={isSessionActive}
      />

      {/* Sélection de la range */}
      {!isSessionActive && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Sélectionner une Range
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {ranges.map((range) => (
              <Chip
                key={range.id}
                label={range.name}
                onClick={() => handleRangeSelect(range)}
                color={selectedRange?.id === range.id ? 'primary' : 'default'}
                variant={selectedRange?.id === range.id ? 'filled' : 'outlined'}
                clickable
              />
            ))}
          </Box>
          
          {ranges.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Aucune range disponible. <Button onClick={() => navigate('/ranges/new')} color="primary">
                Créer une range
              </Button>
            </Typography>
          )}
        </Paper>
      )}

      {/* Zone de la question */}
      {isSessionActive && currentQuestion && (
        <Box sx={{ mb: 3 }}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">
                Session en cours
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip label={`Score: ${Math.round(score)}%`} color="primary" />
                <Chip label={`Temps: ${Math.floor(timeSpent / 60)}m ${timeSpent % 60}s`} color="secondary" />
              </Box>
            </Box>
            
            <LinearProgress
              variant="determinate"
              value={score}
              sx={{ height: 8, borderRadius: 4, mb: 2 }}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Tooltip title="Terminer la session">
                <IconButton onClick={handleEndSession} color="error">
                  <StopIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>

          <TrainingQuestion
            question={currentQuestion}
            onAnswer={handleAnswer}
            isLastQuestion={questionNumber === totalQuestions}
            questionNumber={questionNumber}
            totalQuestions={totalQuestions}
            timeLeft={undefined}
          />
        </Box>
      )}

      {/* Zone de démarrage */}
      {!isSessionActive && !currentSession && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Prêt à vous entraîner ?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Sélectionnez un mode et une range, puis cliquez sur "Démarrer"
          </Typography>
          
          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={handleStartTraining}
            disabled={!selectedRange}
            size="large"
          >
            Démarrer l'entraînement
          </Button>
        </Paper>
      )}

      {/* Dialogue des paramètres */}
      <Dialog open={openSettingsDialog} onClose={handleCloseSettings} maxWidth="sm" fullWidth>
        <DialogTitle>Paramètres d'entraînement</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Nombre de questions
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              {[5, 10, 20, 50].map((num) => (
                <Button
                  key={num}
                  variant={totalQuestions === num ? 'contained' : 'outlined'}
                  onClick={() => setTotalQuestions(num)}
                >
                  {num}
                </Button>
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSettings} color="inherit">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue des résultats */}
      <Dialog open={openResultsDialog} onClose={handleCloseResults} maxWidth="sm" fullWidth>
        <DialogTitle>Résultats de la Session</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary" gutterBottom>
              {Math.round(score)}%
            </Typography>
            <Typography variant="h6" gutterBottom>
              Score final
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Questions
                </Typography>
                <Typography variant="h6">{questionNumber - 1}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Temps
                </Typography>
                <Typography variant="h6">
                  {Math.floor(timeSpent / 60)}m {timeSpent % 60}s
                </Typography>
              </Box>
            </Box>
            
            <LinearProgress
              variant="determinate"
              value={score}
              sx={{ height: 8, borderRadius: 4, mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResults} color="inherit">
            Fermer
          </Button>
          <Button
            onClick={() => {
              handleCloseResults();
              handleQuickStart();
            }}
            color="primary"
            startIcon={<ReplayIcon />}
          >
            Recommencer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Training;
