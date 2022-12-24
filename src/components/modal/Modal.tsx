import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ModalMUI from '@mui/material/Modal';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: 'background.paper',
  borderRadius: 2,
  boxShadow: 24,
  minWidth: '700px',
  p: '20px'
};

type ModalProps = {
  open: boolean;
  children: React.ReactElement;
};

const Modal = (props: ModalProps) => {
  const { open, children } = props;

  return (
    <ModalMUI open={open}>
      <Box sx={style}>
        <Typography id="modal-modal-title" variant="h6" component="h2">
          Dodaj pozycję
        </Typography>
        <Box sx={{ mt: '20px' }}>{children}</Box>
      </Box>
    </ModalMUI>
  );
};

export default Modal;
