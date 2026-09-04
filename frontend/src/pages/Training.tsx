import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Divider,
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
  Fullscreen as FullscreenIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  TrainingModeSelector,
  TrainingQuestion,
  TrainingGridQuestion,
  TrainingGuessRangeQuestion,
} from '../components';
import { useTraining, useRanges } from '../hooks';
import { TrainingMode, Range } from '../types';
import { useFocusMode } from '../contexts/FocusModeContext';

const Training: React.FC = () => {
  const navigate = useNavigate();
  const { setFocusMode } = useFocusMode();
  const {
    currentSession,
    currentQuestion,
    error,
    score,
    isSessionActive,
    timeSpent,
    progress,
    setIsSessionActive,
    createSession,
    nextQuestion,
    endSession,
    quickStart,
    fetchTrainingModes,
    resetTrainingState,
  } = useTraining();

  const { ranges } = useRanges();

  const [selectedMode, setSelectedMode] = useState<TrainingMode>('fill');
  const [selectedRange, setSelectedRange] = useState<Range | null>(null);
  const [openSettingsDialog, setOpenSettingsDialog] = useState<boolean>(false);
  const [openResultsDialog, setOpenResultsDialog] = useState<boolean>(false);
  const [totalQuestions, setTotalQuestions] = useState<number>(10);

  // Load training modes on mount
  useEffect(() => {
    fetchTrainingModes();
  }, [fetchTrainingModes]);

  // Start a new training session
  const handleStartTraining = useCallback(async () => {
    if (!selectedRange) {
      alert('Veuillez selectionner une range');
      return;
    }

    if (!selectedRange.hands || Object.keys(selectedRange.hands).length === 0) {
      alert(
        "La range selectionnee ne contient aucune main. Veuillez ajouter des mains a votre range avant de demarrer l'entrainement.",
      );
      return;
    }

    const session = await createSession(selectedMode, selectedRange.id!, undefined, totalQuestions);
    if (session) {
      setIsSessionActive(true);
    }
  }, [selectedMode, selectedRange, createSession, setIsSessionActive, totalQuestions]);

  // Quick start with default parameters
  const handleQuickStart = useCallback(async () => {
    if (ranges.length === 0) {
      alert("Aucune range disponible. Veuillez en creer une d'abord.");
      return;
    }

    const result = await quickStart(selectedMode, ranges[0].id!, undefined);
    if (result) {
      setSelectedRange(ranges[0]);
      setIsSessionActive(true);
    }
  }, [selectedMode, ranges, quickStart, setIsSessionActive]);

  // Submit an answer
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    correctAnswer: string | null;
    sessionComplete: boolean;
  } | null>(null);

  const handleAnswer = useCallback(
    async (answer: string) => {
      if (!currentSession || !currentSession.id) return;

      const result = await nextQuestion(currentSession.id, answer);

      if (result) {
        setFeedback({
          isCorrect: result.isCorrect,
          correctAnswer: result.correctAnswer,
          sessionComplete: result.sessionComplete,
        });
      }
    },
    [currentSession, nextQuestion],
  );

  // Advance to next question (or show results if session is complete)
  const handleNextQuestion = useCallback(() => {
    if (feedback?.sessionComplete) {
      setIsSessionActive(false);
      setOpenResultsDialog(true);
    }
    setFeedback(null);
  }, [feedback, setIsSessionActive]);

  // End the session
  const handleEndSession = useCallback(async () => {
    if (!currentSession || !currentSession.id) return;

    await endSession(currentSession.id);
    setIsSessionActive(false);
    setOpenResultsDialog(true);
  }, [currentSession, endSession, setIsSessionActive]);

  // Reset the session
  const handleResetSession = useCallback(() => {
    resetTrainingState();
  }, [resetTrainingState]);

  // Open settings
  const handleOpenSettings = useCallback(() => {
    setOpenSettingsDialog(true);
  }, []);

  // Close settings
  const handleCloseSettings = useCallback(() => {
    setOpenSettingsDialog(false);
  }, []);

  // Close results
  const handleCloseResults = useCallback(() => {
    setOpenResultsDialog(false);
    resetTrainingState();
  }, [resetTrainingState]);

  // Change training mode
  const handleModeChange = useCallback((mode: TrainingMode) => {
    setSelectedMode(mode);
  }, []);

  // Select a range
  const handleRangeSelect = useCallback((range: Range) => {
    setSelectedRange(range);
  }, []);

  // Calculate current question number
  const questionNumber = progress?.current ? progress.current + 1 : 1;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Entrainement
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Mode Focus (Ctrl+M)">
            <IconButton onClick={() => setFocusMode(true)} color="inherit">
              <FullscreenIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Parametres">
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={handleOpenSettings}
              color="inherit"
            >
              Parametres
            </Button>
          </Tooltip>

          <Tooltip title="Demarrer rapidement">
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={handleQuickStart}
              color="success"
              disabled={ranges.length === 0}
              data-testid="quick-start-button"
            >
              Demarrer
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {/* Error display */}
      {error && (
        <Paper sx={{ p: 2, mb: 2, backgroundColor: 'error.main', color: 'error.contrastText' }}>
          <Typography variant="body1">{error}</Typography>
        </Paper>
      )}

      {/* Mode selection */}
      <TrainingModeSelector
        selectedMode={selectedMode}
        onModeChange={handleModeChange}
        disabled={isSessionActive}
      />

      {/* Range selection */}
      {!isSessionActive && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Selectionner une Range
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
              Aucune range disponible.{' '}
              <Button onClick={() => navigate('/ranges/new')} color="primary">
                Creer une range
              </Button>
            </Typography>
          )}
        </Paper>
      )}

      {/* Question area */}
      {isSessionActive && currentQuestion && (
        <Box sx={{ mb: 3 }}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
            >
              <Typography variant="h6">Session en cours</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip label={`Score: ${Math.round(score)}%`} color="primary" />
                <Chip
                  label={`Temps: ${Math.floor(timeSpent / 60)}m ${timeSpent % 60}s`}
                  color="secondary"
                />
              </Box>
            </Box>

            <LinearProgress
              variant="determinate"
              value={score}
              sx={{ height: 8, borderRadius: 4, mb: 2 }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Tooltip title="Terminer la session">
                <IconButton
                  onClick={handleEndSession}
                  color="error"
                  data-testid="end-session-button"
                >
                  <StopIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>

          {currentQuestion.type === 'grid_paint' ? (
            <TrainingGridQuestion
              question={currentQuestion}
              onAnswer={handleAnswer}
              onNext={handleNextQuestion}
              feedback={feedback}
            />
          ) : currentQuestion.type === 'guess' && currentQuestion.grid ? (
            <TrainingGuessRangeQuestion
              question={currentQuestion}
              onAnswer={handleAnswer}
              onNext={handleNextQuestion}
              feedback={feedback}
              questionNumber={questionNumber}
              totalQuestions={progress?.total || totalQuestions}
            />
          ) : (
            <TrainingQuestion
              question={currentQuestion}
              onAnswer={handleAnswer}
              onNext={handleNextQuestion}
              feedback={feedback}
              questionNumber={questionNumber}
              totalQuestions={progress?.total || totalQuestions}
            />
          )}
        </Box>
      )}

      {/* Error message if session is active but no question */}
      {isSessionActive && !currentQuestion && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            Aucune question disponible
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            La range selectionnee ne contient pas assez de mains pour generer des questions.
          </Typography>
          <Button variant="contained" onClick={handleResetSession} color="inherit">
            Retour
          </Button>
        </Paper>
      )}

      {/* Start zone */}
      {!isSessionActive && !currentQuestion && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Pret a vous entrainer ?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Selectionnez un mode et une range, puis cliquez sur "Demarrer"
          </Typography>

          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={handleStartTraining}
            disabled={!selectedRange}
            size="large"
            data-testid="start-training-button"
          >
            Demarrer l'entrainement
          </Button>
        </Paper>
      )}

      {/* Settings dialog */}
      <Dialog open={openSettingsDialog} onClose={handleCloseSettings} maxWidth="sm" fullWidth>
        <DialogTitle>Parametres d'entrainement</DialogTitle>
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

      {/* Results dialog */}
      <Dialog
        open={openResultsDialog}
        onClose={handleCloseResults}
        maxWidth="sm"
        fullWidth
        data-testid="results-dialog"
      >
        <DialogTitle>Resultats de la Session</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary" gutterBottom data-testid="final-score">
              {Math.round(score)}%
            </Typography>
            <Typography variant="h6" gutterBottom>
              Score final
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Bonnes reponses
                </Typography>
                <Typography variant="h6">{progress?.correct || 0}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Questions
                </Typography>
                <Typography variant="h6">{progress?.total || totalQuestions}</Typography>
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
