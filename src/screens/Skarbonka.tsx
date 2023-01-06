import Center from '../components/utils/Center';
import withLayout from '../components/layout/withLayout';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import Paper from '@mui/material/Paper';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';

import { db } from '../config/firebase';
import { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc } from '@firebase/firestore';
import { Box } from '@mui/material';
import { ItemType, ValveType } from './types';

const Skarbonka = () => {
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
        {data.length ? (
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
                {data.map((d) => {
                  if (!d.removed) {
                    total += d.amount;
                  }

                  const removedCellStyles = d.removed
                    ? {
                        textDecoration: 'line-through'
                      }
                    : {};

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
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{
                          color: d.removed ? 'red' : 'inherit',
                          fontWeight: 'bold',
                          ...removedCellStyles
                        }}
                      >
                        {d.elementName}
                      </TableCell>
                      <TableCell component="th" scope="row" align="right">
                        {d.removed ? (
                          <Box
                            sx={{
                              textDecoration: 'line-through',
                              color: d.removed ? 'red' : 'inherit',
                              fontWeight: 'bold'
                            }}
                          >
                            {d.amount}zł
                          </Box>
                        ) : (
                          <Box>{d.amount.toFixed(2)}zł</Box>
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
                })}
              </TableBody>
            </Table>

            <Box
              sx={{
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
        ) : (
          <Box sx={{ my: '40px' }}>Brak danych</Box>
        )}
      </Center>
    </Container>
  );
};

export default withLayout(Skarbonka);
