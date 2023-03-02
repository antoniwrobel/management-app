import Box from '@mui/material/Box';
import ModalMUI from '@mui/material/Modal';

import useMediaQuery from '@mui/material/useMediaQuery';

type ModalProps = {
  open: boolean;
  children: React.ReactElement;
  noPadding?: boolean;
  customWidth?: string;
};

const EditModal = (props: ModalProps) => {
  const { open, children, noPadding, customWidth } = props;
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
    p: noPadding ? 0 : '20px'
  };

  return (
    <ModalMUI open={open}>
      <Box sx={{ ...style, minWidth: customWidth ? customWidth : matches ? 'calc(100% - 40px)' : '500px' }}>
        <Box sx={{ mt: '20px' }}>{children}</Box>
      </Box>
    </ModalMUI>
  );
};

export default EditModal;
