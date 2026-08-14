/**
 * Route guard for pages that require authentication.
 */
import React from 'react';
import { Box, Typography } from '@mui/material';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
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
