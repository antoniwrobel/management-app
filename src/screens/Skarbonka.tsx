import { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import Center from '../components/utils/Center';
import withLayout from '../components/layout/withLayout';
import { db } from '../config/firebase';
import { collection, getDocs, doc, getDoc } from '@firebase/firestore';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import Paper from '@mui/material/Paper';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';

import { Box } from '@mui/material';
import { ItemType, ValveType } from './types';

interface Props {}

const Skarbonka = ({}: Props) => {
  const [data, setData] = useState<ValveType[]>([]);
  const [details, setDetails] = useState<ItemType>();

  const valveCollectionRef = collection(db, 'valve');

  const getData = async () => {
    const d = await getDocs(valveCollectionRef);
    const items = d.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as ValveType[];

    setData(items);
  };

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    if (!details) return;
    console.info('deatils ->', { details });
  }, [details]);

  let total = 0;

  return (
    <Container sx={{ p: '0px !important', m: '24px', maxWidth: '100% !important', width: 'auto' }}>
      <Center>
        <TableContainer component={Paper} sx={{ mt: '20px' }}>
          <Table sx={{ minWidth: 1550 }}>
            <TableHead>
              <TableRow>
                <TableCell>Nazwa potrącenia</TableCell>

                <TableCell align="right">kwota</TableCell>

                <TableCell align="right">data dodania</TableCell>
                <TableCell align="right">kto dodał</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length ? (
                data.map((d) => {
                  if (!d.removed) {
                    total += d.amount;
                  }

                  return (
                    <TableRow
                      key={d.id}
                      onClick={async () => {
                        const docRef = doc(db, 'items', d.elementId);
                        const docSnap = await getDoc(docRef);
                        const data = docSnap.data() as ItemType;
                        setDetails(data);
                      }}
                    >
                      <TableCell component="th" scope="row">
                        {d.elementName}
                      </TableCell>
                      <TableCell component="th" scope="row" align="right">
                        {d.removed ? (
                          <Box sx={{ textDecoration: 'line-through' }}>{d.amount}zł</Box>
                        ) : (
                          <Box>{d.amount}zł</Box>
                        )}
                      </TableCell>
                      <TableCell component="th" scope="row" align="right">
                        {d.createdAt}
                      </TableCell>
                      <TableCell component="th" scope="row" align="right">
                        {d.userName}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell component="th" scope="row" align="left">
                    brak danych
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <Box
            sx={{
              minWidth: 1550,
              padding: '16px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box sx={{ fontWeight: 'bold' }}>Podsumowanie</Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              Suma skarbonki:{' '}
              <Box sx={{ fontWeight: 'bold', marginLeft: '10px', minWidth: '150px', textAlign: 'end' }}>
                {total.toFixed(2)}zł
              </Box>
            </Box>
          </Box>
        </TableContainer>
      </Center>
    </Container>
  );
};

export default withLayout(Skarbonka);
