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
import { collection, getDocs } from '@firebase/firestore';
import { Box, Button } from '@mui/material';
import { SpendingType } from './types';
import { EditItem } from '../components/spendings/EditItem';
import { AddItem } from '../components/spendings/AddItem';
import { isAdminUser } from './helpers';
import dayjs from 'dayjs';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import * as htmlToImage from 'html-to-image';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Typography } from '@mui/material';
import AddAPhotoSharpIcon from '@mui/icons-material/AddAPhotoSharp';

interface Props {}

const Spendings = ({}: Props) => {
  const [data, setData] = useState<SpendingType[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentSelected, setCurrentSelected] = useState<SpendingType>();
  const [user] = useState(auth.currentUser);
  const editBlocked = !isAdminUser(user);
  const isStan = isAdminUser(user);

  const [showDeleted, setShowDeleted] = useState(false);

  const spendingsCollectionRef = collection(db, 'spendings');

  const getData = async () => {
    const d = await getDocs(spendingsCollectionRef);
    const items = d.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as SpendingType[];

    setData(items);
  };

  const editRow = (itemId: string) => {
    const selectedItem = data.find((item) => item.id === itemId);

    if (selectedItem) {
      setCurrentSelected(selectedItem);
      setEditModalOpen(true);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  let totalStan = 0;
  let totalWojtek = 0;

  const dateTimeValue = dayjs().format('DD-MM-YYYY-HH:mm');
  const [screenshotDisabled, setScreenshotDisabled] = useState(false);
  const storage = getStorage();
  const tableRef = createRef<HTMLElement | null>();
  const screenShotName = `wydatki_${dateTimeValue}`;
  const tableImageRef = ref(storage, `screenshots/wydatki/${screenShotName}`);

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
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        {!editBlocked ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              mt: '20px',
              mr: 'auto',
              ml: '0',
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
        {!editBlocked && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '20px', mr: '16px', height: '50px' }}>
            <Button variant="contained" onClick={() => setModalOpen(true)}>
              Dodaj
            </Button>
          </Box>
        )}
        {data.length ? (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '20px', mr: '16px', height: '50px' }}>
            <Button variant="contained" onClick={() => setShowDeleted((prev) => !prev)}>
              {!showDeleted ? 'Pokaż usunięte' : 'Schowaj usunięte'}
            </Button>
          </Box>
        ) : null}
      </Box>

      <AddItem modalOpen={modalOpen} setModalOpen={setModalOpen} getItems={getData} />

      <EditItem
        currentSelected={currentSelected}
        setEditModalOpen={setEditModalOpen}
        editModalOpen={editModalOpen}
        getItems={getData}
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
                    <TableCell sx={{ fontWeight: 'bold' }}>Nazwa wydatku</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                      Kwota
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                      Data dodania
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                      Kto wydał
                    </TableCell>
                    {!editBlocked ? (
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        Akcja
                      </TableCell>
                    ) : null}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data // @ts-ignore
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .map((d) => {
                      if (!showDeleted && d.removed) {
                        return;
                      }

                      const removedCellStyles = d.removed
                        ? {
                            textDecoration: 'line-through',
                            fontWeight: 'bold',
                            color: 'red'
                          }
                        : {};
                        
                      if (!d.removed) {
                        if (d.addedBy === 'Wojtek dla Stan') {
                          //@ts-ignore
                          totalWojtek += parseFloat(d.amount);
                        }

                        if (d.addedBy === 'Stan dla Wojtek') {
                          //@ts-ignore
                          totalStan += parseFloat(d.amount);
                        }

                        if (d.addedBy === 'Wojtek') {
                          //@ts-ignore
                          totalWojtek += parseFloat(d.amount);
                        } else if (d.addedBy === 'Stan') {
                          //@ts-ignore
                          totalStan += parseFloat(d.amount);
                        }

                        if (d.addedBy === 'Stan / 2') {
                          //@ts-ignore
                          totalStan += parseFloat(d.amount);
                          //@ts-ignore
                          totalWojtek += parseFloat(d.amount / 2);
                        } else if (d.addedBy === 'Wojtek / 2') {
                          //@ts-ignore
                          totalStan += parseFloat(d.amount / 2);
                          //@ts-ignore
                          totalWojtek += parseFloat(d.amount);
                        }
                      }

                      return (
                        <TableRow key={d.id}>
                          <TableCell component="th" scope="row" sx={removedCellStyles}>
                            {d.elementName}
                          </TableCell>
                          <TableCell component="th" scope="row" align="right" sx={removedCellStyles}>
                            {/* @ts-ignore */}
                            {parseFloat(d.amount).toFixed(2)}zł
                          </TableCell>
                          <TableCell component="th" scope="row" align="right">
                            {dayjs(d.createdAt).format('DD/MM/YYYY')}
                          </TableCell>
                          <TableCell component="th" scope="row" align="right">
                            {d.addedBy}
                          </TableCell>
                          {!editBlocked && !d.removed ? (
                            <TableCell component="th" scope="row" align="right">
                              <Button size="small" variant="contained" type="submit" onClick={() => editRow(d.id)}>
                                Edytuj
                              </Button>
                            </TableCell>
                          ) : (
                            <TableCell />
                          )}
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
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '40px' }}>
                  {isStan
                    ? totalStan - totalWojtek > 0
                      ? 'do odebrania od Wojtka:'
                      : 'do oddania Wojtkowi:'
                    : totalWojtek - totalStan > 0
                    ? 'do odebrania od Staszka:'
                    : 'do oddania Staszkowi:'}
                  <Box sx={{ fontWeight: 'bold', marginLeft: '10px', minWidth: '150px', textAlign: 'end' }}>
                    {isStan
                      ? Math.abs(totalStan - totalWojtek).toFixed(2)
                      : Math.abs(totalWojtek - totalStan).toFixed(2)}
                    zł
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

export default withLayout(Spendings);
