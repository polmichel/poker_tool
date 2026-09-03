import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Folder as FolderIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  ImportExport as ImportExportIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  Fullscreen as FullscreenIcon,
  DragHandle as DragHandleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { RangeForm, RangeGrid, ImportExportDialog } from '../components';
import { useRanges, useRangeFolders } from '../hooks';
import type { Folder as FolderType } from '../hooks';
import { Range } from '../types';
import { generateRangeGrid } from '../utils/helpers';
import { THEME_COLORS } from '../utils/constants';
import { useFocusMode } from '../contexts/FocusModeContext';

// Types pour la gestion des dossiers (issus du hook de persistance)
type Folder = FolderType;

const Ranges: React.FC = () => {
  const navigate = useNavigate();
  const { setFocusMode } = useFocusMode();
  const {
    ranges: backendRanges,
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

  // Dossiers : arbre persistant (localStorage, clé par utilisateur)
  // géré par le hook useRangeFolders. La racine "Toutes les Ranges"
  // contient toutes les ranges non assignées à un sous-dossier.
  const allRangeIds = backendRanges.map((r) => r.id || 0);
  const { folders, createFolder, moveRangeToFolder } = useRangeFolders(allRangeIds);

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [draggingRangeId, setDraggingRangeId] = useState<number | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [selectedRangeId, setSelectedRangeId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [panelSizes] = useState({ left: 250, middle: 350, right: 500 });
  const [ghostRange, setGhostRange] = useState<{ id: number; x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // État pour les dialogues (compatibilité avec l'ancienne version)
  const [openFormDialog, setOpenFormDialog] = useState<boolean>(false);
  const [openImportExportDialog, setOpenImportExportDialog] = useState<boolean>(false);
  const [editingRange, setEditingRange] = useState<Range | null>(null);
  const [rangeToExport, setRangeToExport] = useState<Range | null>(null);

  // Sélectionner la racine par défaut une fois l'arbre disponible.
  useEffect(() => {
    if (!selectedFolderId && folders.length > 0) {
      setSelectedFolderId(folders[0].id);
    }
  }, [selectedFolderId, folders]);

  // Charger les ranges au montage
  useEffect(() => {
    fetchRanges();
  }, [fetchRanges]);

  // Trouve un dossier par id en parcourant l'arbre.
  const findFolder = useCallback((nodes: Folder[], id: string | null): Folder | null => {
    if (!id) return null;
    for (const n of nodes) {
      if (n.id === id) return n;
      const found = findFolder(n.children, id);
      if (found) return found;
    }
    return null;
  }, []);

  // Obtenir le dossier sélectionné
  const selectedFolder = useMemo(
    () => findFolder(folders, selectedFolderId) || null,
    [folders, selectedFolderId, findFolder],
  );

  // Obtenir les ranges du dossier sélectionné
  const rangesInSelectedFolder = useMemo(() => {
    if (!selectedFolder) return [];
    return backendRanges.filter((r) => selectedFolder.rangeIds.includes(r.id || 0));
  }, [selectedFolder, backendRanges]);

  // Obtenir la range sélectionnée
  const selectedRangeFromState = useMemo(() => {
    return backendRanges.find((r) => r.id === selectedRangeId) || null;
  }, [backendRanges, selectedRangeId]);

  // Filtrer les ranges
  const filteredRanges = useMemo(() => {
    return rangesInSelectedFolder.filter((range) => {
      const query = searchQuery.toLowerCase();
      return (
        range.name.toLowerCase().includes(query) ||
        range.description?.toLowerCase().includes(query) ||
        range.position.toLowerCase().includes(query) ||
        range.range_type.toLowerCase().includes(query)
      );
    });
  }, [rangesInSelectedFolder, searchQuery]);

  // Créer un nouveau dossier (persistance via le hook). Insère dans le
  // parent sélectionné, ou à la racine si aucun parent.
  const handleCreateFolder = useCallback(() => {
    const name = prompt('Nom du nouveau dossier:', 'Nouveau Dossier');
    if (!name) return;
    // Crée dans le dossier sélectionné s'il existe, sinon sous la racine.
    const parentId = selectedFolderId || folders[0]?.id || null;
    createFolder(name, parentId);
  }, [selectedFolderId, folders, createFolder]);

  // --- Drag & drop : ranges -> dossiers (HTML5 natif, sans dépendance) ---
  const handleRangeDragStart = useCallback((rangeId: number, e: React.DragEvent) => {
    setDraggingRangeId(rangeId);
    setIsDragging(true);
    // Create ghost element for visual feedback
    const rangeElement = e.currentTarget as HTMLElement;
    const rect = rangeElement.getBoundingClientRect();
    setGhostRange({ id: rangeId, x: e.clientX - rect.width / 2, y: e.clientY - rect.height / 2 });
  }, []);

  const handleRangeDrag = useCallback(
    (e: React.DragEvent) => {
      if (ghostRange && isDragging) {
        setGhostRange({ ...ghostRange, x: e.clientX - 150, y: e.clientY - 20 });
      }
    },
    [ghostRange, isDragging],
  );

  const handleRangeDragEnd = useCallback(() => {
    setDraggingRangeId(null);
    setDragOverFolderId(null);
    setGhostRange(null);
    setIsDragging(false);
  }, []);

  const handleFolderDragOver = useCallback(
    (e: React.DragEvent, folderId: string) => {
      if (draggingRangeId === null) return;
      e.preventDefault(); // autorise le drop
      e.dataTransfer.dropEffect = 'move';
      if (dragOverFolderId !== folderId) setDragOverFolderId(folderId);
    },
    [draggingRangeId, dragOverFolderId],
  );

  const handleFolderDragLeave = useCallback((folderId: string) => {
    setDragOverFolderId((prev) => (prev === folderId ? null : prev));
  }, []);

  const handleFolderDrop = useCallback(
    (e: React.DragEvent, folderId: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (draggingRangeId !== null) {
        moveRangeToFolder(draggingRangeId, folderId);
        // Ne pas changer de dossier, garder la sélection actuelle
        // pour que l'image reste visible dans le panneau droit
      }
      setDraggingRangeId(null);
      setDragOverFolderId(null);
    },
    [draggingRangeId, moveRangeToFolder],
  );

  // Sélectionner un dossier
  const handleSelectFolder = useCallback((folderId: string) => {
    setSelectedFolderId(folderId);
    setSelectedRangeId(null);
  }, []);

  // Sélectionner une range (nouvelle version)
  const handleSelectRangeNew = useCallback((rangeId: number) => {
    setSelectedRangeId(rangeId);
  }, []);

  // Ouvrir une range dans l'éditeur
  const handleOpenRange = useCallback(
    (rangeId: number) => {
      navigate(`/ranges/${rangeId}/edit`);
    },
    [navigate],
  );

  // Créer une nouvelle range
  const handleCreateRange = useCallback(
    async (rangeData: Omit<Range, 'id' | 'created_at' | 'updated_at'>) => {
      const newRange = await createRange(rangeData);
      if (newRange) {
        setOpenFormDialog(false);
        fetchRanges();
        navigate(`/ranges/${newRange.id}/edit`);
      }
    },
    [createRange, fetchRanges, navigate],
  );

  // Mettre à jour une range
  const handleUpdateRange = useCallback(
    async (rangeData: Partial<Range>) => {
      if (editingRange?.id) {
        const updatedRange = await updateRange(editingRange.id, rangeData);
        if (updatedRange) {
          setOpenFormDialog(false);
          setEditingRange(null);
          fetchRanges();
        }
      }
    },
    [editingRange, updateRange, fetchRanges],
  );

  // Ouvrir le dialogue d'import/export
  const handleOpenImportExport = useCallback((range?: Range) => {
    setRangeToExport(range || null);
    setOpenImportExportDialog(true);
  }, []);

  // Gérer l'import
  const handleImport = useCallback(
    async (content: string, format: 'json' | 'text' | 'csv') => {
      await importRange(content, format);
      fetchRanges();
    },
    [importRange, fetchRanges],
  );

  // Gérer l'export
  const handleExport = useCallback(
    async (range: Range, format: 'json' | 'text' | 'csv') => {
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
    },
    [exportRange],
  );

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

  // Ouvrir le formulaire de création pour le bouton du panneau central.
  // On conserve le comportement dialog de l'ancienne page Ranges (et les
  // contrats des tests E2E qui attendent l'ouverture d'un .MuiDialog-root)
  // plutôt que la navigation vers /ranges/new.
  const handleCreateRangeNew = useCallback(() => {
    setEditingRange(null);
    setOpenFormDialog(true);
  }, []);

  // Rendu d'un dossier dans l'arbre. Cible de drop pour le drag-and-drop des
  // ranges : on met en surbrillance le dossier survolé pendant le drag.
  const renderFolder = (folder: Folder, depth = 0) => {
    const isDropTarget = draggingRangeId !== null && dragOverFolderId === folder.id;
    return (
      <Box key={folder.id} sx={{ pl: depth * 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 1,
            borderRadius: 1,
            cursor: 'pointer',
            backgroundColor: isDropTarget
              ? 'rgba(16, 185, 129, 0.24)'
              : selectedFolderId === folder.id
                ? 'rgba(16, 185, 129, 0.14)'
                : 'transparent',
            border: isDropTarget ? `1px dashed ${THEME_COLORS.primary}` : '1px solid transparent',
            transition: 'background-color 0.15s ease, border-color 0.15s ease',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
            },
          }}
          draggable={false}
          onClick={() => handleSelectFolder(folder.id)}
          onDragOver={(e) => handleFolderDragOver(e, folder.id)}
          onDragLeave={() => handleFolderDragLeave(folder.id)}
          onDrop={(e) => handleFolderDrop(e, folder.id)}
        >
          <FolderIcon fontSize="small" />
          <Typography variant="body2">{folder.name}</Typography>
          {folder.rangeIds.length > 0 && (
            <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto' }}>
              {folder.rangeIds.length}
            </Typography>
          )}
        </Box>
        {folder.children.map((child) => renderFolder(child, depth + 1))}
      </Box>
    );
  };

  // Panneau gauche (arbre des dossiers)
  const LeftPanel = () => (
    <Paper
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: THEME_COLORS.paperElevated,
        borderRight: `1px solid ${THEME_COLORS.border}`,
      }}
    >
      <Box sx={{ p: 1, pb: 0 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Dossiers
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {folders.filter((f) => f.parentId === null).map((folder) => renderFolder(folder))}
      </Box>

      <Box sx={{ p: 1, pt: 0 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<FolderIcon />}
          onClick={handleCreateFolder}
          size="small"
        >
          Nouveau Dossier
        </Button>
      </Box>
    </Paper>
  );

  // Panneau du milieu (liste des ranges)
  const MiddlePanel = () => (
    <Paper
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: THEME_COLORS.paperElevated,
        borderRight: `1px solid ${THEME_COLORS.border}`,
      }}
    >
      <Box sx={{ p: 1, pb: 0 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Ranges ({filteredRanges.length})
        </Typography>
      </Box>

      <Box sx={{ p: 1, pb: 0 }}>
        <Paper
          component="input"
          sx={{
            p: '8px 12px',
            width: '100%',
            backgroundColor: THEME_COLORS.paper,
            border: `1px solid ${THEME_COLORS.border}`,
            borderRadius: 1,
          }}
          placeholder="Rechercher une range..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {filteredRanges.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', p: 2 }}>
            Aucune range trouvée
          </Typography>
        ) : (
          filteredRanges.map((range) => (
            <Box
              key={range.id}
              draggable
              onDragStart={(e) => handleRangeDragStart(range.id || 0, e)}
              onDrag={handleRangeDrag}
              onDragEnd={handleRangeDragEnd}
              sx={{
                p: 1.5,
                mb: 1,
                border: `1px solid ${THEME_COLORS.border}`,
                borderRadius: 1,
                cursor: draggingRangeId === range.id ? 'grabbing' : 'grab',
                opacity: draggingRangeId === range.id ? 0.5 : 1,
                backgroundColor:
                  selectedRangeId === range.id ? 'rgba(16, 185, 129, 0.08)' : THEME_COLORS.paper,
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  borderColor: THEME_COLORS.borderStrong,
                },
              }}
              onClick={() => handleSelectRangeNew(range.id || 0)}
            >
              <DragHandleIcon sx={{ mr: 1, opacity: 0.6, fontSize: 16 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {range.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {range.range_type} | {range.position}
              </Typography>
              <Typography variant="caption" color="text.disabled">
                {Object.keys(range.hands).length} mains
              </Typography>
            </Box>
          ))
        )}
      </Box>

      <Box sx={{ p: 1, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateRangeNew}
          size="small"
          color="primary"
          data-testid="new-range-button"
        >
          Nouvelle Range
        </Button>
      </Box>
    </Paper>
  );

  // Supprimer une range depuis l'aperçu
  const handleDeleteFromPreview = useCallback(
    async (range: Range) => {
      if (range.id && window.confirm('Êtes-vous sûr de vouloir supprimer cette range ?')) {
        await deleteRange(range.id);
        setSelectedRangeId(null);
        setSelectedRange(null);
        fetchRanges();
      }
    },
    [deleteRange, setSelectedRange, fetchRanges],
  );

  // Panneau droit (aperçu de la range)
  const RightPanel = () => {
    const displayRange = selectedRangeFromState || selectedRange;

    return (
      <Paper
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: THEME_COLORS.paperElevated,
        }}
      >
        {displayRange ? (
          <>
            <Box sx={{ p: 2, pb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {displayRange.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Modifier">
                    <IconButton size="small" onClick={() => handleOpenRange(displayRange.id || 0)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Exporter">
                    <IconButton size="small" onClick={() => handleOpenImportExport(displayRange)}>
                      <ImportExportIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Supprimer">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteFromPreview(displayRange)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Fermer">
                    <IconButton size="small" onClick={() => setSelectedRangeId(null)}>
                      <CloseIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <Box sx={{ mt: 1 }}>
                <Chip
                  label={displayRange.range_type}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
                <Chip
                  label={displayRange.position}
                  size="small"
                  variant="outlined"
                  color="secondary"
                  sx={{ ml: 1 }}
                />
                <Chip
                  label={`${Object.keys(displayRange.hands).length} mains`}
                  size="small"
                  variant="outlined"
                  sx={{ ml: 1 }}
                />
              </Box>
            </Box>

            <Box sx={{ px: 2, py: 1, borderBottom: `1px solid ${THEME_COLORS.border}` }}>
              {displayRange.description && (
                <Typography variant="body2" color="text.secondary">
                  {displayRange.description}
                </Typography>
              )}
            </Box>

            <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
              <Typography variant="subtitle2" gutterBottom>
                Grille de la Range
              </Typography>
              <RangeGrid
                grid={generateRangeGrid(displayRange.hands)}
                editable={false}
                cellSize={35}
              />
            </Box>
          </>
        ) : (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Sélectionnez une range pour voir ses détails
            </Typography>
          </Box>
        )}
      </Paper>
    );
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Chargement des ranges...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Barre d'outils */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1,
          gap: 1,
          backgroundColor: THEME_COLORS.paperElevated,
          borderBottom: `1px solid ${THEME_COLORS.border}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Gestion des Ranges
          </Typography>
          <Tooltip title="Actualiser">
            <IconButton size="small" onClick={() => fetchRanges()} disabled={loading}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Importer/Exporter">
            <Button
              variant="outlined"
              startIcon={<ImportExportIcon />}
              onClick={() => handleOpenImportExport()}
              size="small"
              color="inherit"
            >
              Importer/Exporter
            </Button>
          </Tooltip>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Mode Focus (Ctrl+M)">
            <IconButton size="small" onClick={() => setFocusMode(true)}>
              <FullscreenIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Paramètres">
            <IconButton size="small">
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Menu">
            <IconButton size="small">
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Contenu principal */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Ghost range element for drag visual feedback */}
        {ghostRange && isDragging && (
          <Box
            sx={{
              position: 'fixed',
              left: `${ghostRange.x}px`,
              top: `${ghostRange.y}px`,
              width: 280,
              height: 60,
              backgroundColor: THEME_COLORS.paper,
              border: `1px dashed ${THEME_COLORS.primary}`,
              borderRadius: 1,
              opacity: 0.7,
              pointerEvents: 'none',
              zIndex: 9999,
              boxShadow: `0 4px 12px rgba(0, 0, 0, 0.3)`,
              display: 'flex',
              alignItems: 'center',
              p: 1.5,
            }}
          >
            <DragHandleIcon sx={{ mr: 1, opacity: 0.6, fontSize: 16 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {backendRanges.find((r) => r.id === ghostRange.id)?.name || 'Range'}
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            flex: `0 0 ${panelSizes.left}px`,
            minWidth: 200,
            height: '100%',
            overflow: 'hidden',
          }}
        >
          <LeftPanel />
        </Box>

        <Box
          sx={{
            flex: `0 0 ${panelSizes.middle}px`,
            minWidth: 250,
            height: '100%',
            overflow: 'hidden',
            borderLeft: `1px solid ${THEME_COLORS.border}`,
            borderRight: `1px solid ${THEME_COLORS.border}`,
          }}
        >
          <MiddlePanel />
        </Box>

        <Box
          sx={{
            flex: 1,
            minWidth: 300,
            height: '100%',
            overflow: 'hidden',
          }}
        >
          <RightPanel />
        </Box>
      </Box>

      {/* Dialogue pour créer/modifier une range (compatibilité avec l'ancienne version) */}
      <Dialog open={openFormDialog} onClose={handleCloseFormDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingRange ? 'Modifier la Range' : 'Nouvelle Range'}</DialogTitle>
        <DialogContent>
          <RangeForm
            range={editingRange}
            onSubmit={editingRange ? handleUpdateRange : handleCreateRange}
            onCancel={handleCloseFormDialog}
            existingRangeNames={backendRanges.map((r) => r.name)}
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
