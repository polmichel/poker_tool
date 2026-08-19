import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Grid,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EuroIcon from '@mui/icons-material/Euro';
import { THEME_COLORS } from '../utils/constants';

interface DonationDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Dialogue de don pour soutenir le développeur.
 * Permet de choisir entre des montants prédéfinis (1€, 2€, 5€) ou un montant libre.
 */
export const DonationDialog: React.FC<DonationDialogProps> = ({ open, onClose }) => {
  const [selectedAmount, setSelectedAmount] = useState<string>('');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const predefinedAmounts = [
    { label: '1 €', value: '1' },
    { label: '2 €', value: '2' },
    { label: '5 €', value: '5' },
  ];

  const handleAmountSelect = (amount: string) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    // Accepter uniquement les nombres (entiers ou décimaux)
    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setCustomAmount(value);
      setSelectedAmount('');
    }
  };

  const getFinalAmount = (): number | null => {
    if (selectedAmount) {
      return parseFloat(selectedAmount);
    }
    if (customAmount) {
      return parseFloat(customAmount);
    }
    return null;
  };

  const handleSubmit = async () => {
    const amount = getFinalAmount();
    if (!amount || amount <= 0) {
      return;
    }

    setIsSubmitting(true);

    // TODO: Intégrer avec un vrai service de paiement (Stripe, PayPal, etc.)
    // Pour l'instant, on simule une redirection vers PayPal avec le montant

    // URL PayPal pour un paiement direct
    // Format: https://www.paypal.me/nomUtilisateur/montant
    // Ou utiliser l'API PayPal pour une intégration plus propre
    const paypalUrl = `https://www.paypal.me/polmichel/${amount}eur`;

    // Ouvrir dans un nouvel onglet
    window.open(paypalUrl, '_blank');

    setIsSubmitting(false);
    onClose();
  };

  const isValidAmount = (): boolean => {
    const amount = getFinalAmount();
    return amount !== null && amount > 0;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 4,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${THEME_COLORS.border}`,
          pb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EuroIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Soutenir le développeur
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ p: 0.5 }}>
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2 }}>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
          Merci pour votre soutien ! Choisissez un montant ou entrez un montant personnalisé.
        </Typography>

        {/* Montants prédéfinis */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {predefinedAmounts.map((item) => (
            <Grid item xs={4} key={item.value}>
              <Button
                fullWidth
                variant={selectedAmount === item.value ? 'contained' : 'outlined'}
                onClick={() => handleAmountSelect(item.value)}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  borderColor:
                    selectedAmount === item.value
                      ? THEME_COLORS.primary
                      : THEME_COLORS.borderStrong,
                  backgroundColor:
                    selectedAmount === item.value ? THEME_COLORS.primary : 'transparent',
                  color: selectedAmount === item.value ? '#fff' : THEME_COLORS.textPrimary,
                  '&:hover': {
                    borderColor: THEME_COLORS.primary,
                    backgroundColor:
                      selectedAmount === item.value
                        ? THEME_COLORS.primaryDark
                        : 'rgba(16,185,129,0.08)',
                  },
                }}
              >
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {item.label}
                </Typography>
              </Button>
            </Grid>
          ))}
        </Grid>

        {/* Montant personnalisé */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <EuroIcon sx={{ color: THEME_COLORS.textMuted, fontSize: 20 }} />
          <TextField
            fullWidth
            placeholder="Montant personnalisé"
            value={customAmount}
            onChange={handleCustomAmountChange}
            type="text"
            inputProps={{
              inputMode: 'decimal',
              pattern: '[0-9]*(.[0-9]*)?',
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: THEME_COLORS.paperElevated,
              },
            }}
          />
        </Box>

        {/* Affichage du montant sélectionné */}
        {isValidAmount() && (
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: 'rgba(16,185,129,0.12)',
              border: `1px solid ${THEME_COLORS.primary}33`,
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Montant sélectionné
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: THEME_COLORS.primaryLight }}>
              {getFinalAmount()} €
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          borderTop: `1px solid ${THEME_COLORS.border}`,
          pt: 2,
          pb: 2,
          px: 3,
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderColor: THEME_COLORS.borderStrong,
            color: THEME_COLORS.textSecondary,
            '&:hover': {
              borderColor: THEME_COLORS.primary,
              backgroundColor: 'rgba(16,185,129,0.08)',
            },
          }}
        >
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!isValidAmount() || isSubmitting}
          sx={{
            background: `linear-gradient(135deg, ${THEME_COLORS.primaryLight}, ${THEME_COLORS.primaryDark})`,
            boxShadow: `0 4px 12px -4px ${THEME_COLORS.primary}99`,
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: `0 6px 16px -6px ${THEME_COLORS.primary}cc`,
            },
            '&.Mui-disabled': {
              opacity: 0.5,
              background: 'rgba(16,185,129,0.3)',
            },
          }}
        >
          {isSubmitting ? 'Redirection...' : 'Faire un don'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DonationDialog;
