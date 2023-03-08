import { createRef, useEffect, useState } from 'react';

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

import { EditItems } from '../components/settlements/EditItems';
import { auth, db } from '../config/firebase';
import { SettlementItemType } from './types';
import { collection, getDocs } from '@firebase/firestore';
import { isAdminUser } from './helpers';
import CheckCircleSharpIcon from '@mui/icons-material/CheckCircleSharp';
import AddAPhotoSharpIcon from '@mui/icons-material/AddAPhotoSharp';

import dayjs from 'dayjs';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import * as htmlToImage from 'html-to-image';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Typography } from '@mui/material';

const RozliczeniaKomis = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [user] = useState(auth.currentUser);

  const [currentSelected, setCurrentSelected] = useState<SettlementItemType[]>([]);
  const [items, setItems] = useState<SettlementItemType[]>([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const settlementsCollectionRef = collection(db, 'settlements');

  const editBlocked = !isAdminUser(user);
  const [hideSettled, setHideSettled] = useState(false);

  const getItems = async () => {
    try {
      const data = await getDocs(settlementsCollectionRef);
      const items = data.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as SettlementItemType[];

      setItems(items);
      setCurrentSelected([]);
    } catch (error) {
      //@ts-ignore
      toast.error(error.message);
      console.error(error);
    }
  };

  useEffect(() => {
    getItems();
  }, []);

  const handleMulitSettlement = (item: SettlementItemType) => {
    const itemAdded = currentSelected.find((currentSelected) => currentSelected.id === item.id);

    if (itemAdded) {
      const updatedCurrentSelected = currentSelected.filter((e) => e.id !== item.id);
      setCurrentSelected(updatedCurrentSelected);
    } else {
      setCurrentSelected((prev) => [...prev, item]);
    }
  };

  const [screenshotDisabled, setScreenshotDisabled] = useState(false);
  const dateTimeValue = dayjs().format('DD-MM-YYYY-HH:mm');
  const storage = getStorage();
  const tableRef = createRef<HTMLElement | null>();
  const screenShotName = `rozliczenia_${dateTimeValue}`;
  const tableImageRef = ref(storage, `screenshots/rozliczenia/${screenShotName}`);

  const takeScreenShot = async (node: HTMLElement) => {
    const blob = await htmlToImage.toBlob(node);

    if (!blob) {
      setScreenshotDisabled(false);
      toast.error('Coś poszło nie tak!');
      return;
    }

    try {
      await uploadBytes(tableImageRef, blob, {
        contentType: 'image/jpeg',
        customMetadata: { filename: screenShotName }
      });
      toast.success('Screenshot został zapisany!');
    } catch (error) {
      toast.error('Coś poszło nie tak!');
    } finally {
      setScreenshotDisabled(false);
    }
  };

  let summaryWojtek = 0;
  const haveDeleted = items.filter((e) => e.removed);
  const haveSettled = items.filter((e) => e.settled && e.status === 'sprzedano' && e.settlementStatus === 'rozliczono');

  return (
    <Container sx={{ px: '0px !important', maxWidth: '100% !important', width: '100%' }}>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        {!editBlocked ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              mt: '20px',
              mr: 'auto',
              ml: '10px',
              height: '55px',
              cursor: 'pointer'
            }}
          >
            <Button
              variant="contained"
              disabled={screenshotDisabled}
              onClick={() => {
                if (screenshotDisabled) {
                  return;
                }

                if (tableRef && tableRef.current) {
                  setScreenshotDisabled(true);
                  takeScreenShot(tableRef.current);
                }
              }}
            >
              <AddAPhotoSharpIcon />
            </Button>
          </Box>
        ) : (
          <Box></Box>
        )}

        {haveDeleted.length ? (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '20px', mr: '16px' }}>
            <Button variant="contained" onClick={() => setShowDeleted((prev) => !prev)}>
              {!showDeleted ? 'Pokaż usunięte' : 'Schowaj usunięte'}
            </Button>
          </Box>
        ) : null}

        {!editBlocked && haveSettled.length ? (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '20px', mr: '16px' }}>
            <Button variant="contained" onClick={() => setHideSettled((prev) => !prev)}>
              {hideSettled ? 'Pokaż rozliczone' : 'Schowaj rozliczone'}
            </Button>
          </Box>
        ) : null}

        {!editBlocked ? (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '20px', mr: '16px' }}>
            <Button variant="contained" onClick={() => setModalOpen(true)} disabled={!currentSelected.length}>
              Rozlicz
            </Button>
          </Box>
        ) : null}
      </Box>

      <EditItems
        currentSelected={currentSelected}
        editModalOpen={modalOpen}
        getItems={getItems}
        setEditModalOpen={setModalOpen}
      />

      <Center>
        <div
          style={{ width: '100%' }} //@ts-ignore
          ref={tableRef}
        >
          {items.length ? (
            <TableContainer component={Paper} sx={{ mt: '90px', overflowX: 'initial', position: 'relative' }}>
              <Box
                sx={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: '-50px'
                }}
              >
                <Typography
                  sx={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    visibility: screenshotDisabled ? 'visible' : 'hidden'
                  }}
                >
                  data i czas zrobienia screenshota: {dateTimeValue}
                </Typography>
              </Box>
              <Table
                sx={{
                  minWidth: 1550,
                  '& .MuiTableCell-root': {
                    borderLeft: '1px solid rgba(224, 224, 224, 1)'
                  }
                }}
                stickyHeader
              >
                <TableHead
                  sx={{
                    transform: 'translateY(70px)',
                    zIndex: '1',
                    position: 'relative'
                  }}
                >
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Nazwa produktu</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                      Status
                    </TableCell>

                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                      Kwota do rozliczenia
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                      Data rozliczenia
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
                  <TableRow sx={{ height: '70px' }}>
                    <TableCell />
                  </TableRow>
                  {items
                    // @ts-ignore
                    .sort((a, b) => new Date(b.createDate) - new Date(a.createDate))
                    .map((item) => {
                      if (!item.hasOwnProperty('elementId')) {
                        return;
                      }

                      if (showDeleted && !item.removed) {
                        return;
                      }

                      if (hideSettled) {
                        if (item.settlementStatus === 'rozliczono' && item.status === 'sprzedano') {
                          return;
                        }
                      }

                      if (!showDeleted && item.removed) {
                        return;
                      }

                      const cleringWojtek = Number(item.clearingValueWojtek);

                      if (!item.removed && item.settled && item.settlementStatus === 'rozliczono') {
                      } else if (!item.removed && !item.settled && item.settlementStatus !== 'nierozliczono') {
                        summaryWojtek += cleringWojtek;
                      } else if (!item.removed && !item.settled && item.settlementStatus === 'nierozliczono') {
                        summaryWojtek -= cleringWojtek;
                      } else if (
                        !item.removed &&
                        item.status === 'zwrot' &&
                        item.settled &&
                        item.settlementStatus === 'rozliczono'
                      ) {
                        summaryWojtek -= cleringWojtek;
                      }

                      const itemSelectedFound = currentSelected.find((e) => e.id === item.id);
                      const isSelected = Boolean(itemSelectedFound);

                      const returned = item.status === 'zwrot';

                      const removedCellStyles =
                        returned && !item.settled
                          ? {
                              textDecoration: 'line-through'
                            }
                          : {};

                      return (
                        <TableRow
                          key={item.id}
                          sx={{
                            background: isSelected ? '#0000ff2e' : '#fff'
                          }}
                        >
                          <TableCell
                            component="th"
                            scope="row"
                            sx={{
                              color: returned ? 'red' : 'inherit',
                              fontWeight: returned ? 'bold' : 'inherit',
                              maxWidth: '200px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              position: 'relative',
                              ...removedCellStyles
                            }}
                          >
                            {item.productName}
                            {item.settled ? (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: '17px',
                                  right: '6px'
                                }}
                              >
                                <CheckCircleSharpIcon fontSize="small" sx={{ color: 'green ' }} />
                              </Box>
                            ) : null}
                          </TableCell>

                          <TableCell
                            align="right"
                            sx={{
                              color: returned ? 'red' : item.status === 'sprzedano' ? 'green' : 'inherit',
                              fontWeight: 'bold'
                            }}
                          >
                            {item.status}
                          </TableCell>

                          <TableCell
                            align="right"
                            sx={{
                              color: returned ? 'red' : 'inherit',
                              fontWeight: returned ? 'bold' : 'inherit'
                            }}
                          >
                            <Box sx={removedCellStyles}>
                              {item.settled && item.status === 'zwrot' && '-'}
                              {cleringWojtek.toFixed(2)}zł
                            </Box>
                          </TableCell>

                          <TableCell align="right">
                            {item.settlementDate ? dayjs(item.settlementDate).format('DD/MM/YYYY') : '-'}{' '}
                          </TableCell>

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
                              {!item.removed && item.settlementStatus !== 'rozliczono' && item.status !== 'zwrot' ? (
                                <TableCell align="right">
                                  <Button
                                    size="small"
                                    variant="contained"
                                    type="submit"
                                    disabled={item.settled}
                                    color={'primary'}
                                    onClick={() => handleMulitSettlement(item)}
                                    sx={{ ml: '20px' }}
                                  >
                                    +
                                  </Button>
                                </TableCell>
                              ) : !item.removed &&
                                item.status === 'zwrot' &&
                                !item.settled &&
                                item.settlementStatus === 'nierozliczono' ? (
                                <TableCell align="right">
                                  <Button
                                    size="small"
                                    variant="contained"
                                    type="submit"
                                    color={'error'}
                                    onClick={() => handleMulitSettlement(item)}
                                    sx={{ ml: '20px' }}
                                  >
                                    +
                                  </Button>
                                </TableCell>
                              ) : (
                                <TableCell align="right"></TableCell>
                              )}
                            </>
                          ) : (
                            <TableCell align="right"></TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  boxSizing: 'border-box',
                  width: 'auto',
                  margin: '20px'
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
              <Box sx={{ height: '50px' }} />
            </TableContainer>
          ) : (
            <Box sx={{ my: '40px' }}>Brak danych</Box>
          )}
        </div>
      </Center>
    </Container>
  );
};

export default RozliczeniaKomis;
