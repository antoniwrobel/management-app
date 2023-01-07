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
import { useEffect, useState } from 'react';
import { collection, getDocs } from '@firebase/firestore';
import { Box, Button } from '@mui/material';
import { SpendingType } from './types';
import { EditItem } from '../components/spendings/EditItem';
import { AddItem } from '../components/spendings/AddItem';
import { isAdminUser } from './helpers';
import dayjs from 'dayjs';

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

  return (
    <Container sx={{ p: '0px !important', m: '24px', maxWidth: '100% !important', width: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        {!editBlocked && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '20px', mr: '16px' }}>
            <Button variant="contained" onClick={() => setModalOpen(true)}>
              Dodaj
            </Button>
          </Box>
        )}
        {data.length ? (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '20px', mr: '16px' }}>
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
        {data.length ? (
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
                      if (d.addedBy === 'Wojtek') {
                        totalWojtek += d.amount;
                      } else if (d.addedBy === 'Stan') {
                        totalStan += d.amount;
                      }
                    }

                    return (
                      <TableRow key={d.id}>
                        <TableCell component="th" scope="row" sx={removedCellStyles}>
                          {d.elementName}
                        </TableCell>
                        <TableCell component="th" scope="row" align="right" sx={removedCellStyles}>
                          {d.amount.toFixed(2)}zł
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
          Suma wydatków Stan:
          <Box sx={{ fontWeight: 'bold', marginLeft: '10px', minWidth: '150px', textAlign: 'end' }}>
            {totalStan.toFixed(2)}zł
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          Suma wydatków Wojtek:
          <Box sx={{ fontWeight: 'bold', marginLeft: '10px', minWidth: '150px', textAlign: 'end' }}>
            {totalWojtek.toFixed(2)}zł
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '40px' }}>
          {isStan
            ? totalStan - totalWojtek > 0
              ? 'do odebrania od Wojtka:'
              : 'do oddania Wojtkowi:'
            : totalWojtek - totalStan > 0
            ? 'do odebrania od Staszka:'
            : 'do oddania Staszkowi:'}
          <Box sx={{ fontWeight: 'bold', marginLeft: '10px', minWidth: '150px', textAlign: 'end' }}>
            {isStan ? Math.abs(totalStan - totalWojtek).toFixed(2) : Math.abs(totalWojtek - totalStan).toFixed(2)}zł
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default withLayout(Spendings);
