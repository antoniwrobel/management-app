import { Box, Container } from '@mui/material';
import { useEffect, useState } from 'react';
import AllegroDetails from './AllegroDetails';

export const Allegro = () => {
  const [code, setCode] = useState<null | string>();
  const isMobile = window.innerWidth < 900;
  const [success, setSuccess] = useState(false);

  const handleUserAuth = async (code: string) => {
    try {
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');

    if (code) {
      setCode(code);
    }
  }, [code]);

  useEffect(() => {
    if (code) {
      handleUserAuth(code);
    }
  }, [code]);

  return (
    <>
      {success ? (
        <div>{AllegroDetails}</div>
      ) : (
        <Box
          display={'flex'}
          alignItems={'center'}
          flexDirection={'column'}
          boxShadow={2}
          margin={3}
          overflow={isMobile ? 'scroll' : 'initial'}
        >
          <Container sx={{ p: '0px !important', m: '24px', maxWidth: '100% !important', width: 'auto' }}>
            loading...
          </Container>
        </Box>
      )}
    </>
  );
};
