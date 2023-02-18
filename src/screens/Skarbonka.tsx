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

import { auth, db } from '../config/firebase';
import { createRef, useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc } from '@firebase/firestore';
import { Box, Button } from '@mui/material';
import { ItemType, ValveType } from './types';
import dayjs from 'dayjs';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import * as htmlToImage from 'html-to-image';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Typography } from '@mui/material';
import { isAdminUser } from './helpers';
import AddAPhotoSharpIcon from '@mui/icons-material/AddAPhotoSharp';
import { EditItems } from '../components/valve/EditItem';

const Skarbonka = () => {
  const [data, setData] = useState<ValveType[]>([]);
  const [details, setDetails] = useState<ItemType>();
  const [showDeleted, setShowDeleted] = useState(false);

  const [currentSelected, setCurrentSelected] = useState<ValveType[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const valveCollectionRef = collection(db, 'valve');

  const getData = async () => {
    const d = await getDocs(valveCollectionRef);
    const items = d.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as ValveType[];

    setData(items);
  };

  useEffect(() => {
    getData();
  }, []);

  const handleMulitSettlement = (item: ValveType) => {
    const itemAdded = currentSelected.find((currentSelected) => currentSelected.id === item.id);

    if (itemAdded) {
      const updatedCurrentSelected = currentSelected.filter((e) => e.id !== item.id);
      setCurrentSelected(updatedCurrentSelected);
    } else {
      setCurrentSelected((prev) => [...prev, item]);
    }
  };

  useEffect(() => {
    if (!details) return;
    console.info('deatils ->', { details });
  }, [details]);

  let total = 0;
  const [user] = useState(auth.currentUser);
  const editBlocked = !isAdminUser(user);

  const dateTimeValue = dayjs().format('DD-MM-YYYY-HH:mm');
  const [screenshotDisabled, setScreenshotDisabled] = useState(false);
  const storage = getStorage();
  const tableRef = createRef<HTMLElement | null>();
  const screenShotName = `skarbonka_${dateTimeValue}`;
  const tableImageRef = ref(storage, `screenshots/skarbonka/${screenShotName}`);

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

  return (
    <Container sx={{ p: '0px !important', m: '24px', maxWidth: '100% !important', width: 'auto' }}>
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

      {data.length ? (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '20px', mr: '16px' }}>
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
          <Button variant="contained" sx={{ height: '50px' }} onClick={() => setShowDeleted((prev) => !prev)}>
            {!showDeleted ? 'Pokaż usunięte' : 'Schowaj usunięte'}
          </Button>
        </Box>
      ) : null}

      {!editBlocked ? (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '20px', mr: '16px' }}>
          <Button variant="contained" onClick={() => setModalOpen(true)} disabled={!currentSelected.length}>
            Wypłać
          </Button>
        </Box>
      ) : null}

      <EditItems
        currentSelected={currentSelected}
        editModalOpen={modalOpen}
        getItems={getData}
        setEditModalOpen={setModalOpen}
      />

      <Center>
        <div
          style={{ width: '100%' }}
          //@ts-ignore
          ref={tableRef}
        >
          {data.length ? (
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
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Nazwa potrącenia</TableCell>

                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                      Kwota
                    </TableCell>

                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                      Data dodania
                    </TableCell>

                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                      Uwagi
                    </TableCell>

                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      Akcja
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data // @ts-ignore
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .map((d) => {
                      if (!showDeleted && d.removed) {
                        return;
                      }

                      if (!d.removed && !d.hasBeenUsed) {
                        total += d.amount;
                      }

                      const removedCellStyles = d.removed
                        ? {
                            textDecoration: 'line-through'
                          }
                        : {};

                      const itemSelectedFound = currentSelected.find((e) => e.id === d.id);
                      const isSelected = Boolean(itemSelectedFound);

                      return (
                        <TableRow
                          key={d.id}
                          onClick={async () => {
                            const docRef = doc(db, 'items', d.elementId);
                            const docSnap = await getDoc(docRef);
                            const data = docSnap.data() as ItemType;
                            setDetails(data);
                          }}
                          sx={{
                            background: isSelected ? '#0000ff2e' : d.hasBeenUsed ? '#f9f214' : '#fff'
                          }}
                        >
                          <TableCell
                            component="th"
                            scope="row"
                            sx={{
                              color: d.removed ? 'red' : 'inherit',
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
                                {d.amount.toFixed(2)}zł
                              </Box>
                            ) : (
                              <Box>{d.amount.toFixed(2)}zł</Box>
                            )}
                          </TableCell>
                          <TableCell component="th" scope="row" align="right">
                            {dayjs(d.createdAt).format('DD/MM/YYYY')}
                          </TableCell>
                          <TableCell component="th" scope="row" align="right">
                            {d.details ? d.details : '-'}
                          </TableCell>
                          {!d.hasBeenUsed ? (
                            <TableCell align="right">
                              <Button
                                size="small"
                                variant="contained"
                                type="submit"
                                onClick={() => handleMulitSettlement(d)}
                                sx={{ ml: '20px' }}
                              >
                                +
                              </Button>
                            </TableCell>
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
                  margin: '40px 20px 0',
                  padding: '16px'
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
        </div>
      </Center>
    </Container>
  );
};

export default withLayout(Skarbonka);
