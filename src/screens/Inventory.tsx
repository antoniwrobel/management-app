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

import { db } from '../config/firebase';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from '@firebase/firestore';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

import dayjs from 'dayjs';
import ValveModal from '../components/modal/ValveModal';

const inputs = [
  // {
  //   type: 'checkbox',
  //   name: 'takenIntoCommission',
  //   label: 'komis',
  //   fullWidth: true
  // },
  {
    type: 'text',
    name: 'productName',
    label: 'nazwa produktu',
    fullWidth: true
  },
  {
    type: 'number',
    name: 'quantity',
    label: 'ilość'
  },
  {
    type: 'select',
    options: ['nowe', 'używane'],
    name: 'condition',
    label: 'stan'
  },
  {
    type: 'select',
    options: ['utworzono', 'sprzedano'],
    name: 'status',
    label: 'status',
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

const Inventory = () => {
  useEffect(() => {}, []);
  const matches = useMediaQuery('(max-width:500px)');

  type ItemType = {
    id: string;
    productName: string;
    quantity: number;
    purchaseAmount: number;
    saleAmount: number;
    takenIntoCommission: boolean;
    status: string;
    condition: string;
    details: string;
    createDate: Date;
    soldDate: Date;
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [valveModalOpen, setValveModalOpen] = useState(false);
  const [currentSelected, setCurrentSelected] = useState<ItemType>();
  const [items, setItems] = useState<ItemType[]>([]);

  const itemsCollectionRef = collection(db, 'items');

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
    takenIntoCommission: false,
    saleAmount: '',
    createDate: dayjs().format(),
    details: ''
  };

  const addToValve = (itemId: string) => {
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

            return errors;
          }}
          onSubmit={async (values, { setSubmitting }) => {
            await addDoc(itemsCollectionRef, {
              createDate: values.createDate,
              productName: values.productName,
              purchaseAmount: values.purchaseAmount,
              saleAmount: values.saleAmount || null,
              status: values.status,
              quantity: values.quantity,
              condition: values.condition,
              takenIntoCommission: values.takenIntoCommission || false,
              details: values.details
            });

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
                      return (
                        <Box
                          sx={{ gridColumn: matches ? 'span 4' : input.fullWidth ? 'span 4' : 'span 2' }}
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
      <ValveModal open={valveModalOpen}>
        <Formik
          initialValues={{
            createDate: currentSelected?.createDate || '',
            productName: currentSelected?.productName || '',
            purchaseAmount: currentSelected?.purchaseAmount || '',
            takenIntoCommission: currentSelected?.takenIntoCommission || false,
            saleAmount: currentSelected?.saleAmount || '',
            soldDate: currentSelected?.soldDate || '',
            quantity: currentSelected?.quantity || '',
            status: currentSelected?.status || '',
            condition: currentSelected?.condition || '',
            details: currentSelected?.details || ''
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
              takenIntoCommission: values.takenIntoCommission || false,
              soldDate: values.soldDate || null,
              quantity: values.quantity || null,
              status: values.status,
              details: values.details
            });

            getItems();
            setSubmitting(false);
            setValveModalOpen(false);
          }}
        >
          {({ setFieldValue, values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => {
            return (
              <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                    {inputs.map((input, index) => {
                      return (
                        <Box
                          sx={{ gridColumn: matches ? 'span 4' : input.fullWidth ? 'span 4' : 'span 2' }}
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
                        setValveModalOpen(false);
                        getItems();
                      }}
                    >
                      Usuń
                    </Button>
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
                {/* 1 */}
                <TableCell>Nazwa produktu</TableCell>
                {/* 2 */}
                <TableCell align="right">komis</TableCell>
                {/* 3 */}
                <TableCell align="right">ilość</TableCell>
                {/* 4 */}
                <TableCell align="right">stan</TableCell>
                {/* 5 */}
                <TableCell align="right">status</TableCell>
                {/* 6 */}
                <TableCell align="right">kwota zakupu</TableCell>
                {/* 7 */}
                <TableCell align="right">kwota sprzedazy</TableCell>
                {/* 8 */}
                <TableCell align="right">saldo stan</TableCell>
                {/* 9 */}
                <TableCell align="right">saldo wojtek</TableCell>
                {/* 10 */}
                <TableCell align="right">data stworzenia</TableCell>
                {/* 11 */}
                <TableCell align="right">data sprzedazy</TableCell>
                {/* 12 */}
                <TableCell align="right">uwagi</TableCell>
                {/* 13 */}
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
                    const profit = item.saleAmount ? (item.saleAmount - item.purchaseAmount) / 2 : false;
                    summaryWojt +=
                      item.status === 'sprzedano' ? (profit ? item.purchaseAmount + profit : item.purchaseAmount) : 0;
                    summaryStan += profit || 0;

                    return (
                      <TableRow key={item.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        {/* 1 */}
                        <TableCell component="th" scope="row">
                          {item.productName}
                        </TableCell>
                        {/* 2 */}
                        <TableCell align="right">{item.takenIntoCommission ? 'tak' : 'nie'}</TableCell>
                        {/* 3 */}
                        <TableCell align="right">{item.quantity}</TableCell>
                        {/* 4 */}
                        <TableCell align="right">{item.condition}</TableCell>
                        {/* 5 */}
                        <TableCell align="right">{item.status}</TableCell>
                        {/* 6 */}
                        <TableCell align="right">{item.purchaseAmount}zł</TableCell>
                        {/* 7 */}
                        <TableCell align="right">{item.saleAmount ? `${item.saleAmount}zł` : '-'} </TableCell>
                        {/* 8 */}
                        <TableCell align="right">{profit ? `${profit}zł` : '-'}</TableCell>
                        {/* 9 */}
                        <TableCell align="right">
                          {/* @ts-ignore */}
                          {item.saleAmount ? `${profit ? item.purchaseAmount + profit : item.purchaseAmount}zł` : '-'}
                        </TableCell>
                        {/* 10 */}
                        <TableCell align="right">{dayjs(item.createDate).format('DD/MM/YYYY')}</TableCell>
                        {/* 11 */}
                        <TableCell align="right">
                          {item.soldDate ? dayjs(item.soldDate).format('DD/MM/YYYY') : '-'}
                        </TableCell>
                        {/* 12 */}
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
                        {/* 13 */}
                        <TableCell align="right">
                          <Button size="small" variant="contained" type="submit" onClick={() => addToValve(item.id)}>
                            Edytuj
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
              borderTop: '16px solid #dedede',
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
