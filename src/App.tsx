import routes from './config/routes';
import Center from './components/utils/Center';
import AuthChecker from './components/auth/AuthChecker';

import { useEffect, useState } from 'react';
import { Box, Button, CircularProgress } from '@mui/material';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { auth } from './config/firebase';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if (user) {
        console.info('User detected.');
      } else {
        console.info('No user detected');
      }
      setLoading(false);
    });
  }, []);

  if (loading)
    return (
      <Center height="100vh">
        <CircularProgress />
      </Center>
    );

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
