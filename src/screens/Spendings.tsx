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
import dayjs from 'dayjs';
import { ItemType } from './Inventory';
import { Box } from '@mui/material';
import { ValveType } from './Valve';

interface Props {}

type SpendingType = {
  id: string;
  elementId: string;
  elementName: string;
  amount: number;
  addedBy: string;
  createdAt: string;
};

const Spendings = ({}: Props) => {
  const [data, setData] = useState<SpendingType[]>([]);
  const [valveAmount, setValveAmount] = useState(0);

  const valveCollectionRef = collection(db, 'valve');
  const spendingsCollectionRef = collection(db, 'spendings');

  const getData = async () => {
    const d = await getDocs(spendingsCollectionRef);
    const items = d.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as SpendingType[];
    const valve = await getDocs(valveCollectionRef);
    const itemsValve = valve.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as ValveType[];
    const valveAmount = itemsValve.reduce((acc, curr) => {
      if (curr.removed) return acc;
      return acc + curr.amount;
    }, 0);

    setValveAmount(valveAmount);
    setData(items);
  };

  useEffect(() => {
    getData();
  }, []);

  let total = 0;

  return (
    <Container sx={{ p: '20px', maxWidth: 'calc(100% - 20px)!important' }}>
      <Center>
        <TableContainer component={Paper} sx={{ mt: '20px' }}>
          <Table sx={{ minWidth: 1550 }}>
            <TableHead>
              <TableRow>
                <TableCell>Nazwa wydatku</TableCell>
                <TableCell align="right">kwota</TableCell>
                <TableCell align="right">data dodania</TableCell>
                <TableCell align="right">kto dodał</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length ? (
                data.map((d) => {
                  total -= d.amount;
                  return (
                    <TableRow key={d.id}>
                      <TableCell component="th" scope="row">
                        {d.addedBy === 'automat' ? `zwrot - ${d.elementName}` : d.elementName}
                      </TableCell>
                      <TableCell component="th" scope="row" align="right">
                        {d.amount}zł
                      </TableCell>
                      <TableCell component="th" scope="row" align="right">
                        {d.createdAt}
                      </TableCell>
                      <TableCell component="th" scope="row" align="right">
                        {d.addedBy}
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
              Suma wydatków:{' '}
              <Box sx={{ fontWeight: 'bold', marginLeft: '10px', minWidth: '150px', textAlign: 'end' }}>
                {total.toFixed(2)}zł
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              Suma skarbonki:{' '}
              <Box sx={{ fontWeight: 'bold', marginLeft: '10px', minWidth: '150px', textAlign: 'end' }}>
                {valveAmount.toFixed(2)}zł
              </Box>
            </Box>
          </Box>
        </TableContainer>
      </Center>
    </Container>
  );
};

export default withLayout(Spendings);
