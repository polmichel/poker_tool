import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Divider,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Download as DownloadIcon,
  ContentCopy as ContentCopyIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useRanges } from '../hooks';
import { RangeList } from '../components';

const ImportExport: React.FC = () => {
  const {
    ranges,
    loading,
    error,
    selectedRange,
    setSelectedRange,
    fetchRanges,
    importRange,
    exportRange,
  } = useRanges();

  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [format, setFormat] = useState<'json' | 'text' | 'csv'>('json');
  const [content, setContent] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // Changer d'onglet
  const handleTabChange = useCallback((
    event: React.SyntheticEvent,
    newValue: 'import' | 'export'
  ) => {
    setActiveTab(newValue);
    setImportError(null);
    setImportSuccess(null);
  }, []);

  // Changer de format
  const handleFormatChange = useCallback((
    event: React.SyntheticEvent,
    newValue: 'json' | 'text' | 'csv'
  ) => {
    setFormat(newValue);
  }, []);

  // Sélectionner une range
  const handleRangeSelect = useCallback((range: any) => {
    setSelectedRange(range);
  }, [setSelectedRange]);

  // Importer une range
  const handleImport = useCallback(async () => {
    if (!content.trim()) {
      setImportError('Veuillez entrer du contenu à importer.');
      return;
    }

    try {
      await importRange(content, format);
      setImportSuccess('Range importée avec succès !');
      setImportError(null);
      setContent('');
      fetchRanges();
    } catch (err) {
      setImportError('Erreur lors de l\'import. Vérifiez le format du contenu.');
      setImportSuccess(null);
    }
  }, [content, format, importRange, fetchRanges]);

  // Exporter une range
  const handleExport = useCallback(async () => {
    if (!selectedRange) {
      setImportError('Veuillez sélectionner une range à exporter.');
      return;
    }

    try {
      const result = await exportRange(selectedRange.id!, format);
      if (result) {
        // Télécharger le fichier
        let contentToDownload: string;
        let mimeType: string;
        let fileExtension: string;

        if (format === 'json') {
          contentToDownload = JSON.stringify(result, null, 2);
          mimeType = 'application/json';
          fileExtension = 'json';
        } else if (format === 'text') {
          contentToDownload = result.text || JSON.stringify(result);
          mimeType = 'text/plain';
          fileExtension = 'txt';
        } else {
          contentToDownload = result.csv || JSON.stringify(result);
          mimeType = 'text/csv';
          fileExtension = 'csv';
        }

        const blob = new Blob([contentToDownload], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedRange.name.replace(/\s+/g, '_')}.${fileExtension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setImportSuccess('Range exportée avec succès !');
        setImportError(null);
      }
    } catch (err) {
      setImportError('Erreur lors de l\'export.');
      setImportSuccess(null);
    }
  }, [selectedRange, format, exportRange]);

  // Copier dans le presse-papiers
  const handleCopyToClipboard = useCallback(async () => {
    if (!selectedRange) {
      setImportError('Veuillez sélectionner une range.');
      return;
    }

    try {
      const result = await exportRange(selectedRange.id!, format);
      if (result) {
        let contentToCopy: string;

        if (format === 'json') {
          contentToCopy = JSON.stringify(result, null, 2);
        } else if (format === 'text') {
          contentToCopy = result.text || JSON.stringify(result);
        } else {
          contentToCopy = result.csv || JSON.stringify(result);
        }

        await navigator.clipboard.writeText(contentToCopy);
        setImportSuccess('Range copiée dans le presse-papiers !');
        setImportError(null);
      }
    } catch (err) {
      setImportError('Erreur lors de la copie dans le presse-papiers.');
      setImportSuccess(null);
    }
  }, [selectedRange, format, exportRange]);

  // Exemples de contenu pour chaque format
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
    "AKs": "open",
    "AQs": "open"
  }
}`;
      case 'text':
        return `AA: open
KK: open
AKs: open
AQs: open
JJ: raise`;
      case 'csv':
        return `hand,action
AA,open
KK,open
AKs,open
AQs,open
JJ,raise`;
      default:
        return '';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Importer/Exporter
        </Typography>
      </Box>

      {/* Onglets Import/Export */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab label="Importer" value="import" />
          <Tab label="Exporter" value="export" />
        </Tabs>
      </Paper>

      {/* Messages d'erreur et de succès */}
      {importError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setImportError(null)}>
          {importError}
        </Alert>
      )}
      {importSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setImportSuccess(null)}>
          {importSuccess}
        </Alert>
      )}

      {/* Contenu */}
      <Grid container spacing={3}>
        {/* Onglet Import */}
        {activeTab === 'import' && (
          <>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Importer une Range
                </Typography>
                
                <Divider sx={{ my: 2 }} />

                {/* Sélection du format */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Format
                  </Typography>
                  <Paper sx={{ p: 1 }}>
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
                </Box>

                {/* Zone de texte pour le contenu */}
                <TextField
                  multiline
                  rows={15}
                  fullWidth
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={getExampleContent()}
                  variant="outlined"
                  size="small"
                  label="Contenu à importer"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title="Coller depuis le presse-papiers">
                          <IconButton
                            onClick={async () => {
                              try {
                                const clipboardContent = await navigator.clipboard.readText();
                                setContent(clipboardContent);
                              } catch (err) {
                                setImportError('Impossible de lire le presse-papiers');
                              }
                            }}
                          >
                            <ContentCopyIcon />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Bouton d'import */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<UploadIcon />}
                    onClick={handleImport}
                    disabled={!content.trim()}
                    color="primary"
                  >
                    Importer
                  </Button>
                </Box>

                {/* Exemple de format */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Exemple de format {format} :
                  </Typography>
                  <Paper sx={{ p: 1, mt: 1, backgroundColor: 'background.paper', fontFamily: 'monospace' }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                      {getExampleContent()}
                    </pre>
                  </Paper>
                </Box>
              </Paper>
            </Grid>

            {/* Instructions */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Instructions
                </Typography>
                
                <Divider sx={{ my: 2 }} />

                <Typography variant="body1" paragraph>
                  <strong>Importer une range</strong> vous permet d'ajouter une range existante 
                  depuis un fichier ou du texte copié.
                </Typography>

                <Typography variant="body2" paragraph>
                  <strong>Formats supportés :</strong>
                </Typography>

                <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                  <Typography component="li" variant="body2">
                    <strong>JSON</strong> : Format structuré avec toutes les informations de la range.
                  </Typography>
                  <Typography component="li" variant="body2">
                    <strong>Texte</strong> : Une main par ligne au format "main:action" (ex: "AA:open").
                  </Typography>
                  <Typography component="li" variant="body2">
                    <strong>CSV</strong> : Format tableau avec en-tête "hand,action".
                  </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary">
                  Vous pouvez importer des ranges depuis d'autres outils comme Equilab ou PokerStove 
                  en adaptant le format.
                </Typography>
              </Paper>
            </Grid>
          </>
        )}

        {/* Onglet Export */}
        {activeTab === 'export' && (
          <>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Exporter une Range
                </Typography>
                
                <Divider sx={{ my: 2 }} />

                {/* Sélection du format */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Format
                  </Typography>
                  <Paper sx={{ p: 1 }}>
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
                </Box>

                {/* Sélection de la range */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Sélectionner une Range
                  </Typography>
                  <RangeList
                    ranges={ranges}
                    onSelectRange={handleRangeSelect}
                    selectedRangeId={selectedRange?.id || null}
                  />
                </Box>

                {/* Boutons d'export */}
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Tooltip title="Copier dans le presse-papiers">
                    <Button
                      variant="outlined"
                      startIcon={<ContentCopyIcon />}
                      onClick={handleCopyToClipboard}
                      disabled={!selectedRange}
                    >
                      Copier
                    </Button>
                  </Tooltip>
                  
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={handleExport}
                    disabled={!selectedRange}
                    color="primary"
                  >
                    Télécharger
                  </Button>
                </Box>

                {/* Aperçu */}
                {selectedRange && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Aperçu de la range :
                    </Typography>
                    <Paper sx={{ p: 1, backgroundColor: 'background.paper' }}>
                      <Typography variant="caption" color="text.secondary">
                        Nom: {selectedRange.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Mains: {Object.keys(selectedRange.hands).length}
                      </Typography>
                    </Paper>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Instructions */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Instructions
                </Typography>
                
                <Divider sx={{ my: 2 }} />

                <Typography variant="body1" paragraph>
                  <strong>Exporter une range</strong> vous permet de sauvegarder une range 
                  dans différents formats pour une utilisation ultérieure ou pour la partager.
                </Typography>

                <Typography variant="body2" paragraph>
                  <strong>Options disponibles :</strong>
                </Typography>

                <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                  <Typography component="li" variant="body2">
                    <strong>Télécharger</strong> : Enregistre la range dans un fichier sur votre appareil.
                  </Typography>
                  <Typography component="li" variant="body2">
                    <strong>Copier</strong> : Copie la range dans le presse-papiers pour la coller ailleurs.
                  </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary">
                  Les ranges exportées peuvent être réimportées plus tard ou partagées avec d'autres 
                  utilisateurs de Poker Tool.
                </Typography>
              </Paper>
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
};

export default ImportExport;
