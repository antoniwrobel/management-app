import { Box, Button, Typography, useMediaQuery } from '@mui/material';
import ModalMUI from '@mui/material/Modal';

type ConfirmationModalProps = {
  open: boolean;
  handleConfirm: () => void;
  handleReject: () => void;
};

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: 'background.paper',
  borderRadius: 2,
  boxShadow: 24,
  boxSizing: 'border-box',
  p: '20px'
};

export const ConfirmationModal = (props: ConfirmationModalProps) => {
  const matches = useMediaQuery('(max-width:500px)');
  const { open, handleConfirm, handleReject } = props;

  return (
    <ModalMUI open={open}>
      <Box sx={{ ...style, minWidth: matches ? 'calc(100% - 40px)' : '200px' }}>
        <Box sx={{ m: '10px' }}>
          <Typography>Czy na pewno chcesz wykonać akcję?</Typography>
          <Box sx={{ display: 'flex', mt: '10px' }}>
            <Button variant="contained" size="small" color="error" sx={{ mr: '20px' }} onClick={handleConfirm}>
              Wykonaj
            </Button>

            <Button variant="contained" size="small" onClick={handleReject}>
              Wróć
            </Button>
          </Box>
        </Box>
      </Box>
    </ModalMUI>
  );
};
