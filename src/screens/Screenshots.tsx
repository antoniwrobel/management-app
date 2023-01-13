import Center from '../components/utils/Center';
import withLayout from '../components/layout/withLayout';
import Container from '@mui/material/Container';

import { useEffect, useState } from 'react';
import { Box } from '@mui/material';

import { getStorage, ref, listAll, getDownloadURL } from 'firebase/storage';

import PQueue from 'p-queue';

const a = {} as any;

const Screenshots = () => {
  const storage = getStorage();
  const screenshotsRef = ref(storage, 'screenshots');
  const screenshotsRef1 = ref(storage, 'screenshots/magazyn');
  const screenshotsRef2 = ref(storage, 'screenshots/rozliczenia');
  const screenshotsRef3 = ref(storage, 'screenshots/skarbonka');
  const screenshotsRef4 = ref(storage, 'screenshots/wydatki');

  // const [items, setItems] = useState({ magazyn: [], rozliczenia: [], skarbonka: [], wydatki: [] }) as any;
  const [items, setItems] = useState([]) as any;
  const [loading, setLoading] = useState(false);

  const queue = new PQueue({ concurrency: 1 });

  const getData = async () => {
    setLoading(true);

    const promiseArray = [
      () => listAll(screenshotsRef1),
      () => listAll(screenshotsRef2),
      () => listAll(screenshotsRef3),
      () => listAll(screenshotsRef4)
    ];

    const response = await queue.addAll(promiseArray);

    const items = {
      magazyn: [],
      rozliczenia: [],
      skarbonka: [],
      wydatki: []
    } as any;

    const folder = response.map(async (folder, index) => {
      const urlPromiseArray = folder.items.map((item) => {
        return () => getDownloadURL(item);
      });

      const result = await queue.addAll(urlPromiseArray);
      return result.reverse();
    });

    const folderPromise = await Promise.all(folder);

    return folderPromise;
  };

  useEffect(() => {
    (async () => {
      await getData().then(async (data) => {
        if (!Object.keys(data).length) {
          return;
        }

        setItems(data);

        setLoading(false);
      });
    })();
  }, [setItems, setLoading]);

  if (loading) {
    return <div>loading...</div>;
  }

  return (
    <Container sx={{ p: '0px !important', m: '24px', maxWidth: '100% !important', width: 'auto' }}>
      <Center>
        {!loading &&
          //@ts-ignore
          items.map((folder, index) => {
            if (!items[index].length) {
              return;
            }

            const variant =
              index === 0 ? 'magazyn' : index === 1 ? 'rozliczenia' : index === 2 ? 'skarbonka' : 'wydatki';
            return (
              <Box key={index} sx={{ width: '100%' }}>
                <h2>{variant}</h2>
                {folder.map((url: string) => {
                  return (
                    <Box
                      key={variant + url}
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
                      <img src={url} alt="screen" />
                    </Box>
                  );
                })}
              </Box>
            );
          })}
      </Center>
    </Container>
  );
};

export default withLayout(Screenshots);
