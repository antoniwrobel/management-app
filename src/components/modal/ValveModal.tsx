import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ModalMUI from '@mui/material/Modal';

import useMediaQuery from '@mui/material/useMediaQuery';

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

type ModalProps = {
  open: boolean;
  children: React.ReactElement;
};

const ValveModal = (props: ModalProps) => {
  const { open, children } = props;
  const matches = useMediaQuery('(max-width:500px)');

  return (
    <ModalMUI open={open}>
      <Box sx={{ ...style, minWidth: matches ? 'calc(100% - 40px)' : '500px' }}>
        <Box sx={{ mt: '20px' }}>{children}</Box>
      </Box>
    </ModalMUI>
  );
};

export default ValveModal;
