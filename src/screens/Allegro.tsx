import { Box, Container } from '@mui/material';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../components/auth/auth-service';
import { useLocalStorage } from './helpers';

export const Allegro = () => {
  const [code, setCode] = useState<null | string>();
  const isMobile = window.innerWidth < 900;

  const [, setAccessToken] = useLocalStorage(ACCESS_TOKEN_KEY, null);
  const [, setRefreshToken] = useLocalStorage(REFRESH_TOKEN_KEY, null);
  const [success, setSuccess] = useState(false);

  const handleUserAuth = async (code: string) => {
    try {
      const response = await axios.post(`https://mbwc7ee4iy7pej7xz4pg5cqtxa0iyfky.lambda-url.us-east-2.on.aws/`, {
        code
      });

      console.log({ response });

      if (response.status === 200) {
        setAccessToken(response.data.access_token);
        setRefreshToken(response.data.refresh_token);
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
    <Box
      display={'flex'}
      alignItems={'center'}
      flexDirection={'column'}
      boxShadow={2}
      margin={3}
      overflow={isMobile ? 'scroll' : 'initial'}
    >
      <Container sx={{ p: '0px !important', m: '24px', maxWidth: '100% !important', width: 'auto' }}>
        Allegro redirection page
        {success ? ' Poprawnie zapisano tokeny' : ' Brak tokenów'}
      </Container>
    </Box>
  );
};