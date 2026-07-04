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
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  ImportExport as ImportExportIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { RangeList, RangeForm, RangeGrid, ImportExportDialog } from '../components';
import { useRanges } from '../hooks';
import { Range, RangeType, Position } from '../types';
import { generateRangeGrid } from '../utils/helpers';

const Ranges: React.FC = () => {
  const navigate = useNavigate();
  const {
    ranges,
    loading,
    error,
    selectedRange,
    setSelectedRange,
    fetchRanges,
    createRange,
    updateRange,
    deleteRange,
    importRange,
    exportRange,
  } = useRanges();

  const [openFormDialog, setOpenFormDialog] = useState<boolean>(false);
  const [openImportExportDialog, setOpenImportExportDialog] = useState<boolean>(false);
  const [editingRange, setEditingRange] = useState<Range | null>(null);
  const [rangeToExport, setRangeToExport] = useState<Range | null>(null);

  // Charger les ranges au montage
  useEffect(() => {
    fetchRanges();
  }, [fetchRanges]);

  // Sélectionner une range
  const handleSelectRange = useCallback((range: Range) => {
    setSelectedRange(range);
    navigate(`/ranges/${range.id}/view`);
  }, [setSelectedRange, navigate]);

  // Modifier une range
  const handleEditRange = useCallback((range: Range) => {
    setEditingRange(range);
    setOpenFormDialog(true);
  }, []);

  // Supprimer une range
  const handleDeleteRange = useCallback(async (rangeId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette range ?')) {
      await deleteRange(rangeId);
      fetchRanges();
    }
  }, [deleteRange, fetchRanges]);

  // Créer une nouvelle range
  const handleCreateRange = useCallback(async (rangeData: Omit<Range, 'id' | 'created_at' | 'updated_at'>) => {
    const newRange = await createRange(rangeData);
    if (newRange) {
      setOpenFormDialog(false);
      fetchRanges();
      navigate(`/ranges/${newRange.id}/edit`);
    }
  }, [createRange, fetchRanges, navigate]);

  // Mettre à jour une range
  const handleUpdateRange = useCallback(async (rangeData: Partial<Range>) => {
    if (editingRange?.id) {
      const updatedRange = await updateRange(editingRange.id, rangeData);
      if (updatedRange) {
        setOpenFormDialog(false);
        setEditingRange(null);
        fetchRanges();
      }
    }
  }, [editingRange, updateRange, fetchRanges]);

  // Ouvrir le dialogue d'import/export
  const handleOpenImportExport = useCallback((range?: Range) => {
    setRangeToExport(range || null);
    setOpenImportExportDialog(true);
  }, []);

  // Gérer l'import
  const handleImport = useCallback(async (content: string, format: 'json' | 'text' | 'csv') => {
    await importRange(content, format);
    fetchRanges();
  }, [importRange, fetchRanges]);

  // Gérer l'export
  const handleExport = useCallback(async (range: Range, format: 'json' | 'text' | 'csv') => {
    const result = await exportRange(range.id!, format);
    if (result) {
      // Télécharger le fichier
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${range.name.replace(/\s+/g, '_')}_${format}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [exportRange]);

  // Fermer le dialogue de formulaire
  const handleCloseFormDialog = useCallback(() => {
    setOpenFormDialog(false);
    setEditingRange(null);
  }, []);

  // Fermer le dialogue d'import/export
  const handleCloseImportExportDialog = useCallback(() => {
    setOpenImportExportDialog(false);
    setRangeToExport(null);
  }, []);

  // Ouvrir le formulaire pour une nouvelle range
  const handleOpenNewRangeForm = useCallback(() => {
    setEditingRange(null);
    setOpenFormDialog(true);
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Mes Ranges
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Importer/Exporter">
            <Button
              variant="outlined"
              startIcon={<ImportExportIcon />}
              onClick={() => handleOpenImportExport()}
              color="inherit"
            >
              Importer/Exporter
            </Button>
          </Tooltip>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenNewRangeForm}
            color="primary"
          >
            Nouvelle Range
          </Button>
        </Box>
      </Box>

      {/* Contenu principal */}
      {loading ? (
        <Typography>Chargement des ranges...</Typography>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Grid container spacing={3}>
          {/* Liste des ranges */}
          <Grid item xs={12} md={4}>
            <RangeList
              ranges={ranges}
              onSelectRange={handleSelectRange}
              onEditRange={handleEditRange}
              onDeleteRange={handleDeleteRange}
              selectedRangeId={selectedRange?.id || null}
            />
          </Grid>

          {/* Aperçu de la range sélectionnée */}
          <Grid item xs={12} md={8}>
            {selectedRange ? (
              <Paper sx={{ p: 2, height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">{selectedRange.name}</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Modifier">
                      <IconButton onClick={() => handleEditRange(selectedRange)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Exporter">
                      <IconButton onClick={() => handleOpenImportExport(selectedRange)}>
                        <ImportExportIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                
                <Divider sx={{ my: 1 }} />
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {selectedRange.description}
                </Typography>
                
                <Typography variant="caption" color="text.disabled" gutterBottom>
                  Type: {selectedRange.range_type} | Position: {selectedRange.position}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                {/* Grille de la range */}
                <Box sx={{ overflow: 'auto' }}>
                  <RangeGrid
                    grid={generateRangeGrid(selectedRange.hands)}
                    editable={false}
                    cellSize={35}
                  />
                </Box>
              </Paper>
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center', height: '100%' }}>
                <Typography variant="body1" color="text.secondary">
                  Sélectionnez une range pour voir ses détails
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      )}

      {/* Dialogue pour créer/modifier une range */}
      <Dialog open={openFormDialog} onClose={handleCloseFormDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingRange ? 'Modifier la Range' : 'Nouvelle Range'}
        </DialogTitle>
        <DialogContent>
          <RangeForm
            range={editingRange}
            onSubmit={editingRange ? handleUpdateRange : handleCreateRange}
            onCancel={handleCloseFormDialog}
            existingRangeNames={ranges.map(r => r.name)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialogue pour importer/exporter */}
      <ImportExportDialog
        open={openImportExportDialog}
        onClose={handleCloseImportExportDialog}
        onImport={handleImport}
        onExport={handleExport}
        rangeToExport={rangeToExport}
      />
    </Box>
  );
};

export default Ranges;
