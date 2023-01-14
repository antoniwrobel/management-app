import { useEffect, useMemo, useState, createRef, RefObject } from 'react';

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
import CheckCircleSharpIcon from '@mui/icons-material/CheckCircleSharp';

import DeleteOutlineSharpIcon from '@mui/icons-material/DeleteOutlineSharp';
import { auth, db } from '../config/firebase';
import { ItemType, SettlementItemType, SpendingType, ValveType } from './types';
import { collection, getDocs, addDoc, updateDoc, doc } from '@firebase/firestore';
import { AddItem } from '../components/inventory/AddItem';
import { EditItem } from '../components/inventory/EditItem';
import { AddToValveModal } from '../components/inventory/AddToValveModal';
import { ConfirmationModal } from '../components/modal/ConfirmationModal';
import { isAdminUser, useLocalStorage } from './helpers';
import { styled, TextField, Tooltip, tooltipClasses, TooltipProps } from '@mui/material';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

import cloneDeep from 'lodash.clonedeep';
import debounce from 'lodash.debounce';

import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import ListItemText from '@mui/material/ListItemText';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';

import * as htmlToImage from 'html-to-image';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { getStorage, ref, uploadBytes } from 'firebase/storage';
import AddAPhotoSharpIcon from '@mui/icons-material/AddAPhotoSharp';

import dayjs from 'dayjs';
import Typography from '@mui/material/Typography';

const MagazynKomis = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [valveModalOpen, setValveModalOpen] = useState(false);

  const [returnConfirmationOpen, setReturnConfirmationOpen] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [currentSelected, setCurrentSelected] = useState<ItemType>();
  const [items, setItems] = useState<ItemType[]>([]);
  const [itemsAll, setItemsAll] = useState<ItemType[]>([]);

  const [user] = useState(auth.currentUser);

  const itemsCollectionRef = collection(db, 'items');
  const spendingsCollectionRef = collection(db, 'spendings');
  const valveCollectionRef = collection(db, 'valve');
  const settlementsCollectionRef = collection(db, 'settlements');

  const [showDeleted, setShowDeleted] = useState(false);
  const [sortedBy, setSortedBy] = useState('');
  const [direction, setDireciton] = useState<{
    [key: string]: string;
  }>({});

  const defCols = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const names = [
    'Nazwa produktu',
    'Status zamówienia',
    'Kwota zakupu',
    'Kwota sprzedaży',
    'Koszt wysyłki',
    'Zapłacono łącznie',
    'Prowizja od sprzedaży',
    'Saldo Stan',
    'Saldo Wojtek',
    'Data stworzenia',
    'Uwagi',
    'Akcje'
  ];

  const defff = [
    'Nazwa produktu',
    'Status zamówienia',
    'Kwota zakupu',
    'Kwota sprzedaży',
    'Koszt wysyłki',
    'Zapłacono łącznie',
    'Prowizja od sprzedaży',
    'Saldo Stan',
    'Saldo Wojtek',
    'Data stworzenia',
    'Uwagi',
    'Akcje'
  ];

  const [columnsVisible, setColumnsVisible] = useLocalStorage('columnsVisible', defCols);
  const [personName, setPersonName] = useLocalStorage<string[]>('personName', defff);

  const editBlocked = !isAdminUser(user);

  const getItems = async () => {
    const data = await getDocs(itemsCollectionRef);
    const items = data.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as ItemType[];

    const deafultSortedItems = handleItemsOrder(items);

    setItems(deafultSortedItems);
    setItemsAll(deafultSortedItems);
  };

  useEffect(() => {
    getItems();
  }, []);

  const handleItemsOrder = (items: ItemType[]) => {
    const itemsToUpdate = cloneDeep(items);
    const deafultSortedItems =
      sortedBy === 'status'
        ? itemsToUpdate
            .sort((a, b) => new Date(b.createDate).getTime() - new Date(a.createDate).getTime())
            .sort((a, b) => {
              if (direction.status === 'asc') {
                return a.status === b.status ? 0 : a.status === 'sprzedano' ? -1 : 1;
              } else {
                return a.status === b.status ? 0 : a.status === 'sprzedano' ? 1 : -1;
              }
            })
        : sortedBy === 'createdDate'
        ? itemsToUpdate
            .sort((a, b) => new Date(b.createDate).getTime() - new Date(a.createDate).getTime())
            .sort((a, b) => {
              if (direction.createdDate === 'asc') {
                return new Date(b.createDate).getTime() - new Date(a.createDate).getTime();
              } else {
                return new Date(a.createDate).getTime() - new Date(b.createDate).getTime();
              }
            })
        : itemsToUpdate.sort((a, b) => new Date(b.createDate).getTime() - new Date(a.createDate).getTime());

    return deafultSortedItems;
  };

  useEffect(() => {
    const deafultSortedItems = handleItemsOrder(items);
    setItems(deafultSortedItems);
  }, [direction, sortedBy]);

  useEffect(() => {
    const b = cloneDeep(itemsAll);
    const u = b.filter((e) => e.productName.toLowerCase().includes(searchTerm.trim()));

    setItems(u);
  }, [searchTerm]);

  useEffect(() => {
    return () => {
      debouncedResults.cancel();
    };
  });

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

    const spend = await getDocs(spendingsCollectionRef);
    const spendings = spend.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as SpendingType[];
    const spending = spendings.find((item) => item.elementId === id);

    if (settlement) {
      const settlementsDoc = doc(db, 'settlements', settlement.id);

      await updateDoc(settlementsDoc, {
        status: 'zwrot',
        removed: !item.settled && true,
        ...(item.provision &&
          item.provision > 0 && {
            details: currentSelected?.details
              ? currentSelected.details + ` - zwrot - poniesione koszta ${item.provision!.toFixed(2)}zł`
              : `zwrot - poniesione koszta: ${item.provision!.toFixed(2)}zł`
          })
      });
    }

    await updateDoc(itemDoc, {
      status: 'zwrot',
      color: '#fff',
      valueTransferedToValve: 0
    });

    if (provision && provision > 0) {
      if (!item.provisionPayed) {
        await addDoc(spendingsCollectionRef, {
          elementId: id,
          elementName: productName,
          amount: provision,
          addedBy: 'Stan',
          createdAt: dayjs().format()
        });
      } else {
        if (spending) {
          const spendingDoc = doc(db, 'spendings', spending.id);
          await updateDoc(spendingDoc, {
            addedBy: 'Stan'
          });
        }
      }
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

  const haveRemoved = items.filter((e) => e.removed);

  const debouncedResults = useMemo(() => {
    return debounce(setSearchTerm, 500);
  }, []);

  const handleChange = (event: SelectChangeEvent<typeof personName>) => {
    const {
      target: { value }
    } = event;
    setPersonName(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value
    );
  };

  useEffect(() => {
    const currentIds = names
      .map((tabName, id) => {
        if (personName.includes(tabName)) {
          return id;
        }
      })
      .filter((x) => x !== undefined);

    if (currentIds) {
      //@ts-ignore
      setColumnsVisible(currentIds);
    }
  }, [personName]);

  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: '550px'
      }
    }
  };

  const dateTimeValue = dayjs().format('DD-MM-YYYY-HH:mm');
  const [screenshotDisabled, setScreenshotDisabled] = useState(false);
  const storage = getStorage();
  const tableRef = createRef<HTMLElement | null>();
  const screenShotName = `magazyn_${dateTimeValue}`;

  const tableImageRef = ref(storage, `screenshots/magazyn/${screenShotName}`);

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
    <Container sx={{ px: '0px !important', maxWidth: '100% !important', width: '100%', position: 'relative' }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
        <Box display="flex">
          <FormControl sx={{ m: 1, width: 500, mt: '20px', mr: '16px' }}>
            <InputLabel id="demo-multiple-checkbox-label">Pokaż kolumny</InputLabel>
            <Select
              labelId="demo-multiple-checkbox-label"
              id="demo-multiple-checkbox"
              multiple
              value={personName}
              onChange={handleChange}
              input={<OutlinedInput label="Pokaż kolumny" />}
              renderValue={(selected) => selected.join(', ')}
              MenuProps={MenuProps}
            >
              {names.map((name) => (
                <MenuItem key={name} value={name}>
                  <Checkbox checked={personName.indexOf(name) > -1} />
                  <ListItemText primary={name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

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

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '20px', mr: '16px', height: '55px' }}>
            <Button
              variant="contained"
              disabled={columnsVisible.length === defCols.length}
              onClick={() => {
                setColumnsVisible(defCols);
                setPersonName(defff);
              }}
            >
              <DeleteOutlineSharpIcon />
            </Button>
          </Box>
        </Box>

        {!editBlocked ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              mt: '20px',
              mr: '16px',
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

        <Box sx={{ display: 'flex', justifyContent: 'space-between', ml: 'auto' }}>
          <TextField
            sx={{ mt: '20px', mr: '16px' }}
            type="text"
            label="wyszukaj po nazwie"
            variant="outlined"
            onChange={(e) => debouncedResults(e.target.value)}
          />

          {!editBlocked && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '20px', mr: '16px', height: '55px' }}>
              <Button variant="contained" onClick={() => setModalOpen(true)}>
                Dodaj
              </Button>
            </Box>
          )}

          {haveRemoved.length ? (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '20px', mr: '16px', height: '55px' }}>
              <Button variant="contained" onClick={() => setShowDeleted((prev) => !prev)}>
                {!showDeleted ? 'Pokaż usunięte' : 'Schowaj usunięte'}
              </Button>
            </Box>
          ) : null}
        </Box>
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
        {haveItems ? (
          <TableContainer
            component={Paper}
            sx={{ mt: '20px', overflowX: 'initial', position: 'relative', mb: '20px' }}
            //@ts-ignore
            ref={tableRef}
          >
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: '20px'
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
                  {columnsVisible.includes(0) && <TableCell sx={{ fontWeight: 'bold' }}>Nazwa produktu</TableCell>}
                  {columnsVisible.includes(1) && (
                    <TableCell
                      align="center"
                      sx={{
                        whiteSpace: 'nowrap',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        setSortedBy('status');
                        setDireciton((prev) =>
                          prev.status === 'asc' ? { ...prev, status: 'desc' } : { ...prev, status: 'asc' }
                        );
                      }}
                    >
                      Status <br />
                      zamówienia
                      {sortedBy === 'status' ? (
                        <Box sx={{ position: 'absolute', top: 0, right: 0 }}>
                          {direction.status === 'asc' ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                        </Box>
                      ) : null}
                    </TableCell>
                  )}

                  {columnsVisible.includes(2) && (
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                      Kwota <br />
                      zakupu
                    </TableCell>
                  )}
                  {columnsVisible.includes(3) && (
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                      Kwota <br />
                      sprzedazy
                    </TableCell>
                  )}
                  {columnsVisible.includes(4) && (
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                      Koszt <br />
                      wysyłki
                    </TableCell>
                  )}
                  {columnsVisible.includes(5) && (
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                      Zapłacono <br />
                      łącznie
                    </TableCell>
                  )}
                  {columnsVisible.includes(6) && (
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                      Prowizja <br /> od sprzedaży
                    </TableCell>
                  )}
                  {columnsVisible.includes(7) && (
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                      Saldo <br />
                      Stan
                    </TableCell>
                  )}
                  {columnsVisible.includes(8) && (
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                      Saldo <br />
                      Wojtek
                    </TableCell>
                  )}
                  {columnsVisible.includes(9) && (
                    <TableCell
                      align="center"
                      sx={{
                        whiteSpace: 'nowrap',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        setSortedBy('createdDate');
                        setDireciton((prev) =>
                          prev.createdDate === 'asc'
                            ? { ...prev, createdDate: 'desc' }
                            : { ...prev, createdDate: 'asc' }
                        );
                      }}
                    >
                      Data <br />
                      stworzenia
                      {sortedBy === 'createdDate' ? (
                        <Box sx={{ position: 'absolute', top: 0, right: 0 }}>
                          {direction.createdDate === 'asc' ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                        </Box>
                      ) : null}
                    </TableCell>
                  )}
                  {columnsVisible.includes(10) && (
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                      Uwagi
                    </TableCell>
                  )}
                  {columnsVisible.includes(11) && !editBlocked ? (
                    <TableCell align="right" sx={{ minWidth: '250px' }}>
                      Akcja
                    </TableCell>
                  ) : null}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow sx={{ height: '70px' }}>
                  <TableCell />
                </TableRow>
                {items.map((item) => {
                  if (!showDeleted && item.removed) {
                    return;
                  }

                  summaryStan += item.clearingValueStan || 0;

                  const removedCellStyles =
                    item.status === 'zwrot'
                      ? {
                          textDecoration: 'line-through'
                        }
                      : {};

                  return (
                    <TableRow key={item.id} sx={{ backgroundColor: `${item.color}26` }}>
                      {columnsVisible.includes(0) && (
                        <TableCell
                          component="th"
                          scope="row"
                          sx={{
                            color: item.status === 'zwrot' ? 'red' : 'inherit',
                            fontWeight: item.status === 'zwrot' ? 'bold' : 'inherit',
                            position: 'relative',
                            ...removedCellStyles
                          }}
                        >
                          <BootstrapTooltip
                            title={item.productName}
                            placement="bottom-start"
                            arrow
                            sx={{ fontSize: '18px' }}
                          >
                            <Box sx={{ whiteSpace: 'nowrap' }}>
                              {item.url ? (
                                <a href={item.url} target="_blank" rel="noreferrer">
                                  {item.productName}
                                </a>
                              ) : (
                                item.productName
                              )}

                              {item.settled && item.status !== 'zwrot' ? (
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
                            </Box>
                          </BootstrapTooltip>
                        </TableCell>
                      )}

                      {columnsVisible.includes(1) && (
                        <TableCell
                          align="right"
                          sx={{
                            color: item.status === 'zwrot' ? 'red' : item.status === 'sprzedano' ? 'green' : 'inherit',
                            fontWeight: 'bold'
                          }}
                        >
                          {item.status}
                        </TableCell>
                      )}

                      {columnsVisible.includes(2) && (
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
                      )}

                      {columnsVisible.includes(3) && (
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
                      )}

                      {columnsVisible.includes(4) && (
                        <TableCell
                          align="right"
                          sx={{
                            color: item.status === 'zwrot' ? 'red' : 'inherit',
                            fontWeight: item.status === 'zwrot' ? 'bold' : 'inherit',
                            ...removedCellStyles
                          }}
                        >
                          {item.sendCost ? `${item.sendCost}zł` : '-'}{' '}
                        </TableCell>
                      )}

                      {columnsVisible.includes(5) && (
                        <TableCell
                          align="right"
                          sx={{
                            color: item.status === 'zwrot' ? 'red' : 'inherit',
                            fontWeight: item.status === 'zwrot' ? 'bold' : 'inherit'
                          }}
                        >
                          {item.status === 'sprzedano' ? item.sendCost + item.saleAmount + 'zł' : '-'}
                        </TableCell>
                      )}
                      {columnsVisible.includes(6) && (
                        <TableCell
                          align="right"
                          sx={{
                            color: item.status === 'zwrot' ? 'red' : 'inherit',
                            fontWeight: item.status === 'zwrot' ? 'bold' : 'inherit'
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: item.provisionPayed ? 'space-around' : 'right' }}>
                            {item.provision ? item.provision.toFixed(2) + 'zł' : '-'}
                            {item.provisionPayed ? (
                              <CheckCircleSharpIcon fontSize="small" sx={{ color: 'green ' }} />
                            ) : null}
                          </Box>
                        </TableCell>
                      )}
                      {columnsVisible.includes(7) && (
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
                      )}
                      {columnsVisible.includes(8) && (
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
                      )}
                      {columnsVisible.includes(9) && (
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
                      )}
                      {columnsVisible.includes(10) && (
                        <TableCell
                          align="right"
                          sx={{
                            color: item.status === 'zwrot' ? 'red' : 'inherit',
                            fontWeight: item.status === 'zwrot' ? 'bold' : 'inherit',
                            maxWidth: '200px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            textAlign: 'left'
                          }}
                        >
                          {item.details}
                        </TableCell>
                      )}
                      {columnsVisible.includes(11) && !editBlocked ? (
                        <>
                          <TableCell align="right" sx={{ padding: '15px 10px 15px 0' }}>
                            {item.status === 'sprzedano' ? (
                              <>
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
                                  {!item.settled && (
                                    <Button
                                      size="small"
                                      variant="contained"
                                      type="submit"
                                      onClick={() => handleValve(item.id)}
                                      sx={{ ml: '20px' }}
                                    >
                                      $$$
                                    </Button>
                                  )}
                                </>
                              </>
                            ) : null}

                            {!item.removed && (
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
                        </>
                      ) : null}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <Box sx={{ height: '50px' }} />
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
          <Box sx={{ fontWeight: 'bold', marginLeft: '10px', textAlign: 'end' }}>{summaryStan.toFixed(2)}zł</Box>
        </Box>
      </Box>
    </Container>
  );
};

export default MagazynKomis;