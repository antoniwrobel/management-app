import routes from './config/routes';
import Center from './components/utils/Center';
import AuthChecker from './components/auth/AuthChecker';

import { useEffect, useRef, useState } from 'react';
import { Box, Button, CircularProgress } from '@mui/material';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { auth } from './config/firebase';
import { allowedUserEmails } from './screens/helpers';

function App() {
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if (user) {
        if (user.email) {
          if (!allowedUserEmails.includes(user.email)) {
            setHasError(true);
            setLoading(false);
          }
        }
      } else {
        console.info('No user detected');
      }

      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <Center height="100vh">
        <CircularProgress />
      </Center>
    );
  }

  if (hasError) {
    return <Center height="100vh">no access</Center>;
  }

  return (
    <div>
      <BrowserRouter basename={process.env.PUBLIC_URL}>
        <Routes>
          {routes.map((route, index) => (
            <Route
              key={index}
              path={route.path}
              element={
                route.isProtected ? (
                  <AuthChecker>
                    <route.component />
                  </AuthChecker>
                ) : (
                  <route.component />
                )
              }
            />
          ))}
          <Route
            path="*"
            element={
              <Center height="100vh">
                <Box>page not found</Box>
                <Box sx={{ mt: '20px' }}>
                  <Button variant="contained" size="small">
                    <a
                      href="https://antoniwrobel.github.io/management-app/"
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      Powrót
                    </a>
                  </Button>
                </Box>
              </Center>
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
