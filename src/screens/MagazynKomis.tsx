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
import { ItemType, SettlementItemType, ValveType } from './types';
import { collection, getDocs, addDoc, updateDoc, doc } from '@firebase/firestore';
import { AddItem } from '../components/inventory/AddItem';
import { EditItem } from '../components/inventory/EditItem';
import { AddToValveModal } from '../components/inventory/AddToValveModal';
import { ConfirmationModal } from '../components/modal/ConfirmationModal';
import { isAdminUser } from './helpers';

import dayjs from 'dayjs';
import { styled, Tooltip, tooltipClasses, TooltipProps } from '@mui/material';

const MagazynKomis = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [valveModalOpen, setValveModalOpen] = useState(false);

  const [returnConfirmationOpen, setReturnConfirmationOpen] = useState<string | null>(null);

  const [currentSelected, setCurrentSelected] = useState<ItemType>();
  const [items, setItems] = useState<ItemType[]>([]);
  const [user] = useState(auth.currentUser);

  const itemsCollectionRef = collection(db, 'items');
  const spendingsCollectionRef = collection(db, 'spendings');
  const valveCollectionRef = collection(db, 'valve');
  const settlementsCollectionRef = collection(db, 'settlements');

  const editBlocked = !isAdminUser(user);

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
    const { id, productName, provision } = item;

    const itemDoc = doc(db, 'items', id);

    const valveDoc = await getDocs(valveCollectionRef);
    const valveElements = valveDoc.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as ValveType[];
    const valveItem = valveElements.filter((item) => item.elementId === id);

    if (valveItem.length) {
      const promises = valveItem.map((e) => {
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
        details: currentSelected?.details
          ? currentSelected.details + ` - zwrot - poniesione koszta ${item.provision!.toFixed(2)}zł`
          : `zwrot - poniesione koszta: ${item.provision!.toFixed(2)}zł`
      });
    }

    await updateDoc(itemDoc, {
      status: 'zwrot',
      color: '#fff',
      valueTransferedToValve: 0
    });

    if (provision && provision > 0) {
      await addDoc(spendingsCollectionRef, {
        elementId: id,
        elementName: productName,
        //@ts-ignore
        amount: provision,
        addedBy: 'automat',
        createdAt: dayjs(new Date()).format('DD/MM/YYYY')
      });
    }

    getItems();
  };

  const haveItems = items.filter((e) => !e.removed).length;

  const BootstrapTooltip = styled(({ className, ...props }: TooltipProps) => (
    <Tooltip {...props} arrow classes={{ popper: className }} />
  ))(({ theme }) => ({
    [`& .${tooltipClasses.arrow}`]: {
      color: theme.palette.common.black
    },
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: theme.palette.common.black,
      fontSize: 16,
      whiteSpace: 'nowrap',
      maxWidth: '100%'
    }
  }));

  let summaryStan = 0;

  return (
    <Container sx={{ px: '0px !important', maxWidth: '100% !important', width: '100%' }}>
      {!editBlocked && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '20px', mr: '16px' }}>
          <Button variant="contained" onClick={() => setModalOpen(true)}>
            Dodaj
          </Button>
        </Box>
      )}

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
        {haveItems ? (
          <TableContainer component={Paper} sx={{ mt: '20px' }}>
            <Table sx={{ minWidth: 1550 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Nazwa produktu</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    status
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    kwota <br />
                    zakupu
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    kwota <br />
                    sprzedazy
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    koszt <br />
                    wysyłki
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    zapłacono <br />
                    łącznie
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    prowizja <br />
                    od sprzedaży
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    saldo <br />
                    stan
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    saldo <br />
                    wojtek
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    data <br />
                    stworzenia
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    link
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    uwagi
                  </TableCell>
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
                {items
                  // @ts-ignore
                  .sort((a, b) => new Date(b.createDate) - new Date(a.createDate))
                  .map((item) => {
                    if (item.removed) {
                      return;
                    }

                    summaryStan += item.clearingValueStan;

                    const removedCellStyles =
                      item.status === 'zwrot'
                        ? {
                            textDecoration: 'line-through'
                          }
                        : {};

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
                            ...removedCellStyles
                          }}
                        >
                          <BootstrapTooltip
                            title={item.productName}
                            placement="bottom-start"
                            arrow
                            sx={{ fontSize: '18px' }}
                          >
                            <Box
                              sx={{
                                maxWidth: '200px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {item.productName}
                            </Box>
                          </BootstrapTooltip>
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
                            fontWeight: item.status === 'zwrot' ? 'bold' : 'inherit',
                            ...removedCellStyles
                          }}
                        >
                          {item.purchaseAmount}zł
                        </TableCell>

                        <TableCell
                          align="right"
                          sx={{
                            color: item.status === 'zwrot' ? 'red' : 'inherit',
                            fontWeight: item.status === 'zwrot' ? 'bold' : 'inherit',
                            ...removedCellStyles
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
                          {item.sendCost ? `${item.sendCost}zł` : '-'}{' '}
                        </TableCell>

                        <TableCell
                          align="right"
                          sx={{
                            color: item.status === 'zwrot' ? 'red' : 'inherit',
                            fontWeight: item.status === 'zwrot' ? 'bold' : 'inherit'
                          }}
                        >
                          {item.status === 'sprzedano' ? item.sendCost + item.saleAmount + 'zł' : '-'}
                        </TableCell>

                        <TableCell
                          align="right"
                          sx={{
                            color: item.status === 'zwrot' ? 'red' : 'inherit',
                            fontWeight: item.status === 'zwrot' ? 'bold' : 'inherit'
                          }}
                        >
                          {item.provision ? item.provision.toFixed(2) + 'zł' : '-'}
                        </TableCell>

                        <TableCell
                          align="right"
                          sx={{
                            color: item.status === 'zwrot' ? 'red' : 'inherit',
                            fontWeight: item.status === 'zwrot' ? 'bold' : 'inherit',
                            ...removedCellStyles
                          }}
                        >
                          {item.clearingValueStan ? `${item.clearingValueStan.toFixed(2)}zł` : '-'}
                        </TableCell>

                        <TableCell
                          align="right"
                          sx={{
                            color: item.status === 'zwrot' ? 'red' : 'inherit',
                            fontWeight: item.status === 'zwrot' ? 'bold' : 'inherit',
                            ...removedCellStyles
                          }}
                        >
                          {item.clearingValueWojtek ? `${item.clearingValueWojtek.toFixed(2)}zł` : '-'}
                        </TableCell>

                        <TableCell
                          align="right"
                          sx={{
                            color: item.status === 'zwrot' ? 'red' : 'inherit',
                            fontWeight: item.status === 'zwrot' ? 'bold' : 'inherit',
                            ...removedCellStyles
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
                            <a href={item.url} target="_blank" rel="noreferrer">
                              link
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
                              {!editBlocked && (
                                <>
                                  <ConfirmationModal
                                    handleConfirm={() => handleReturn(item)}
                                    open={returnConfirmationOpen === item.id}
                                    handleReject={() => setReturnConfirmationOpen(null)}
                                  />
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="error"
                                    onClick={() => setReturnConfirmationOpen(item.id)}
                                  >
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
                              )}
                            </>
                          ) : null}

                          {!editBlocked && (
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
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ my: '20px' }}>Brak danych</Box>
        )}
      </Center>

      <Box
        sx={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Box sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
          Podsumowanie
          <Box sx={{ fontWeight: 'bold', marginLeft: '10px', minWidth: '150px', textAlign: 'end' }}>
            {summaryStan.toFixed(2)}zł
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default MagazynKomis;
