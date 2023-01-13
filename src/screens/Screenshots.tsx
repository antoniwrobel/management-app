import withLayout from '../components/layout/withLayout';
import Container from '@mui/material/Container';

import { useEffect, useState } from 'react';
import { Box, Tab, Tabs } from '@mui/material';

import { getStorage, ref, listAll, getDownloadURL } from 'firebase/storage';

import PQueue from 'p-queue';

const a = {} as any;

const Screenshots = () => {
  const storage = getStorage();
  const screenshotsRef1 = ref(storage, 'screenshots/magazyn');
  const screenshotsRef2 = ref(storage, 'screenshots/rozliczenia');
  const screenshotsRef3 = ref(storage, 'screenshots/skarbonka');
  const screenshotsRef4 = ref(storage, 'screenshots/wydatki');

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

  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
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
    <Box display={'flex'} alignItems={'center'} flexDirection={'column'} boxShadow={2} margin={3}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', width: '100%' }}>
        <Tabs value={value} onChange={handleChange}>
          <Tab label="Magazyn" />
          <Tab label="Rozliczenia" />
          <Tab label="Skarbonka" />
          <Tab label="Wydatki" />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        <Container sx={{ p: '0px !important', m: '24px', maxWidth: '100% !important', width: 'auto' }}>
          <Content loading={loading} items={items[0]} value={0} />
        </Container>
      </TabPanel>
      <TabPanel value={value} index={1}>
        <Container sx={{ p: '0px !important', m: '24px', maxWidth: '100% !important', width: 'auto' }}>
          <Content loading={loading} items={items[1]} value={1} />
        </Container>
      </TabPanel>
      <TabPanel value={value} index={2}>
        <Container sx={{ p: '0px !important', m: '24px', maxWidth: '100% !important', width: 'auto' }}>
          <Content loading={loading} items={items[2]} value={2} />
        </Container>
      </TabPanel>
      <TabPanel value={value} index={3}>
        <Container sx={{ p: '0px !important', m: '24px', maxWidth: '100% !important', width: 'auto' }}>
          <Content loading={loading} items={items[3]} value={3} />
        </Container>
      </TabPanel>
    </Box>
  );
};

export default withLayout(Screenshots);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => {
  return (
    <div role="tabpanel" hidden={value !== index} style={{ width: '100%' }}>
      {value === index && (
        <Box>
          <>{children}</>
        </Box>
      )}
    </div>
  );
};

const Content = ({ loading, items, value }: { loading: any; items: any; value: any }) => {
  return (
    <Box>
      {!loading &&
        items &&
        //@ts-ignore
        items.map((url) => {
          const variant = value === 0 ? 'magazyn' : value === 1 ? 'rozliczenia' : value === 2 ? 'skarbonka' : 'wydatki';

          return (
            <Box key={url} sx={{ width: '100%' }}>
              <Box
                key={variant + url}
                sx={{
                  overflow: 'hidden',
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
            </Box>
          );
        })}
    </Box>
  );
};
