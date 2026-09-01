/**
 * Application root: composes the theme, the shell and the routes.
 */
import React from 'react';
import { ThemeProvider } from '@mui/material';
import { Routes, Route, Navigate } from 'react-router-dom';
import { darkTheme } from './app/theme';
import { AuthProvider } from './auth/AuthContext';
import { AppShell } from './app/AppShell';
import { ProtectedRoute } from './app/ProtectedRoute';
import {
  Home,
  Ranges,
  RangeView,
  RangeEditor,
  Training,
  Stats,
  ImportExport,
  Equity,
  Login,
  Register,
  RangeManager,
} from './pages';

const App: React.FC = () => {
  return (
    <ThemeProvider theme={darkTheme}>
      <AuthProvider>
        <AppShell>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Home />} />
            <Route
              path="/ranges"
              element={
                <ProtectedRoute>
                  <Ranges />
                </ProtectedRoute>
              }
            />
            <Route
              path="/range-manager"
              element={
                <ProtectedRoute>
                  <RangeManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ranges/new"
              element={
                <ProtectedRoute>
                  <RangeEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ranges/:id/view"
              element={
                <ProtectedRoute>
                  <RangeView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ranges/:id/edit"
              element={
                <ProtectedRoute>
                  <RangeEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/training"
              element={
                <ProtectedRoute>
                  <Training />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stats"
              element={
                <ProtectedRoute>
                  <Stats />
                </ProtectedRoute>
              }
            />
            <Route
              path="/import-export"
              element={
                <ProtectedRoute>
                  <ImportExport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/equity"
              element={
                <ProtectedRoute>
                  <Equity />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
