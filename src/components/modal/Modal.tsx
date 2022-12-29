import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ModalMUI from '@mui/material/Modal';

import useMediaQuery from '@mui/material/useMediaQuery';

type ModalProps = {
  open: boolean;
  children: React.ReactElement;
};

const Modal = (props: ModalProps) => {
  const { open, children } = props;
  const matches = useMediaQuery('(max-width:500px)');

  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: 'background.paper',
    borderRadius: 2,
    boxShadow: 24,
    boxSizing: 'border-box',
    p: '20px',
    overflowY: 'auto',
    height: matches ? 'calc(100% - 100px)' : 'auto',
    maxHeight: '700px',
    display: 'block'
  };

  return (
    <ModalMUI open={open}>
      <Box sx={{ ...style, minWidth: matches ? 'calc(100% - 40px)' : '500px' }}>
        <Typography id="modal-modal-title" variant="h6" component="h2">
          Dodaj pozycję
        </Typography>
        <Box sx={{ mt: '20px' }}>{children}</Box>
      </Box>
    </ModalMUI>
  );
};

export default Modal;
