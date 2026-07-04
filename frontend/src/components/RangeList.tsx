import React, { useState, useCallback } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Paper,
  Divider,
  Chip,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Add as AddIcon,
  ContentCopy as ContentCopyIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { Range, RangeType, Position, ActionType } from '../types';
import { RANGE_TYPES, POSITIONS, ACTION_LABELS, ACTION_COLORS } from '../utils/constants';
import { getActionLabel } from '../utils/helpers';

interface RangeListProps {
  ranges: Range[];
  onSelectRange: (range: Range) => void;
  onEditRange?: (range: Range) => void;
  onDeleteRange?: (rangeId: number) => void;
  onDuplicateRange?: (range: Range) => void;
  selectedRangeId?: number | null;
}

const RangeList: React.FC<RangeListProps> = ({
  ranges,
  onSelectRange,
  onEditRange,
  onDeleteRange,
  onDuplicateRange,
  selectedRangeId,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedRangeForMenu, setSelectedRangeForMenu] = useState<Range | null>(null);

  const handleMenuOpen = useCallback((
    event: React.MouseEvent<HTMLElement>,
    range: Range
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedRangeForMenu(range);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setSelectedRangeForMenu(null);
  }, []);

  const handleEdit = useCallback(() => {
    if (selectedRangeForMenu) {
      onEditRange && onEditRange(selectedRangeForMenu);
      handleMenuClose();
    }
  }, [selectedRangeForMenu, onEditRange, handleMenuClose]);

  const handleDelete = useCallback(() => {
    if (selectedRangeForMenu) {
      onDeleteRange && selectedRangeForMenu.id && onDeleteRange(selectedRangeForMenu.id);
      handleMenuClose();
    }
  }, [selectedRangeForMenu, onDeleteRange, handleMenuClose]);

  const handleDuplicate = useCallback(() => {
    if (selectedRangeForMenu && onDuplicateRange) {
      onDuplicateRange(selectedRangeForMenu);
      handleMenuClose();
    }
  }, [selectedRangeForMenu, onDuplicateRange, handleMenuClose]);

  // Filtrer les ranges en fonction de la recherche
  const filteredRanges = ranges.filter((range) => {
    const query = searchQuery.toLowerCase();
    return (
      range.name.toLowerCase().includes(query) ||
      range.description.toLowerCase().includes(query) ||
      range.range_type.toLowerCase().includes(query) ||
      range.position.toLowerCase().includes(query)
    );
  });

  // Obtenir le label pour un type de range
  const getRangeTypeLabel = (type: RangeType): string => {
    const found = RANGE_TYPES.find((t) => t.value === type);
    return found ? found.label : type;
  };

  // Obtenir le label pour une position
  const getPositionLabel = (position: Position): string => {
    const found = POSITIONS.find((p) => p.value === position);
    return found ? found.label : position;
  };

  // Compter le nombre de mains par action dans une range
  const countHandsByAction = (range: Range): Record<string, number> => {
    const counts: Record<string, number> = {};
    for (const action of Object.values(range.hands)) {
      counts[action] = (counts[action] || 0) + 1;
    }
    return counts;
  };

  return (
    <Paper sx={{ p: 2 }}>
      {/* Barre de recherche */}
      <TextField
        fullWidth
        placeholder="Rechercher une range..."
        variant="outlined"
        size="small"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />

      {/* Liste des ranges */}
      <List dense>
        {filteredRanges.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
            Aucune range trouvée.
          </Typography>
        ) : (
          filteredRanges.map((range) => {
            const handCounts = countHandsByAction(range);
            const totalHands = Object.keys(range.hands).length;
            
            return (
              <React.Fragment key={range.id}>
                <ListItem
                  disablePadding
                  secondaryAction={
                    <>
                      <IconButton
                        edge="end"
                        aria-label="options"
                        onClick={(e) => handleMenuOpen(e, range)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                      
                      {/* Menu des options */}
                      <Menu
                        anchorEl={anchorEl}
                        open={anchorEl !== null && selectedRangeForMenu?.id === range.id}
                        onClose={handleMenuClose}
                        PaperProps={{
                          style: {
                            maxHeight: 200,
                            width: 200,
                          },
                        }}
                      >
                        <MenuItem onClick={() => onSelectRange(range)}>
                          <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
                          Voir
                        </MenuItem>
                        <MenuItem onClick={handleEdit}>
                          <EditIcon fontSize="small" sx={{ mr: 1 }} />
                          Modifier
                        </MenuItem>
                        {onDuplicateRange && (
                          <MenuItem onClick={handleDuplicate}>
                            <ContentCopyIcon fontSize="small" sx={{ mr: 1 }} />
                            Dupliquer
                          </MenuItem>
                        )}
                        <MenuItem onClick={handleDelete} color="error">
                          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                          Supprimer
                        </MenuItem>
                      </Menu>
                    </>
                  }
                >
                  <ListItemButton
                    selected={selectedRangeId === range.id}
                    onClick={() => onSelectRange(range)}
                    sx={{
                      borderRadius: 1,
                      '&.Mui-selected': {
                        backgroundColor: 'action.selected',
                      },
                    }}
                  >
                    <ListItemText
                      primary={range.name}
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                          >
                            {getRangeTypeLabel(range.range_type)} • {getPositionLabel(range.position)}
                          </Typography>
                          {range.description && (
                            <>
                              <br />
                              <Typography
                                component="span"
                                variant="caption"
                                color="text.disabled"
                              >
                                {range.description}
                              </Typography>
                            </>
                          )}
                        </>
                      }
                    />
                    
                    {/* Statistiques de la range */}
                    <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
                      <Chip
                        label={totalHands}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                      {Object.entries(handCounts).map(([action, count]) => (
                        <Chip
                          key={action}
                          label={`${count}`}
                          size="small"
                          sx={{
                            backgroundColor: action === 'undefined' 
                              ? 'grey.500' 
                              : ACTION_LABELS[action as keyof typeof ACTION_LABELS] 
                                ? ACTION_LABELS[action as keyof typeof ACTION_LABELS] === 'Non défini' 
                                  ? 'grey.500' 
                                  : 'transparent'
                              : 'transparent',
                            color: action === 'undefined' 
                              ? 'white' 
                              : ACTION_LABELS[action as keyof typeof ACTION_LABELS] 
                                ? ACTION_LABELS[action as keyof typeof ACTION_LABELS] === 'Non défini' 
                                  ? 'white' 
                                  : ACTION_COLORS[action as ActionType]
                              : ACTION_COLORS[action as ActionType],
                            borderColor: ACTION_COLORS[action as ActionType],
                          }}
                        />
                      ))}
                    </Box>
                  </ListItemButton>
                </ListItem>
                <Divider />
              </React.Fragment>
            );
          })
        )}
      </List>
    </Paper>
  );
};

export default RangeList;
