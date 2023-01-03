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
import { ItemType, SettlementItemType, ValveType } from './types';
import { collection, getDocs, addDoc, updateDoc, doc } from '@firebase/firestore';
import { AddItem } from '../components/inventory/AddItem';
import { EditItem } from '../components/inventory/EditItem';
import { AddToValveModal } from '../components/inventory/AddToValveModal';

import dayjs from 'dayjs';

const MagazynKomis = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [valveModalOpen, setValveModalOpen] = useState(false);

  const [currentSelected, setCurrentSelected] = useState<ItemType>();
  const [items, setItems] = useState<ItemType[]>([]);

  const itemsCollectionRef = collection(db, 'items');
  const spendingsCollectionRef = collection(db, 'spendings');
  const valveCollectionRef = collection(db, 'valve');
  const settlementsCollectionRef = collection(db, 'settlements');

  const getItems = async () => {
    const data = await getDocs(itemsCollectionRef);
    const items = data.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as ItemType[];

    setItems(items);
  };

  useEffect(() => {
    getItems();
  }, []);

  const editRow = (itemId: string) => {
    const selectedItem = items.find((item) => item.id === itemId);

    if (selectedItem) {
      setCurrentSelected(selectedItem);
      setEditModalOpen(true);
    }
  };

  const handleValve = (itemId: string) => {
    const selectedItem = items.find((item) => item.id === itemId);

    if (selectedItem) {
      setCurrentSelected(selectedItem);
      setValveModalOpen(true);
    }
  };

  const handleReturn = async (item: ItemType) => {
    const { id, productName, provision, saleAmount } = item;

    const itemDoc = doc(db, 'items', id);

    const d = await getDocs(valveCollectionRef);
    const items = d.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as ValveType[];
    const elements = items.filter((item) => item.elementId === id);

    //dodadc confirmation box przed zwrotem

    if (elements.length) {
      const promises = elements.map((e) => {
        const finded = doc(db, 'valve', e.id);
        updateDoc(finded, {
          removed: true
        });
      });

      await Promise.all(promises);
    }

    const s = await getDocs(settlementsCollectionRef);
    const settlements = s.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as SettlementItemType[];
    const settlement = settlements.find((item) => item.elementId === id);

    if (settlement) {
      const settlementsDoc = doc(db, 'settlements', settlement.id);
      await updateDoc(settlementsDoc, {
        status: 'zwrot',
        removed: true,
        details: currentSelected?.details ? currentSelected.details + ' - zwrot' : 'zwrot'
      });
    }

    await updateDoc(itemDoc, {
      status: 'zwrot',
      color: '#fff',
      saleAmount: 0,
      provision: 0,
      previousSaleAmount: saleAmount,
      valueTransferedToValve: 0
    });

    if (provision > 0) {
      await addDoc(spendingsCollectionRef, {
        elementId: id,
        elementName: productName,
        amount: provision,
        addedBy: 'automat',
        createdAt: dayjs(new Date()).format('DD/MM/YYYY')
      });
    }

    getItems();
  };

  let summaryWojt = 0;
  let summaryStan = 0;

  return (
    <Container sx={{ px: '0px !important', maxWidth: '100% !important', width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '20px', mr: '10px' }}>
        <Button variant="contained" onClick={() => setModalOpen(true)}>
          Dodaj
        </Button>
      </Box>

      <AddItem modalOpen={modalOpen} setModalOpen={setModalOpen} getItems={getItems} />

      <EditItem
        currentSelected={currentSelected}
        setEditModalOpen={setEditModalOpen}
        editModalOpen={editModalOpen}
        getItems={getItems}
      />

      <AddToValveModal
        currentSelected={currentSelected}
        getItems={getItems}
        setValveModalOpen={setValveModalOpen}
        valveModalOpen={valveModalOpen}
      />

      <Center>
        <TableContainer component={Paper} sx={{ mt: '20px' }}>
          <Table sx={{ minWidth: 1550 }}>
            <TableHead>
              <TableRow>
                <TableCell>Nazwa produktu</TableCell>
                <TableCell align="right">stan</TableCell>
                <TableCell align="right">status</TableCell>
                <TableCell align="right">kwota zakupu</TableCell>
                <TableCell align="right">kwota sprzedazy</TableCell>
                <TableCell align="right">koszt sprzedaży</TableCell>
                <TableCell align="right">saldo stan</TableCell>
                <TableCell align="right">saldo wojtek</TableCell>
                <TableCell align="right">data stworzenia</TableCell>
                <TableCell align="right">link do aukcji</TableCell>
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
                  .sort((a, b) => new Date(b.createDate) - new Date(a.createDate))
                  .map((item) => {
                    if (item.removed) {
                      return;
                    }

                    const profit = item.saleAmount
                      ? (item.saleAmount - item.purchaseAmount - item.provision) / 2
                      : false;

                    summaryWojt +=
                      item.status === 'sprzedano' ? (profit ? item.purchaseAmount + profit : item.purchaseAmount) : 0;
                    summaryStan += item.status === 'sprzedano' ? profit || 0 : 0;

                    return (
                      <TableRow
                        key={item.id}
                        sx={{
                          backgroundColor: `${item.color}26`,
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
                            color: item.status === 'zwrot' ? 'red' : 'inherit',
                            fontWeight: item.status === 'zwrot' ? 'bold' : 'inherit'
                          }}
                        >
                          {item.condition}
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
                          {item.purchaseAmount}zł
                        </TableCell>

                        <TableCell
                          align="right"
                          sx={{
                            color: item.status === 'zwrot' ? 'red' : 'inherit',
                            fontWeight: item.status === 'zwrot' ? 'bold' : 'inherit'
                          }}
                        >
                          {item.saleAmount ? `${item.saleAmount}zł` : '-'}{' '}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            color: item.status === 'zwrot' ? 'red' : 'inherit',
                            fontWeight: item.status === 'zwrot' ? 'bold' : 'inherit'
                          }}
                        >
                          {item.provision ? `${item.provision}zł` : '-'}{' '}
                        </TableCell>

                        <TableCell
                          align="right"
                          sx={{
                            color: item.status === 'zwrot' ? 'red' : 'inherit',
                            fontWeight: item.status === 'zwrot' ? 'bold' : 'inherit'
                          }}
                        >
                          {profit ? `${profit}zł` : '-'}
                        </TableCell>

                        <TableCell
                          align="right"
                          sx={{
                            color: item.status === 'zwrot' ? 'red' : 'inherit',
                            fontWeight: item.status === 'zwrot' ? 'bold' : 'inherit'
                          }}
                        >
                          {item.saleAmount ? `${profit ? item.purchaseAmount + profit : item.purchaseAmount}zł` : '-'}
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
                            fontWeight: item.status === 'zwrot' ? 'bold' : 'inherit'
                          }}
                        >
                          {item.url ? (
                            <a href={item.url} target="_blank">
                              link do aukcji
                            </a>
                          ) : (
                            '-'
                          )}
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

                        <TableCell align="right">
                          {item.status === 'sprzedano' ? (
                            <>
                              <Button size="small" variant="contained" color="error" onClick={() => handleReturn(item)}>
                                Zwrot
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                type="submit"
                                onClick={() => handleValve(item.id)}
                                sx={{ ml: '20px' }}
                              >
                                $$$
                              </Button>
                            </>
                          ) : null}
                          <Button
                            size="small"
                            variant="contained"
                            type="submit"
                            color={item.status === 'zwrot' ? 'error' : 'primary'}
                            onClick={() => editRow(item.id)}
                            sx={{ ml: '20px' }}
                          >
                            Edytuj
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>

          {/* <Box
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
                {summaryWojt.toFixed(2)}zł
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              Stan suma:{' '}
              <Box sx={{ fontWeight: 'bold', marginLeft: '10px', minWidth: '150px', textAlign: 'end' }}>
                {summaryStan.toFixed(2)}zł
              </Box>
            </Box>
          </Box> */}
        </TableContainer>
      </Center>
    </Container>
  );
};

export default MagazynKomis;
