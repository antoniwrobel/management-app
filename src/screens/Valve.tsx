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

interface Props {}

type ValveType = {
  id: string;
  amount: number;
  elementId: string;
  elementName: string;
  createdAt: Date;
  userName: string;
};

const Valve = ({}: Props) => {
  const [data, setData] = useState<ValveType[]>([]);
  const [details, setDetails] = useState<ItemType>();

  const itemsCollectionRef = collection(db, 'items');
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
    console.log({ details });
  }, [details]);

  return (
    <Container sx={{ p: '20px', maxWidth: 'calc(100% - 20px)!important' }}>
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
                        {d.amount}zł
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
        </TableContainer>
      </Center>
    </Container>
  );
};

export default withLayout(Valve);
