import dayjs from 'dayjs';
import AddItemModal from '../modal/Modal';

import { Formik } from 'formik';
import { getDocs, collection, addDoc, updateDoc, doc } from '@firebase/firestore';
import { handleSpendingInputs } from '../../screens/helpers';
import { db } from '../../config/firebase';
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  useMediaQuery
} from '@mui/material';
import { ItemType, ValveType } from '../../screens/types';
import { useEffect, useState } from 'react';

type AddItemProps = {
  modalOpen: boolean;
  getItems: () => void;
  setModalOpen: (value: boolean) => void;
};

export const AddItem = (props: AddItemProps) => {
  const { modalOpen, getItems, setModalOpen } = props;

  const spendingsCollectionRef = collection(db, 'spendings');

  const matches = useMediaQuery('(max-width:500px)');
  const magazynInputs = handleSpendingInputs(true);

  const [items, setItems] = useState<ItemType[]>([]);
  const [itemsV, setItemsV] = useState<ValveType[]>([]);

  const itemsCollectionRef = collection(db, 'items');
  const valveCollectionRef = collection(db, 'valve');

  const getItemsData = async () => {
    const d = await getDocs(itemsCollectionRef);
    const v = await getDocs(valveCollectionRef);
    const items = d.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as ItemType[];
    const itemsV = v.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as ValveType[];

    setItems(items);
    setItemsV(itemsV);
  };

  useEffect(() => {
    getItemsData();
  }, []);

  const initialValues = {
    elementName: '',
    payProvision: false,
    payProvisionId: '',
    valveId: '',
    amount: '',
    addedBy: '',
    createdAt: dayjs().format()
  };

  const options = items
    .filter((item) => (item.provision || 0) > 0 && item.status === 'sprzedano' && !item.provisionPayed)
    .map((item) => ({ name: item.productName, value: item.id, amount: item.provision }));

  const optionsValve = itemsV
    .filter((item) => !item.removed)
    .map((item) => ({ name: item.elementName, value: item.id, amount: item.amount }));

  return (
    <AddItemModal open={modalOpen}>
      <Formik
        initialValues={initialValues}
        validate={(values) => {
          const errors = {} as any;

          if (!values.payProvision) {
            if (!values.addedBy) {
              errors.addedBy = 'Wartość wymagana!';
            }

            if (!values.amount) {
              errors.amount = 'Podaj kwotę wydatku!';
            }

            if (!values.elementName) {
              errors.elementName = 'Podaj nazwę wydatku!';
            }
          } else {
            if (!values.payProvisionId) {
              errors.payProvisionId = 'Wybierz pozycję!';
            }
          }

          return errors;
        }}
        onSubmit={async (values, { setSubmitting }) => {
          const selectedItem = items.find((e) => e.id === values.payProvisionId);

          if (values.payProvision) {
            if (!selectedItem) {
              return;
            }

            const itemDoc = doc(db, 'items', selectedItem.id);

            await addDoc(spendingsCollectionRef, {
              elementName: 'opłata prowizji za - ' + selectedItem.productName,
              amount: selectedItem.provision,
              addedBy: 'automat',
              createdAt: dayjs().format(),
              elementId: selectedItem.id
            });

            await updateDoc(itemDoc, {
              provisionPayed: true
            });
          } else {
            await addDoc(spendingsCollectionRef, {
              elementName: values.elementName,
              amount: parseFloat(values.amount),
              addedBy: values.addedBy,
              createdAt: values.createdAt
            });
          }

          getItems();
          getItemsData();
          setSubmitting(false);
          setModalOpen(false);
        }}
      >
        {({ values, setFieldValue, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => {
          return (
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                  {magazynInputs.map((input, index) => {
                    if (input.type === 'checkbox' && !options.length) {
                      return;
                    }

                    return (
                      <Box
                        sx={{
                          gridColumn: matches ? 'span 4' : input.fullWidth ? 'span 4' : 'span 2'
                        }}
                        key={index}
                      >
                        {input.type === 'checkbox' ? (
                          <>
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
                                    const value = v.target.checked;
                                    if (!value) {
                                      setFieldValue('payProvisionSelect', null);
                                    }
                                    setFieldValue(input.name, value);
                                  }}
                                />
                              }
                              label={input.label}
                            />

                            {values.payProvision && options.length ? (
                              <FormControl fullWidth sx={{ mt: '20px' }}>
                                <InputLabel
                                  id="demo-simple-select-label"
                                  //@ts-ignore
                                  error={touched.payProvisionId && Boolean(errors.payProvisionId)}
                                >
                                  wybierz produkt
                                </InputLabel>
                                <Select
                                  labelId="demo-simple-select-label"
                                  id="demo-simple-select"
                                  value={values.payProvisionId}
                                  //@ts-ignore
                                  error={touched.payProvisionId && Boolean(errors.payProvisionId)}
                                  label={input.label}
                                  onChange={(d) => {
                                    setFieldValue('payProvisionId', d.target.value);
                                  }}
                                >
                                  {options?.map((option, index) => {
                                    return (
                                      <MenuItem key={`${option.name}-${index}`} value={option.value}>
                                        {option.name} - {option.amount}zł
                                      </MenuItem>
                                    );
                                  })}
                                </Select>

                                {touched.payProvisionId && Boolean(errors.payProvisionId) ? (
                                  <FormHelperText sx={{ color: 'red' }}>{errors.payProvisionId}</FormHelperText>
                                ) : null}
                              </FormControl>
                            ) : null}
                            {/* {values.payProvision && values.payProvisionId && (
                              <FormControl fullWidth sx={{ mt: '20px' }}>
                                <InputLabel
                                  sx={{ width: 'auto', background: '#fff' }}
                                  id="demo-simple-select-label"
                                  //@ts-ignore
                                  error={touched.valveId && Boolean(errors.valveId)}
                                >
                                  wybierz pozycję ze skarbonki
                                </InputLabel>
                                <Select
                                  labelId="demo-simple-select-label"
                                  id="demo-simple-select"
                                  value={values.valveId}
                                  //@ts-ignore
                                  error={touched.valveId && Boolean(errors.valveId)}
                                  label={input.label}
                                  onChange={(d) => {
                                    setFieldValue('valveId', d.target.value);
                                  }}
                                >
                                  {optionsValve?.map((option, index) => {
                                    return (
                                      <MenuItem key={`${option.name}-${index}`} value={option.value}>
                                        {option.name} - {option.amount}zł
                                      </MenuItem>
                                    );
                                  })}
                                </Select>

                                {touched.valveId && Boolean(errors.valveId) ? (
                                  <FormHelperText sx={{ color: 'red' }}>{errors.valveId}</FormHelperText>
                                ) : null}
                              </FormControl>
                            )} */}
                          </>
                        ) : input.type === 'select' && !values.payProvision ? (
                          <FormControl fullWidth>
                            <InputLabel
                              id="demo-simple-select-label"
                              //@ts-ignore
                              error={touched[input.name] && Boolean(errors[input.name])}
                            >
                              {input.label}
                            </InputLabel>
                            <Select
                              labelId="demo-simple-select-label"
                              id="demo-simple-select"
                              //@ts-ignore
                              value={values[input.name]}
                              //@ts-ignore
                              error={touched[input.name] && Boolean(errors[input.name])}
                              label={input.label}
                              onChange={(d) => {
                                setFieldValue(input.name, d.target.value);
                              }}
                            >
                              {input.options?.map((option) => {
                                if (option === 'automat') {
                                  return;
                                }

                                return (
                                  <MenuItem key={option} value={option}>
                                    {option}
                                  </MenuItem>
                                );
                              })}
                            </Select>
                            {/* @ts-ignore */}
                            {touched[input.name] && Boolean(errors[input.name]) ? (
                              <FormHelperText sx={{ color: 'red' }}>
                                {/* @ts-ignore */}
                                {errors[input.name]}
                              </FormHelperText>
                            ) : null}
                          </FormControl>
                        ) : (
                          !values.payProvision && (
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
                          )
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
