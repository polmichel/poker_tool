import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Typography, Button, IconButton, Tooltip, Chip, Paper } from '@mui/material';
import {
  Add as AddIcon,
  Folder as FolderIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useRanges } from '../hooks/useRanges';
import { THEME_COLORS } from '../utils/constants';
import { generateRangeGrid } from '../utils/helpers';
import { RangeGrid } from '../components';

interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  children: Folder[];
  rangeIds: number[];
}

const RangeManager: React.FC = () => {
  const navigate = useNavigate();
  const { ranges: backendRanges, loading, error, fetchRanges } = useRanges();
  
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedRangeId, setSelectedRangeId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [panelSizes] = useState({ left: 250, middle: 350, right: 500 });

  // Initialiser avec un dossier racine
  useEffect(() => {
    const rootFolder: Folder = {
      id: 'root',
      name: 'Toutes les Ranges',
      parentId: null,
      children: [],
      rangeIds: backendRanges.map(r => r.id || 0),
    };
    setFolders([rootFolder]);
    setSelectedFolderId('root');
  }, [backendRanges]);

  // Charger les ranges au montage
  useEffect(() => {
    fetchRanges();
  }, [fetchRanges]);

  // Obtenir le dossier sélectionné
  const selectedFolder = useMemo(() => {
    return folders.find(f => f.id === selectedFolderId) || null;
  }, [folders, selectedFolderId]);

  // Obtenir les ranges du dossier sélectionné
  const rangesInSelectedFolder = useMemo(() => {
    if (!selectedFolder) return [];
    return backendRanges.filter(r => selectedFolder.rangeIds.includes(r.id || 0));
  }, [selectedFolder, backendRanges]);

  // Obtenir la range sélectionnée
  const selectedRange = useMemo(() => {
    return backendRanges.find(r => r.id === selectedRangeId) || null;
  }, [backendRanges, selectedRangeId]);

  // Filtrer les ranges
  const filteredRanges = useMemo(() => {
    return rangesInSelectedFolder.filter(range => {
      const query = searchQuery.toLowerCase();
      return range.name.toLowerCase().includes(query) ||
        range.description?.toLowerCase().includes(query) ||
        range.position.toLowerCase().includes(query) ||
        range.range_type.toLowerCase().includes(query);
    });
  }, [rangesInSelectedFolder, searchQuery]);

  // Créer un nouveau dossier
  const handleCreateFolder = useCallback(() => {
    const name = prompt('Nom du nouveau dossier:', 'Nouveau Dossier');
    if (name) {
      const newFolder: Folder = {
        id: `folder_${Date.now()}`,
        name,
        parentId: selectedFolderId,
        children: [],
        rangeIds: [],
      };
      setFolders(prev => [...prev, newFolder]);
    }
  }, [selectedFolderId]);

  // Créer une nouvelle range
  const handleCreateRange = useCallback(() => {
    navigate('/ranges/new');
  }, [navigate]);

  // Sélectionner un dossier
  const handleSelectFolder = useCallback((folderId: string) => {
    setSelectedFolderId(folderId);
    setSelectedRangeId(null);
  }, []);

  // Sélectionner une range
  const handleSelectRange = useCallback((rangeId: number) => {
    setSelectedRangeId(rangeId);
  }, []);

  // Ouvrir une range dans l'éditeur
  const handleOpenRange = useCallback((rangeId: number) => {
    navigate(`/ranges/${rangeId}/edit`);
  }, [navigate]);

  // Rendu d'un dossier dans l'arbre
  const renderFolder = (folder: Folder, depth = 0) => (
    <Box key={folder.id} sx={{ pl: depth * 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 1,
          borderRadius: 1,
          cursor: 'pointer',
          backgroundColor: selectedFolderId === folder.id ? 'rgba(16, 185, 129, 0.14)' : 'transparent',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
          },
        }}
        onClick={() => handleSelectFolder(folder.id)}
      >
        <FolderIcon fontSize="small" />
        <Typography variant="body2">{folder.name}</Typography>
      </Box>
      {folder.children.map(child => renderFolder(child, depth + 1))}
    </Box>
  );

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
        {folders.filter(f => f.parentId === null).map(folder => renderFolder(folder))}
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
          filteredRanges.map(range => (
            <Box
              key={range.id}
              sx={{
                p: 1.5,
                mb: 1,
                border: `1px solid ${THEME_COLORS.border}`,
                borderRadius: 1,
                cursor: 'pointer',
                backgroundColor: selectedRangeId === range.id ? 'rgba(16, 185, 129, 0.08)' : THEME_COLORS.paper,
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  borderColor: THEME_COLORS.borderStrong,
                },
              }}
              onClick={() => handleSelectRange(range.id || 0)}
            >
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
          onClick={handleCreateRange}
          size="small"
          color="primary"
        >
          Nouvelle Range
        </Button>
      </Box>
    </Paper>
  );

  // Panneau droit (aperçu de la range)
  const RightPanel = () => (
    <Paper
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: THEME_COLORS.paperElevated,
      }}
    >
      {selectedRange ? (
        <>
          <Box sx={{ p: 2, pb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {selectedRange.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Modifier">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenRange(selectedRange.id || 0)}
                  >
                    <EditIcon />
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
              <Chip label={selectedRange.range_type} size="small" variant="outlined" color="primary" />
              <Chip label={selectedRange.position} size="small" variant="outlined" color="secondary" sx={{ ml: 1 }} />
              <Chip label={`${Object.keys(selectedRange.hands).length} mains`} size="small" variant="outlined" sx={{ ml: 1 }} />
            </Box>
          </Box>

          <Box sx={{ px: 2, py: 1, borderBottom: `1px solid ${THEME_COLORS.border}` }}>
            {selectedRange.description && (
              <Typography variant="body2" color="text.secondary">
                {selectedRange.description}
              </Typography>
            )}
          </Box>

          <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
            <Typography variant="subtitle2" gutterBottom>
              Grille de la Range
            </Typography>
            <RangeGrid
              grid={generateRangeGrid(selectedRange.hands)}
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
            Range Manager
          </Typography>
          <Tooltip title="Actualiser">
            <IconButton size="small" onClick={() => fetchRanges()} disabled={loading}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
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
    </Box>
  );
};

export default RangeManager;
