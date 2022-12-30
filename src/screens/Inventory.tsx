import { useEffect, useState } from 'react';

import withLayout from '../components/layout/withLayout';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Center from '../components/utils/Center';
import AddItemModal from '../components/modal/Modal';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';

import { Formik } from 'formik';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { Checkbox, FormControlLabel, useMediaQuery } from '@mui/material';

import { auth, db } from '../config/firebase';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from '@firebase/firestore';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import Paper from '@mui/material/Paper';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import dayjs from 'dayjs';

import EditModal from '../components/modal/EditModal';
import ValveModal from '../components/modal/ValveModal';

function randomInteger(max: number) {
  return Math.floor(Math.random() * (max + 1));
}

function randomRgbColor() {
  let r = randomInteger(255);
  let g = randomInteger(255);
  let b = randomInteger(255);
  return [r, g, b];
}
function randomHexColor() {
  let [r, g, b] = randomRgbColor();
  let hr = r.toString(16).padStart(2, '0');
  let hg = g.toString(16).padStart(2, '0');
  let hb = b.toString(16).padStart(2, '0');
  return '#' + hr + hg + hb;
}
function getColor() {
  return randomHexColor();
}

const inputs = [
  {
    type: 'text',
    name: 'productName',
    label: 'nazwa produktu',
    fullWidth: true
  },
  {
    type: 'number',
    name: 'quantity',
    label: 'ilość',
    addOnly: true
  },
  {
    type: 'select',
    options: ['nowe', 'używane'],
    name: 'condition',
    label: 'stan'
  },
  {
    type: 'select',
    options: ['utworzono', 'oczekuję na płatność', 'sprzedano'],
    name: 'status',
    label: 'status',
    fullWidth: true,
    editOnly: true
  },
  {
    type: 'number',
    name: 'provision',
    label: 'prowizja',
    fullWidth: true
  },
  {
    type: 'number',
    name: 'purchaseAmount',
    label: 'kwota zakupu'
  },
  {
    type: 'number',
    name: 'saleAmount',
    label: 'kwota sprzedazy'
  },
  {
    type: 'date',
    name: 'createDate',
    label: 'data stworzenia',
    fullWidth: true
  },
  {
    type: 'text',
    name: 'details',
    label: 'uwagi',
    fullWidth: true
  }
];

export type ItemType = {
  id: string;
  productName: string;
  purchaseAmount: number;
  saleAmount: number;
  index: string;
  status: string;
  condition: string;
  details: string;
  createDate: Date;
  soldDate: Date;
  provision: number;
  valueTransferedToValve: number;
  color: string;
};

const Inventory = () => {
  useEffect(() => {}, []);
  const matches = useMediaQuery('(max-width:500px)');

  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [valveModalOpen, setValveModalOpen] = useState(false);

  const [currentSelected, setCurrentSelected] = useState<ItemType>();
  const [items, setItems] = useState<ItemType[]>([]);

  const itemsCollectionRef = collection(db, 'items');
  const valveCollectionRef = collection(db, 'valve');
  const [user] = useState(auth.currentUser);

  const getItems = async () => {
    const data = await getDocs(itemsCollectionRef);
    const items = data.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as ItemType[];

    setItems(items);
  };

  const handleDeleteItem = async (itemId: string) => {
    deleteDoc(doc(db, 'items', itemId));
  };

  useEffect(() => {
    getItems();
  }, []);

  const initialValues = {
    productName: '',
    status: '',
    quantity: '',
    condition: '',
    purchaseAmount: '',
    color: '',
    provision: '',
    saleAmount: '',
    createDate: dayjs().format(),
    details: ''
  };

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

  let summaryWojt = 0;
  let summaryStan = 0;

  return (
    <Container sx={{ p: '20px', maxWidth: 'calc(100% - 20px)!important' }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={() => setModalOpen(true)}>
          Dodaj
        </Button>
      </Box>

      <AddItemModal open={modalOpen}>
        <Formik
          initialValues={initialValues}
          validate={(values) => {
            const errors = {} as any;
            const purchaseAmount = values.purchaseAmount as string | number;
            const saleAmount = values.saleAmount as string | number;

            if (!values.productName) {
              errors.productName = 'Nazwa produktu wymagana';
            }

            if (!purchaseAmount) {
              errors.purchaseAmount = 'Kwota zakupu wymagana';
            }

            if (purchaseAmount <= 0) {
              errors.purchaseAmount = 'Kwota zakupu musi być większa od 0';
            }

            if (saleAmount !== '' && saleAmount <= 0) {
              errors.saleAmount = 'Kwota sprzedaży musi być większa od 0';
            }

            if (values.createDate === 'Invalid Date') {
              errors.createDate = 'Błędny format daty';
            }

            if (values.status === 'sprzedano') {
              if (!values.saleAmount) {
                errors.saleAmount = 'Kwota zakupu musi być większa od 0';
              }
            }

            return errors;
          }}
          onSubmit={async (values, { setSubmitting }) => {
            const color = getColor();
            //@ts-ignore
            const addDocumentPromises = [...Array(parseInt(values.quantity) || 1).keys()].map(() =>
              addDoc(itemsCollectionRef, {
                createDate: values.createDate,
                productName: values.productName,
                purchaseAmount: values.purchaseAmount,
                saleAmount: values.saleAmount || null,
                provision: values.provision || null,
                status: 'utworzono',
                condition: values.condition,
                details: values.details,
                color
              })
            );

            await Promise.all(addDocumentPromises);

            getItems();
            setSubmitting(false);
            setModalOpen(false);
          }}
        >
          {({ setFieldValue, values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => {
            return (
              <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                    {inputs.map((input, index) => {
                      if (input.editOnly) {
                        return;
                      }
                      return (
                        <Box
                          sx={{
                            gridColumn: matches ? 'span 4' : input.fullWidth ? 'span 4' : 'span 2'
                          }}
                          key={index}
                        >
                          {input.type === 'date' ? (
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                              <Stack spacing={3}>
                                <DesktopDatePicker
                                  label={input.label}
                                  inputFormat="DD/MM/YYYY"
                                  //@ts-ignore
                                  value={values[input.name]}
                                  onChange={(d) => {
                                    setFieldValue(input.name, dayjs(d).format());
                                  }}
                                  renderInput={(params) => {
                                    return (
                                      <TextField
                                        {...params}
                                        datatype="date"
                                        type="date"
                                        //@ts-ignore
                                        helperText={errors[input.name]}
                                      />
                                    );
                                  }}
                                />
                              </Stack>
                            </LocalizationProvider>
                          ) : input.type === 'select' ? (
                            <FormControl fullWidth>
                              <InputLabel id="demo-simple-select-label">{input.label}</InputLabel>
                              <Select
                                labelId="demo-simple-select-label"
                                id="demo-simple-select"
                                //@ts-ignore
                                value={values[input.name]}
                                label={input.label}
                                onChange={(d) => {
                                  setFieldValue(input.name, d.target.value);
                                }}
                              >
                                {input.options?.map((option) => {
                                  return (
                                    <MenuItem key={option} value={option}>
                                      {option}
                                    </MenuItem>
                                  );
                                })}
                              </Select>
                            </FormControl>
                          ) : input.type === 'checkbox' ? (
                            <FormControlLabel
                              sx={{
                                '& .MuiFormControlLabel-label': {
                                  userSelect: 'none'
                                }
                              }}
                              control={
                                <Checkbox
                                  name={input.name}
                                  onChange={(v) => {
                                    const value = v.target.value === 'on' ? true : false;
                                    setFieldValue(input.name, value);
                                  }}
                                />
                              }
                              label={input.label}
                            />
                          ) : (
                            <TextField
                              type={input.type}
                              name={input.name}
                              label={input.label}
                              variant="outlined"
                              //@ts-ignore
                              error={touched[input.name] && Boolean(errors[input.name])}
                              //@ts-ignore
                              helperText={touched[input.name] && errors[input.name]}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              //@ts-ignore
                              value={values[input.name]}
                              fullWidth
                            />
                          )}
                        </Box>
                      );
                    })}
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '20px' }}>
                    <Button
                      variant="outlined"
                      sx={{ mr: '10px' }}
                      color="error"
                      onClick={() => setModalOpen(false)}
                      size="small"
                    >
                      Zamknij
                    </Button>
                    <Button variant="outlined" size="small" type="submit" disabled={isSubmitting}>
                      Zapisz
                    </Button>
                  </Box>
                </Box>
              </form>
            );
          }}
        </Formik>
      </AddItemModal>

      <EditModal open={editModalOpen}>
        <Formik
          initialValues={{
            createDate: currentSelected?.createDate || '',
            productName: currentSelected?.productName || '',
            purchaseAmount: currentSelected?.purchaseAmount || '',
            saleAmount: currentSelected?.saleAmount || '',
            soldDate: currentSelected?.soldDate || '',
            status: currentSelected?.status || '',
            condition: currentSelected?.condition || '',
            provision: currentSelected?.provision || '',
            details: currentSelected?.details || '',
            valueTransferedToValve: currentSelected?.valueTransferedToValve || ''
          }}
          validate={(values) => {
            const errors = {} as any;
            const purchaseAmount = values.purchaseAmount as string | number;
            const saleAmount = values.saleAmount as string | number;

            if (!values.productName) {
              errors.productName = 'Nazwa produktu wymagana';
            }

            if (!purchaseAmount) {
              errors.purchaseAmount = 'Kwota zakupu wymagana';
            }

            if (purchaseAmount <= 0) {
              errors.purchaseAmount = 'Kwota zakupu musi być większa od 0';
            }

            if (saleAmount !== '' && saleAmount <= 0) {
              errors.saleAmount = 'Kwota sprzedaży musi być większa od 0';
            }

            if (values.status === 'sprzedano') {
              if (!values.saleAmount) {
                errors.saleAmount = 'Kwota zakupu musi być większa od 0';
              }
            }

            // if (values.createDate === 'Invalid Date') {
            //   errors.createDate = 'Błędny format daty';
            // }

            // if (values.soldDate === 'Invalid Date') {
            //   errors.soldDate = 'Błędny format daty';
            // }

            return errors;
          }}
          onSubmit={async (values, { setSubmitting }) => {
            if (!currentSelected) return;

            const itemDoc = doc(db, 'items', currentSelected.id);

            //@ts-ignore
            await updateDoc(itemDoc, {
              createDate: values.createDate,
              productName: values.productName,
              purchaseAmount: values.purchaseAmount,
              saleAmount: values.saleAmount || null,
              soldDate: values.soldDate || null,
              provision: values.provision || null,
              status: values.status,
              details: values.details
            });

            getItems();
            setSubmitting(false);
            setEditModalOpen(false);
          }}
        >
          {({ setFieldValue, values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => {
            return (
              <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                    {inputs.map((input, index) => {
                      const fullWidth = index >= 1 && inputs[index - 1].addOnly ? true : input.fullWidth;

                      if (input.addOnly) {
                        return;
                      }

                      return (
                        <Box sx={{ gridColumn: matches ? 'span 4' : fullWidth ? 'span 4' : 'span 2' }} key={index}>
                          {input.type === 'date' ? (
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                              <Stack spacing={3}>
                                <DesktopDatePicker
                                  label={input.label}
                                  inputFormat="DD/MM/YYYY"
                                  //@ts-ignore
                                  value={values[input.name]}
                                  onChange={(d) => {
                                    setFieldValue(input.name, dayjs(d).format());
                                  }}
                                  renderInput={(params) => {
                                    return (
                                      <TextField
                                        {...params}
                                        datatype="date"
                                        type="date"
                                        //@ts-ignore
                                        helperText={errors[input.name]}
                                      />
                                    );
                                  }}
                                />
                              </Stack>
                            </LocalizationProvider>
                          ) : input.type === 'select' ? (
                            <FormControl fullWidth>
                              <InputLabel id="demo-simple-select-label">{input.label}</InputLabel>
                              <Select
                                labelId="demo-simple-select-label"
                                id="demo-simple-select"
                                //@ts-ignore
                                value={values[input.name]}
                                label={input.label}
                                onChange={(d) => {
                                  setFieldValue(input.name, d.target.value);
                                }}
                              >
                                {input.options?.map((option) => {
                                  return (
                                    <MenuItem key={option} value={option}>
                                      {option}
                                    </MenuItem>
                                  );
                                })}
                              </Select>
                            </FormControl>
                          ) : input.type === 'checkbox' ? (
                            <FormControlLabel
                              sx={{
                                '& .MuiFormControlLabel-label': {
                                  userSelect: 'none'
                                }
                              }}
                              control={
                                <Checkbox
                                  name={input.name}
                                  //@ts-ignore
                                  defaultChecked={values[input.name]}
                                  onChange={(v) => {
                                    setFieldValue(input.name, v.target.checked);
                                  }}
                                />
                              }
                              label={input.label}
                            />
                          ) : (
                            <TextField
                              type={input.type}
                              name={input.name}
                              label={input.label}
                              variant="outlined"
                              //@ts-ignore
                              error={touched[input.name] && Boolean(errors[input.name])}
                              //@ts-ignore
                              helperText={touched[input.name] && errors[input.name]}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              //@ts-ignore
                              value={values[input.name]}
                              fullWidth
                            />
                          )}
                        </Box>
                      );
                    })}
                    {values.valueTransferedToValve ? (
                      <Box sx={{ gridColumn: 'span 4' }}>
                        <TextField
                          disabled
                          name="valueTransferedToValve"
                          type="text"
                          label="przelano do skarbonki"
                          variant="outlined"
                          value={`${values.valueTransferedToValve}zł`}
                          fullWidth
                        />
                      </Box>
                    ) : null}
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '20px' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      disabled={isSubmitting}
                      sx={{ mr: 'auto' }}
                      onClick={async () => {
                        await handleDeleteItem(currentSelected!.id);
                        setEditModalOpen(false);
                        getItems();
                      }}
                    >
                      Usuń
                    </Button>
                    <Button
                      variant="outlined"
                      sx={{ mr: '10px' }}
                      color="error"
                      onClick={() => setEditModalOpen(false)}
                      size="small"
                    >
                      Zamknij
                    </Button>
                    <Button variant="outlined" size="small" type="submit" disabled={isSubmitting}>
                      Zapisz
                    </Button>
                  </Box>
                </Box>
              </form>
            );
          }}
        </Formik>
      </EditModal>

      <ValveModal open={valveModalOpen}>
        <Formik
          initialValues={{
            amount: ''
          }}
          validate={(values) => {
            const errors = {} as any;

            return errors;
          }}
          onSubmit={async (values, { setSubmitting }) => {
            if (!currentSelected) return;
            const { amount } = values;

            const updatedSaleAmount = currentSelected.saleAmount - parseInt(amount);
            const itemDoc = doc(db, 'items', currentSelected.id);

            await updateDoc(itemDoc, { saleAmount: updatedSaleAmount, valueTransferedToValve: parseInt(amount) });
            await addDoc(valveCollectionRef, {
              amount,
              elementId: currentSelected.id,
              elementName: currentSelected.productName,
              createdAt: dayjs().format('DD/MM/YYYY'),
              userName: user?.displayName
            });

            getItems();
            setSubmitting(false);
            setValveModalOpen(false);
          }}
        >
          {({ values, handleChange, handleBlur, handleSubmit, isSubmitting }) => {
            return (
              <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                    <Box sx={{ gridColumn: 'span 4' }}>
                      <TextField
                        type="number"
                        name="amount"
                        label="ile przekazać do skarbonki"
                        variant="outlined"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.amount}
                        fullWidth
                      />
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '20px' }}>
                    <Button
                      variant="outlined"
                      sx={{ mr: '10px' }}
                      color="error"
                      onClick={() => setValveModalOpen(false)}
                      size="small"
                    >
                      Zamknij
                    </Button>
                    <Button variant="outlined" size="small" type="submit" disabled={isSubmitting}>
                      Zapisz
                    </Button>
                  </Box>
                </Box>
              </form>
            );
          }}
        </Formik>
      </ValveModal>

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

                <TableCell align="right">prowizja</TableCell>

                <TableCell align="right">saldo stan</TableCell>

                <TableCell align="right">saldo wojtek</TableCell>

                <TableCell align="right">data stworzenia</TableCell>

                <TableCell align="right">data sprzedazy</TableCell>

                <TableCell align="right">uwagi</TableCell>

                <TableCell align="right">akcja</TableCell>
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
                    const profit = item.saleAmount
                      ? (item.saleAmount - item.purchaseAmount - item.provision) / 2
                      : false;

                    summaryWojt +=
                      item.status === 'sprzedano' ? (profit ? item.purchaseAmount + profit : item.purchaseAmount) : 0;
                    summaryStan += item.status === 'sprzedano' ? profit || 0 : 0;

                    return (
                      <TableRow
                        key={item.id}
                        sx={{ backgroundColor: `${item.color}26`, '&:last-child td, &:last-child th': { border: 0 } }}
                      >
                        <TableCell component="th" scope="row">
                          {item.productName}
                        </TableCell>

                        <TableCell align="right">{item.condition}</TableCell>

                        <TableCell align="right">{item.status}</TableCell>

                        <TableCell align="right">{item.purchaseAmount}zł</TableCell>

                        <TableCell align="right">{item.saleAmount ? `${item.saleAmount}zł` : '-'} </TableCell>
                        <TableCell align="right">{item.provision ? `${item.provision}zł` : '-'} </TableCell>

                        <TableCell align="right">{profit ? `${profit}zł` : '-'}</TableCell>

                        <TableCell align="right">
                          {item.saleAmount ? `${profit ? item.purchaseAmount + profit : item.purchaseAmount}zł` : '-'}
                        </TableCell>

                        <TableCell align="right">{dayjs(item.createDate).format('DD/MM/YYYY')}</TableCell>

                        <TableCell align="right">
                          {item.soldDate ? dayjs(item.soldDate).format('DD/MM/YYYY') : '-'}
                        </TableCell>

                        <TableCell
                          align="right"
                          style={{
                            width: '50px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {item.details}
                        </TableCell>

                        <TableCell align="right">
                          <Button size="small" variant="contained" type="submit" onClick={() => editRow(item.id)}>
                            Edytuj
                          </Button>

                          <Button
                            size="small"
                            variant="outlined"
                            type="submit"
                            onClick={() => handleValve(item.id)}
                            sx={{ ml: '10px' }}
                          >
                            Skarbonka
                          </Button>
                        </TableCell>
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
                {summaryWojt.toFixed(2)}zł
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              Stan suma:{' '}
              <Box sx={{ fontWeight: 'bold', marginLeft: '10px', minWidth: '150px', textAlign: 'end' }}>
                {summaryStan.toFixed(2)}zł
              </Box>
            </Box>
          </Box>
        </TableContainer>
      </Center>
    </Container>
  );
};

export default withLayout(Inventory);
