import { Box, Button, Container } from '@mui/material';
import { useEffect, useState } from 'react';
import withLayout from '../components/layout/withLayout';
import { auth } from '../config/firebase';
import { allowedUserEmails, isAdminUser } from './helpers';

export const redirect_uri = 'https://antoniwrobel.github.io/management-app/allegro-redirection-path';

const AllegroProtected = () => {
  const isMobile = window.innerWidth < 900;
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const client_id = process.env.REACT_APP_CLIENT_ID;
  const url = `https://allegro.pl/auth/oauth/authorize?response_type=code&client_id=${client_id}&redirect_uri=${redirect_uri}`;
  console.log({ url });
  const handleAuthorizeAllegro = () => {
    return (window.location.href = url);
  };

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if (user) {
        if (user.email) {
          if (isAdminUser(user)) {
            setHasError(false);
          }
          setFetched(true);
        }
      } else {
        console.error('No user detected');
        setFetched(true);
        setHasError(true);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return 'loading...';
  }

  if (hasError && fetched) {
    return <div>no access...</div>;
  }

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
        <Button onClick={handleAuthorizeAllegro}>Zaloguj do allegro</Button>
      </Container>
    </Box>
  );
};

export default withLayout(AllegroProtected);
