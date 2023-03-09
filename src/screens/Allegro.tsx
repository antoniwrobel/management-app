import { Box, Container } from '@mui/material';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../components/auth/auth-service';
import { useLocalStorage } from './helpers';
import AllegroDetails from './AllegroDetails';

export const Allegro = () => {
  const [code, setCode] = useState<null | string>();
  const isMobile = window.innerWidth < 900;
  const [success, setSuccess] = useState(false);

  const handleUserAuth = async (code: string) => {
    try {
      const response = await axios.post(
        `https://4czt77qfqr6fxpvaemk4vu5e4m0hkeyq.lambda-url.us-east-1.on.aws/?code=${code}`
      );

      if (response.status === 200) {
        window.localStorage.setItem('access_token', response.data.access_token);
        window.localStorage.setItem('refresh_token', response.data.refresh_token);
        setSuccess(true);
      }
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
