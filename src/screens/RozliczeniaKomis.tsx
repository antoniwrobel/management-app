import { useEffect, useState } from 'react';

import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Center from '../components/utils/Center';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import Paper from '@mui/material/Paper';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import { db } from '../config/firebase';
import { SettlementItemType } from './types';
import { collection, getDocs } from '@firebase/firestore';
import dayjs from 'dayjs';

const RozliczeniaKomis = () => {
  const [modalOpen, setModalOpen] = useState(false);

  const [currentSelected, setCurrentSelected] = useState<SettlementItemType>();
  const [items, setItems] = useState<SettlementItemType[]>([]);

  const settlementsCollectionRef = collection(db, 'settlements');

  const getItems = async () => {
    const data = await getDocs(settlementsCollectionRef);
    const items = data.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as SettlementItemType[];

    setItems(items);
  };

  useEffect(() => {
    getItems();
  }, []);

  const handleSettlement = (item: SettlementItemType) => {
    console.log(item);
    setCurrentSelected(item);
    setModalOpen(true);
  };

  let summaryWojtek = 0;
  console.log(dayjs(new Date()).format('DD/MM/YYYY'));
  console.log(new Date());
  return (
    <Container sx={{ px: '0px !important', maxWidth: '100% !important', width: '100%' }}>
      <Center>
        <TableContainer component={Paper} sx={{ mt: '20px' }}>
          <Table sx={{ minWidth: 1550 }}>
            <TableHead>
              <TableRow>
                <TableCell>Nazwa produktu</TableCell>
                <TableCell align="right">status</TableCell>
                <TableCell align="right">kwota do rozliczenia</TableCell>
                <TableCell align="right">data stworzenia</TableCell>
                <TableCell align="right">uwagi</TableCell>
                <TableCell
                  align="right"
                  sx={{
                    minWidth: '300px'
                  }}
                >
                  akcja
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!items.length ? (
                <TableRow>
                  <TableCell component="th" scope="row" align="left">
                    brak danych
                  </TableCell>
                </TableRow>
              ) : (
                items
                  // @ts-ignore
                  .map((item) => {
                    if (!item.removed) {
                      summaryWojtek += item.amount;
                    } else {
                      console.log('usunięte - ', item);
                    }

                    return (
                      <TableRow
                        key={item.id}
                        sx={{
                          '&:last-child td, &:last-child th': { border: 0 }
                        }}
                      >
                        <TableCell
                          component="th"
                          scope="row"
                          sx={{
                            color: item.status === 'zwrot' ? 'red' : 'inherit',
                            fontWeight: item.status === 'zwrot' ? 'bold' : 'inherit',
                            maxWidth: '200px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {item.productName}
                        </TableCell>

                        <TableCell
                          align="right"
                          sx={{
                            color: item.status === 'zwrot' ? 'red' : item.status === 'sprzedano' ? 'green' : 'inherit',
                            fontWeight: 'bold'
                          }}
                        >
                          {item.status}
                        </TableCell>

                        <TableCell
                          align="right"
                          sx={{
                            color: item.status === 'zwrot' ? 'red' : 'inherit',
                            fontWeight: item.status === 'zwrot' ? 'bold' : 'inherit'
                          }}
                        >
                          {item.removed ? (
                            <Box sx={{ textDecoration: 'line-through' }}>{item.amount}zł</Box>
                          ) : (
                            <Box>{item.amount}zł</Box>
                          )}
                        </TableCell>

                        <TableCell
                          align="right"
                          sx={{
                            color: item.status === 'zwrot' ? 'red' : 'inherit',
                            fontWeight: item.status === 'zwrot' ? 'bold' : 'inherit'
                          }}
                        >
                          {dayjs(item.createDate).format('DD/MM/YYYY')}
                        </TableCell>

                        <TableCell
                          align="right"
                          sx={{
                            color: item.status === 'zwrot' ? 'red' : 'inherit',
                            fontWeight: item.status === 'zwrot' ? 'bold' : 'inherit',
                            maxWidth: '200px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {item.details}
                        </TableCell>
                        {!item.removed && (
                          <TableCell align="right">
                            <Button
                              size="small"
                              variant="contained"
                              type="submit"
                              color={'primary'}
                              onClick={() => handleSettlement(item)}
                              sx={{ ml: '20px' }}
                            >
                              Rozlicz
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
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
              Wojtek suma:{' '}
              <Box sx={{ fontWeight: 'bold', marginLeft: '10px', minWidth: '150px', textAlign: 'end' }}>
                {summaryWojtek.toFixed(2)}zł
              </Box>
            </Box>
          </Box>
        </TableContainer>
      </Center>
    </Container>
  );
};

export default RozliczeniaKomis;
