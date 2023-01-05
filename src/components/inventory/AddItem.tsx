import dayjs from 'dayjs';
import AddItemModal from '../modal/Modal';

import { Formik } from 'formik';
import { collection, addDoc } from '@firebase/firestore';
import { getColor, handleInputs } from '../../screens/helpers';
import { db } from '../../config/firebase';
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  useMediaQuery
} from '@mui/material';
import { DesktopDatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

type AddItemProps = {
  modalOpen: boolean;
  getItems: () => void;
  setModalOpen: (value: boolean) => void;
};

const initialValues = {
  productName: '',
  status: '',
  quantity: '',
  condition: '',
  purchaseAmount: '',
  color: '',
  sendCost: '',
  saleAmount: '',
  createDate: dayjs().format(),
  details: '',
  url: '',
  provision: ""
};

export const AddItem = (props: AddItemProps) => {
  const { modalOpen, getItems, setModalOpen } = props;

  const itemsCollectionRef = collection(db, 'items');

  const matches = useMediaQuery('(max-width:500px)');
  const magazynInputs = handleInputs(true)

  return (
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

          if (values.status === 'sprzedano' && saleAmount <= 0) {
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
              sendCost: values.sendCost || null,
              status: 'utworzono',
              condition: values.condition,
              details: values.details,
              color,
              url: values.url,
              provision: values.provision
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
                  {magazynInputs.map((input, index) => {
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
  );
};
