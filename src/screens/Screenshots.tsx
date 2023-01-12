import Center from '../components/utils/Center';
import withLayout from '../components/layout/withLayout';
import Container from '@mui/material/Container';

import { useEffect, useState } from 'react';
import { Box } from '@mui/material';

import { getStorage, ref, listAll, getDownloadURL } from 'firebase/storage';

const Screenshots = () => {
  const storage = getStorage();
  const screenshotsRef = ref(storage, 'screenshots');

  const [items, setItems] = useState([]) as any;

  const getData = async () => {
    const d = [] as any;

    const response = await listAll(screenshotsRef);

    response.items.forEach((item) => {
      const url = getDownloadURL(item);
      d.push(url);
    });

    const temp = await Promise.all(d);
    setItems(() => temp.reverse());
  };

  useEffect(() => {
    getData();
  }, []);

  return (
    <Container sx={{ p: '0px !important', m: '24px', maxWidth: '100% !important', width: 'auto' }}>
      <Center>
        {items.length ? (
          <Box sx={{ width: '100%' }}>
            {items.map((details: any) => {
              return (
                <Box key={details}>
                  <Box
                    sx={{
                      display: 'flex',
                      width: '100%',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#dedede',
                      p: '20px 20px 40px 20px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <img src={details} alt="screen" />
                  </Box>
                </Box>
              );
            })}
          </Box>
        ) : (
          <Box sx={{ my: '40px' }}>Brak danych</Box>
        )}
      </Center>
    </Container>
  );
};

export default withLayout(Screenshots);
