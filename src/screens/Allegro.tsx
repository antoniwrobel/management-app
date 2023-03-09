import { Box, Container } from '@mui/material';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../components/auth/auth-service';
import { redirect_uri } from './AllegroProtected';
import { useLocalStorage } from './helpers';
import { Buffer } from 'buffer';

export const Allegro = () => {
  const [code, setCode] = useState<null | string>();
  const isMobile = window.innerWidth < 900;

  const [t, setAccessToken] = useLocalStorage(ACCESS_TOKEN_KEY, '');
  const [r, setRefreshToken] = useLocalStorage(REFRESH_TOKEN_KEY, '');
  const [success, setSuccess] = useState(false);

  const handleUserAuth = async (code: string) => {
    try {
      const response = await axios.post(
        `https://2ta3wp37hnekkkfoyffzylutxi0gmuvn.lambda-url.us-east-1.on.aws/?code=${code}`
      );

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
