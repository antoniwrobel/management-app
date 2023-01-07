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

import { auth, db } from '../config/firebase';
import { SettlementItemType } from './types';
import { collection, getDocs } from '@firebase/firestore';
import { isAdminUser } from './helpers';

import dayjs from 'dayjs';

const RozliczeniaKomis = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [user] = useState(auth.currentUser);

  const [currentSelected, setCurrentSelected] = useState<SettlementItemType>();
  const [items, setItems] = useState<SettlementItemType[]>([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const settlementsCollectionRef = collection(db, 'settlements');

  const editBlocked = !isAdminUser(user);

  const getItems = async () => {
    const data = await getDocs(settlementsCollectionRef);
    const items = data.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as SettlementItemType[];

    setItems(items);
  };

  useEffect(() => {
    getItems();
  }, []);

  const handleSettlement = (item: SettlementItemType) => {
    setCurrentSelected(item);
    setModalOpen(true);
  };

  let summaryWojtek = 0;

  return (
    <Container sx={{ px: '0px !important', maxWidth: '100% !important', width: '100%' }}>
      {items.length ? (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '20px', mr: '16px' }}>
          <Button variant="contained" onClick={() => setShowDeleted((prev) => !prev)}>
            {!showDeleted ? 'Pokaż usunięte' : 'Schowaj usunięte'}
          </Button>
        </Box>
      ) : null}

      <Center>
        {items.length ? (
          <TableContainer component={Paper} sx={{ mt: '20px' }}>
            <Table
              sx={{
                minWidth: 1550,
                '& .MuiTableCell-root': {
                  borderLeft: '1px solid rgba(224, 224, 224, 1)'
                }
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Nazwa produktu</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                    Status
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                    Kwota do rozliczenia
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                    Data stworzenia
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                    Uwagi
                  </TableCell>
                  {!editBlocked ? (
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      Akcja
                    </TableCell>
                  ) : null}
                </TableRow>
              </TableHead>
              <TableBody>
                {items
                  // @ts-ignore
                  .sort((a, b) => new Date(b.createDate) - new Date(a.createDate))
                  .map((item) => {
                    if (!showDeleted && item.removed) {
                      return;
                    }

                    if (!item.removed) {
                      summaryWojtek += item.clearingValueWojtek;
                    }

                    const removedCellStyles =
                      item.status === 'zwrot'
                        ? {
                            textDecoration: 'line-through'
                          }
                        : {};

                    return (
                      <TableRow key={item.id}>
                        <TableCell
                          component="th"
                          scope="row"
                          sx={{
                            color: item.status === 'zwrot' ? 'red' : 'inherit',
                            fontWeight: item.status === 'zwrot' ? 'bold' : 'inherit',
                            maxWidth: '200px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            ...removedCellStyles
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
                          <Box sx={removedCellStyles}>{item.clearingValueWojtek.toFixed(2)}zł</Box>
                        </TableCell>

                        <TableCell align="right">{dayjs(item.createDate).format('DD/MM/YYYY')}</TableCell>

                        <TableCell
                          align="right"
                          sx={{
                            maxWidth: '200px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            textAlign: 'left'
                          }}
                        >
                          {item.details}
                        </TableCell>
                        {!editBlocked ? (
                          <>
                            {!item.removed ? (
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
                            ) : (
                              <TableCell align="right"></TableCell>
                            )}
                          </>
                        ) : null}
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ my: '40px' }}>Brak danych</Box>
        )}
      </Center>

      <Box
        sx={{
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
    </Container>
  );
};

export default RozliczeniaKomis;
