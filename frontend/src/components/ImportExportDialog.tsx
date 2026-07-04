import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Paper,
  Tabs,
  Tab,
  Box,
  Alert,
} from '@mui/material';
import { Range } from '../types';

interface ImportExportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (content: string, format: 'json' | 'text' | 'csv') => void;
  onExport: (range: Range, format: 'json' | 'text' | 'csv') => void;
  rangeToExport?: Range | null;
}

const ImportExportDialog: React.FC<ImportExportDialogProps> = ({
  open,
  onClose,
  onImport,
  onExport,
  rangeToExport,
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [format, setFormat] = useState<'json' | 'text' | 'csv'>('json');
  const [content, setContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleTabChange = useCallback((
    event: React.SyntheticEvent,
    newValue: 'import' | 'export'
  ) => {
    setActiveTab(newValue);
    setError(null);
  }, []);

  const handleFormatChange = useCallback((
    event: React.SyntheticEvent,
    newValue: 'json' | 'text' | 'csv'
  ) => {
    setFormat(newValue);
  }, []);

  const handleImport = useCallback(() => {
    if (!content.trim()) {
      setError('Veuillez entrer du contenu à importer.');
      return;
    }
    
    try {
      onImport(content, format);
      onClose();
    } catch (err) {
      setError('Erreur lors de l\'import. Vérifiez le format du contenu.');
    }
  }, [content, format, onImport, onClose]);

  const handleExport = useCallback(() => {
    if (!rangeToExport) {
      setError('Aucune range sélectionnée pour l\'export.');
      return;
    }
    
    onExport(rangeToExport, format);
    onClose();
  }, [rangeToExport, format, onExport, onClose]);

  const handleClose = useCallback(() => {
    setContent('');
    setError(null);
    onClose();
  }, [onClose]);

  // Exemple de contenu pour chaque format
  const getExampleContent = (): string => {
    switch (format) {
      case 'json':
        return `{
  "name": "Ma Range",
  "description": "Range d'ouverture depuis UTG",
  "range_type": "preflop",
  "position": "UTG",
  "hands": {
    "AA": "open",
    "KK": "open",
    "AKs": "open"
  }
}`;
      case 'text':
        return `AA: open
KK: open
AKs: open
QQ: raise`;
      case 'csv':
        return `hand,action
AA,open
KK,open
AKs,open
QQ,raise`;
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {activeTab === 'import' ? 'Importer une Range' : 'Exporter une Range'}
      </DialogTitle>

      <DialogContent>
        {/* Onglets Import/Export */}
        <Paper sx={{ mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            centered
          >
            <Tab label="Importer" value="import" />
            <Tab label="Exporter" value="export" />
          </Tabs>
        </Paper>

        {/* Sélection du format */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Format
          </Typography>
          <Tabs
            value={format}
            onChange={handleFormatChange}
            variant="fullWidth"
          >
            <Tab label="JSON" value="json" />
            <Tab label="Texte" value="text" />
            <Tab label="CSV" value="csv" />
          </Tabs>
        </Paper>

        {/* Contenu */}
        {activeTab === 'import' ? (
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Collez le contenu à importer ci-dessous :
            </Typography>
            <TextField
              multiline
              rows={10}
              fullWidth
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={getExampleContent()}
              variant="outlined"
              size="small"
              error={!!error}
              helperText={error}
            />
            <Typography variant="caption" color="text.disabled" sx={{ mt: 1 }}>
              Exemple de format : {format}
            </Typography>
          </Box>
        ) : (
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {rangeToExport ? (
                <>
                  Vous allez exporter la range : <strong>{rangeToExport.name}</strong>
                  <br />
                  Format sélectionné : <strong>{format.toUpperCase()}</strong>
                </>
              ) : (
                'Aucune range sélectionnée pour l\'export.'
              )}
            </Typography>
            {rangeToExport && (
              <Paper sx={{ p: 2, mt: 2, backgroundColor: 'background.paper' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Aperçu des données :
                </Typography>
                <Typography variant="body2" fontFamily="monospace">
                  {Object.keys(rangeToExport.hands).length} mains dans cette range
                </Typography>
              </Paper>
            )}
          </Box>
        )}

        {/* Message d'erreur */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Annuler
        </Button>
        {activeTab === 'import' ? (
          <Button
            onClick={handleImport}
            color="primary"
            variant="contained"
            disabled={!content.trim()}
          >
            Importer
          </Button>
        ) : (
          <Button
            onClick={handleExport}
            color="primary"
            variant="contained"
            disabled={!rangeToExport}
          >
            Exporter
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ImportExportDialog;
