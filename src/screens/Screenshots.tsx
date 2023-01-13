import Center from '../components/utils/Center';
import withLayout from '../components/layout/withLayout';
import Container from '@mui/material/Container';

import { useEffect, useState } from 'react';
import { Box } from '@mui/material';

import { getStorage, ref, listAll, getDownloadURL } from 'firebase/storage';

import PQueue from 'p-queue';

const Screenshots = () => {
  const storage = getStorage();
  const screenshotsRef1 = ref(storage, 'screenshots/magazyn');
  const screenshotsRef2 = ref(storage, 'screenshots/rozliczenia');
  const screenshotsRef3 = ref(storage, 'screenshots/skarbonka');
  const screenshotsRef4 = ref(storage, 'screenshots/wydatki');

  const [items, setItems] = useState({ magazyn: [], rozliczenia: [], skarbonka: [], wydatki: [] }) as any;
  const [loading, setLoading] = useState(false);

  const queue = new PQueue({ concurrency: 1 });

  const getData = () => {
    setLoading(true);

    const promiseArray = [
      () => listAll(screenshotsRef1),
      () => listAll(screenshotsRef2),
      () => listAll(screenshotsRef3),
      () => listAll(screenshotsRef4)
    ];

    const response = queue.addAll(promiseArray);
    const temp = {} as any;

    response.then(async (res) => {
      const items = {
        magazyn: [],
        rozliczenia: [],
        skarbonka: [],
        wydatki: []
      } as any;

      const r = await Promise.all(
        res.map((folder, index) => {
          const variant = index === 0 ? 'magazyn' : index === 1 ? 'rozliczenia' : index === 2 ? 'skarbonka' : 'wydatki';

          const links = folder.items.map((item) => {
            const url = getDownloadURL(item);
            return url;
          });

          return {
            [variant]: Promise.all(links)
          };
        })
      );

      console.log(r);
    });

    // console.log({ data });
  };

  useEffect(() => {
    getData();
  }, []);

  if (loading) {
    return <div>loading...</div>;
  }

  return (
    <Container sx={{ p: '0px !important', m: '24px', maxWidth: '100% !important', width: 'auto' }}>
      <Center>
        {!loading &&
          Object.keys(items).map((tabKey) => {
            const item = items[tabKey];

            return item.length ? (
              <Box sx={{ width: '100%' }} key={tabKey}>
                {item.map((url: any, id: any) => {
                  if (typeof url !== 'string') {
                    return;
                  }

                  return (
                    <Box key={tabKey + id}>
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
                      ></Box>
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Box sx={{ my: '40px' }} key={tabKey}>
                Brak danych
              </Box>
            );
          })}
      </Center>
    </Container>
  );
};

export default withLayout(Screenshots);
