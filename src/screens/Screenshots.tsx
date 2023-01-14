import withLayout from '../components/layout/withLayout';
import Container from '@mui/material/Container';

import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  CardActions,
  CardContent,
  CardMedia,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography
} from '@mui/material';

import { getStorage, ref, listAll, getDownloadURL } from 'firebase/storage';

import PQueue from 'p-queue';
import Center from '../components/utils/Center';
import { Link } from 'react-router-dom';
import { DesktopDatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { format } from 'path';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

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
      const urlPromiseArray = folder.items.map(async (item) => {
        return {
          url: await getDownloadURL(item),
          fileName: item.name
        };
      });

      const result = await Promise.all(urlPromiseArray);
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
    return (
      <Center height="100vh">
        <h2>loading...</h2>
      </Center>
    );
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
    <TableContainer component={Paper} sx={{ mt: '20px', overflowX: 'initial', mb: '20px' }}>
      <Table
        sx={{
          '& .MuiTableCell-root': {
            borderLeft: '1px solid rgba(224, 224, 224, 1)'
          }
        }}
        stickyHeader
      >
        <TableHead sx={{ zIndex: 1 }}>
          <TableRow>
            <TableCell>Data i godzina</TableCell>
            <TableCell>Podgląd</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {!loading &&
            items &&
            //@ts-ignore
            items.map(({ url, fileName }) => {
              const variant =
                value === 0 ? 'magazyn' : value === 1 ? 'rozliczenia' : value === 2 ? 'skarbonka' : 'wydatki';
              const data = fileName.substring(0, fileName.length - 6).split('_')[1];
              const time = fileName.slice(-5);

              const formattedDate = dayjs(data, 'DD-MM-YYYY', true);

              return (
                <TableRow key={variant + url}>
                  <TableCell sx={{ width: '150px' }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <Stack spacing={3}>
                        <DesktopDatePicker
                          onChange={() => ({})}
                          label="Data"
                          inputFormat="DD-MM-YYYY"
                          value={formattedDate}
                          renderInput={(params) => {
                            return <TextField {...params} datatype="date" type="date" disabled />;
                          }}
                        />
                      </Stack>
                    </LocalizationProvider>
                    <TextField
                      sx={{ mt: '10px' }}
                      disabled
                      type="text"
                      label="Godzina"
                      variant="outlined"
                      value={time}
                      fullWidth
                    />
                  </TableCell>
                  <TableCell>
                    <a href={url} target={'_blank'}>
                      <CardMedia
                        component="img"
                        image={url}
                        alt="green iguana"
                        sx={{
                          height: '500px',
                          zIndex: 999,
                          position: 'relative'
                        }}
                      />
                    </a>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary" fontWeight="bold">
                        {variant}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        dodatkowe szczegóły zdjęcia, które dodam później
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small" onClick={() => console.log('share')}>
                        Share
                      </Button>
                      <Button size="small" onClick={() => console.log('learn more')}>
                        Learn More
                      </Button>
                    </CardActions>
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
