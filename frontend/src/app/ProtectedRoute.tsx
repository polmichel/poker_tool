/**
 * Route guard for pages that require authentication.
 */
import React from 'react';
import { Box, Typography } from '@mui/material';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../auth/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuthContext();
  if (loading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}
      >
        <Typography>Chargement...</Typography>
      </Box>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};
