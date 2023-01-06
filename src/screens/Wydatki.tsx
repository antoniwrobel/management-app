import { useEffect, useState } from 'react';
import Center from '../components/utils/Center';
import withLayout from '../components/layout/withLayout';
import { auth, db } from '../config/firebase';
import { collection, getDocs } from '@firebase/firestore';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import Paper from '@mui/material/Paper';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';
import { Box, Button } from '@mui/material';
import { SpendingType, ValveType } from './types';
import { EditItem } from '../components/spendings/EditItem';
import { AddItem } from '../components/spendings/AddItem';
import { isAdminUser } from './helpers';

interface Props {}

const Spendings = ({}: Props) => {
  const [data, setData] = useState<SpendingType[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentSelected, setCurrentSelected] = useState<SpendingType>();
  const [user] = useState(auth.currentUser);
  const editBlocked = !isAdminUser(user);

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

  let total = 0;

  //dodac funkcje dodawania // edycji wydatków

  return (
    <Container sx={{ p: '0px !important', m: '24px', maxWidth: '100% !important', width: 'auto' }}>
      {!editBlocked && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '20px', mr: '10px' }}>
          <Button variant="contained" onClick={() => setModalOpen(true)}>
            Dodaj
          </Button>
        </Box>
      )}

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
            <Table sx={{ minWidth: 1550 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Nazwa wydatku</TableCell>
                  <TableCell align="right">kwota</TableCell>
                  <TableCell align="right">data dodania</TableCell>
                  <TableCell align="right">kto dodał</TableCell>
                  <TableCell align="right">akcja</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((d) => {
                  total += d.amount;
                  return (
                    <TableRow key={d.id}>
                      <TableCell component="th" scope="row">
                        {d.addedBy === 'automat' ? `zwrot - ${d.elementName}` : d.elementName}
                      </TableCell>
                      <TableCell component="th" scope="row" align="right">
                        {d.amount.toFixed(2)}zł
                      </TableCell>
                      <TableCell component="th" scope="row" align="right">
                        {d.createdAt}
                      </TableCell>
                      <TableCell component="th" scope="row" align="right">
                        {d.addedBy}
                      </TableCell>
                      <TableCell component="th" scope="row" align="right">
                        {!editBlocked && (
                          <Button size="small" variant="contained" type="submit" onClick={() => editRow(d.id)}>
                            Edytuj
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <Box
              sx={{
                minWidth: 1550,
                padding: '16px',
                display: 'flex',
                flexDirection: 'column'
              }}
            ></Box>
          </TableContainer>
        ) : (
          <Box sx={{ my: '40px' }}>Brak danych</Box>
        )}
      </Center>
      {data.length > 0 ? (
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
        </Box>
      ) : null}
    </Container>
  );
};

export default withLayout(Spendings);
