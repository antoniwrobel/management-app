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
import { useMediaQuery } from '@mui/material';

import { db } from '../config/firebase';
import { collection, getDocs, addDoc } from '@firebase/firestore';

import dayjs from 'dayjs';

interface Props {}

const inputs = [
  {
    type: 'text',
    name: 'productName',
    label: 'nazwa produktu',
    fullWidth: true
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
    label: 'data stworzenia'
  },
  {
    type: 'date',
    name: 'soldDate',
    label: 'data sprzedania'
  },
  {
    type: 'text',
    name: 'url',
    label: 'link do aukcji',
    fullWidth: true
  }
];

const Inventory = ({}: Props) => {
  useEffect(() => {}, []);
  const matches = useMediaQuery('(max-width:500px)');

  type ItemType = {
    id: string;
    productName: string;
    purchaseAmount: number;
    saleAmount: number;
    status: string;
    url: string;
    createDate: { nanoseconds: number; seconds: number };
    soldDate: { nanoseconds: number; seconds: number };
  }[];

  const [modalOpen, setModalOpen] = useState(false);
  const [items, setItems] = useState<ItemType>([]);

  const itemsCollectionRef = collection(db, 'items');

  const getItems = async () => {
    const data = await getDocs(itemsCollectionRef);
    const items = data.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as ItemType;

    setItems(items);
  };

  useEffect(() => {
    getItems();
  }, []);

  const initialValues = {
    productName: '',
    status: 'utworzono',
    purchaseAmount: '',
    saleAmount: '',
    createDate: dayjs().format(),
    soldDate: null,
    url: ''
  };

  return (
    <Container maxWidth="xl" sx={{ p: '20px' }}>
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

            if (values.soldDate === 'Invalid Date') {
              errors.soldDate = 'Błędny format daty';
            }

            return errors;
          }}
          onSubmit={async (values, { setSubmitting }) => {
            await addDoc(itemsCollectionRef, {
              createDate: values.createDate,
              productName: values.productName,
              purchaseAmount: values.purchaseAmount,
              saleAmount: values.saleAmount || null,
              soldDate: values.soldDate || null,
              status: values.status,
              url: values.url
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
                      sx={{ mr: '20px' }}
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
      <Center>
        {items
          //@ts-ignore
          .sort((a, b) => new Date(b.createDate) - new Date(a.createDate))
          .map((item) => (
            <Box key={item.id}>
              {item.productName} - {item.status} - zakupiono za {item.purchaseAmount} zł
            </Box>
          ))}
      </Center>
    </Container>
  );
};

export default withLayout(Inventory);
