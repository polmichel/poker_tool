import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../auth/AuthContext';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, loading, error } = useAuthContext();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!username || !email || !password) {
      setLocalError('Tous les champs sont obligatoires');
      return;
    }

    if (password.length < 6) {
      setLocalError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    const user = await register(username, email, password);
    if (user) {
      navigate('/');
    }
  };

  const displayError = localError || error;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
      }}
    >
      <Paper sx={{ p: 4, maxWidth: 420, width: '100%' }} elevation={3}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            🎰 Poker Tool
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Créez votre compte
          </Typography>
        </Box>

        {displayError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {displayError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            label="Nom d'utilisateur"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            fullWidth
            margin="normal"
            required
            inputProps={{ 'data-testid': 'register-username' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            margin="normal"
            required
            inputProps={{ 'data-testid': 'register-email' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Mot de passe"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            required
            inputProps={{ 'data-testid': 'register-password' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ mt: 3, mb: 2 }}
            data-testid="register-submit"
          >
            {loading ? 'Inscription...' : "S'inscrire"}
          </Button>
        </Box>

        <Divider sx={{ my: 2 }}>ou</Divider>

        <Button fullWidth variant="outlined" size="large" onClick={() => navigate('/login')}>
          J'ai déjà un compte
        </Button>
      </Paper>
    </Box>
  );
};

export default Register;
