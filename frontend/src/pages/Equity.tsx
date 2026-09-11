/**
 * Equity simulator page: compute the equity of a hero hand against an opposing
 * range expressed as PokerStove-style notation (e.g. "QQ+, ATs+, KTs-JTs").
 *
 * Par défaut, un clic sur « Simuler » renvoie l'équité exacte issue de la table
 * pré-calculée (instant, reproductible). Si la table ne couvre pas toute la
 * range, une pop-up propose à l'utilisateur de renseigner un nombre
 * d'itérations Monte-Carlo puis de lancer le calcul.
 */
import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Divider,
  LinearProgress,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { PlayArrow as PlayArrowIcon, Fullscreen as FullscreenIcon } from '@mui/icons-material';
import { useEquity } from '../hooks';
import { EquityHeatmapGrid } from '../components';
import { EquityMissingError } from '../api';
import { isValidHand } from '../utils/helpers';
import { useFocusMode } from '../contexts/FocusModeContext';
import { IconButton, Tooltip } from '@mui/material';

const DEFAULT_MONTE_CARLO_ITERATIONS = 10000;

const Equity: React.FC = () => {
  const { result, loading, error, simulate, reset } = useEquity();
  const { setFocusMode } = useFocusMode();

  const [hero, setHero] = useState<string>('AKs');
  const [rangeText, setRangeText] = useState<string>('QQ+, AKs');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Pop-up Monte-Carlo (ouverte quand la table exacte est incomplète).
  const [mcDialogOpen, setMcDialogOpen] = useState(false);
  const [mcIterations, setMcIterations] = useState<number>(DEFAULT_MONTE_CARLO_ITERATIONS);
  const [mcMissing, setMcMissing] = useState<string[]>([]);
  const [mcRunning, setMcRunning] = useState(false);

  const runSimulate = useCallback(
    async (iterations?: number) => {
      setValidationError(null);
      try {
        await simulate(hero.trim(), rangeText.trim(), iterations);
      } catch (err) {
        if (err instanceof EquityMissingError) {
          setMcMissing(err.missing || []);
          setMcIterations(DEFAULT_MONTE_CARLO_ITERATIONS);
          setMcDialogOpen(true);
        }
      }
    },
    [hero, rangeText, simulate],
  );

  const handleSimulate = useCallback(() => {
    const trimmedHero = hero.trim();
    const trimmedRange = rangeText.trim();
    if (!isValidHand(trimmedHero)) {
      setValidationError('Main héro invalide (ex. AKs, TT, Q9o).');
      return;
    }
    if (!trimmedRange) {
      setValidationError('Veuillez saisir une range adverse.');
      return;
    }
    void runSimulate();
  }, [hero, rangeText, runSimulate]);

  const handleRunMonteCarlo = useCallback(async () => {
    setMcRunning(true);
    try {
      await simulate(hero.trim(), rangeText.trim(), mcIterations);
      setMcDialogOpen(false);
    } catch {
      // Une erreur ici (hors 409) est déjà surfaced via le hook `error`.
    } finally {
      setMcRunning(false);
    }
  }, [hero, rangeText, mcIterations, simulate]);

  const handleReset = useCallback(() => {
    reset();
    setValidationError(null);
  }, [reset]);

  const heroValid = isValidHand(hero.trim());

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Calculateur d'Équité
        </Typography>
        <Tooltip title="Mode Focus (Ctrl+M)">
          <IconButton onClick={() => setFocusMode(true)} color="inherit">
            <FullscreenIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Configuration */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Configuration de la simulation
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <TextField
            label="Main héro"
            value={hero}
            onChange={(e) => setHero(e.target.value)}
            placeholder="ex. AKs"
            size="small"
            error={!!hero && !heroValid}
            helperText={hero && !heroValid ? 'Main invalide' : ' '}
            sx={{ width: 140 }}
            inputProps={{ 'data-testid': 'equity-hero-input' }}
          />
          <TextField
            label="Range adverse"
            value={rangeText}
            onChange={(e) => setRangeText(e.target.value)}
            placeholder="ex. QQ+, ATs+, KTs-JTs"
            size="small"
            sx={{ minWidth: 300, flex: 1 }}
            helperText="Notation PokerStove : QQ+, ATs+, KTs-JTs, AKs…"
            inputProps={{ 'data-testid': 'equity-range-input' }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
            onClick={handleSimulate}
            disabled={loading}
            data-testid="equity-simulate-button"
          >
            {loading ? 'Calcul…' : 'Simuler'}
          </Button>
          {result && (
            <Button variant="outlined" color="inherit" onClick={handleReset}>
              Réinitialiser
            </Button>
          )}
        </Box>

        {validationError && (
          <Typography
            variant="body2"
            color="error"
            sx={{ mt: 1 }}
            data-testid="equity-validation-error"
          >
            {validationError}
          </Typography>
        )}
        {error && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
      </Paper>

      {/* Pop-up Monte-Carlo : la table exacte ne couvre pas toute la range. */}
      <Dialog
        open={mcDialogOpen}
        onClose={() => setMcDialogOpen(false)}
        data-testid="equity-mc-dialog"
      >
        <DialogTitle>Équité exacte indisponible</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Certaines mains adverses ne sont pas dans la table d'équité exacte. Vous pouvez lancer
            une simulation Monte-Carlo à la place.
          </Typography>
          {mcMissing && mcMissing.length > 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2 }}
              data-testid="equity-mc-missing"
            >
              Mains manquantes : {mcMissing.join(', ')}
            </Typography>
          )}
          <TextField
            label="Itérations Monte-Carlo"
            type="number"
            value={mcIterations}
            onChange={(e) => setMcIterations(Number(e.target.value))}
            size="small"
            fullWidth
            inputProps={{
              min: 100,
              max: 100000,
              step: 500,
              'data-testid': 'equity-mc-iterations-input',
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMcDialogOpen(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleRunMonteCarlo}
            disabled={mcRunning || mcIterations <= 0}
            data-testid="equity-mc-run-button"
          >
            {mcRunning ? 'Calcul…' : 'Lancer le calcul'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Résultats agrégés */}
      {result && (
        <Paper sx={{ p: 3, mb: 3 }} data-testid="equity-results">
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
          >
            <Typography variant="h6">
              {result.hero}{' '}
              <Typography component="span" color="text.secondary">
                vs range
              </Typography>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {result.iterations.toLocaleString('fr-FR')} itérations
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
            <EquityBar label="Victoire" value={result.win} color="#10b981" />
            <EquityBar label="Égalité" value={result.tie} color="#94a3b8" />
            <EquityBar label="Défaite" value={result.lose} color="#f43f5e" />
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Heatmap */}
          <Typography variant="subtitle2" gutterBottom>
            Équité par main adverse (heatmap)
          </Typography>
          <Box sx={{ overflowX: 'auto' }}>
            <EquityHeatmapGrid byHand={result.by_hand} />
          </Box>
        </Paper>
      )}

      {/* Tableau détaillé */}
      {result && result.by_hand.length > 0 && (
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table size="small" data-testid="equity-detail-table">
            <TableHead>
              <TableRow>
                <TableCell>Main adverse</TableCell>
                <TableCell align="right">Combos</TableCell>
                <TableCell align="right">Victoire (%)</TableCell>
                <TableCell align="right">Égalité (%)</TableCell>
                <TableCell align="right">Défaite (%)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {result.by_hand.map((h) => (
                <TableRow key={h.hand}>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    {h.hand}
                  </TableCell>
                  <TableCell align="right">{h.combos}</TableCell>
                  <TableCell align="right" sx={{ color: '#10b981' }}>
                    {h.win.toFixed(1)}
                  </TableCell>
                  <TableCell align="right">{h.tie.toFixed(1)}</TableCell>
                  <TableCell align="right" sx={{ color: '#f43f5e' }}>
                    {h.lose.toFixed(1)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* État vide */}
      {!result && !loading && !validationError && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Prêt à calculer une équité ?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Saisissez une main héro et une range adverse, puis cliquez sur « Simuler ».
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

interface EquityBarProps {
  label: string;
  value: number;
  color: string;
}

const EquityBar: React.FC<EquityBarProps> = ({ label, value, color }) => (
  <Box>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
      <Typography variant="body2">{label}</Typography>
      <Typography variant="body2" fontWeight="bold">
        {value.toFixed(1)}%
      </Typography>
    </Box>
    <LinearProgress
      variant="determinate"
      value={value}
      sx={{
        height: 10,
        borderRadius: 5,
        backgroundColor: 'rgba(148,163,184,0.15)',
        '& .MuiLinearProgress-bar': { backgroundColor: color, borderRadius: 5 },
      }}
    />
  </Box>
);

export default Equity;
