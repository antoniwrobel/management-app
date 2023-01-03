import EditModal from '../modal/EditModal';
import { Formik } from 'formik';

import { collection, getDocs, updateDoc, doc, addDoc } from '@firebase/firestore';
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
import { ItemType, ValveType } from '../../screens/types';
import { db } from '../../config/firebase';
import { magazynInputs } from '../../screens/helpers';

import dayjs from 'dayjs';

type EditItemProps = {
  editModalOpen: boolean;
  currentSelected: ItemType | undefined;
  getItems: () => void;
  setEditModalOpen: (value: boolean) => void;
};

export const EditItem = (props: EditItemProps) => {
  const { currentSelected, editModalOpen, getItems, setEditModalOpen } = props;

  const matches = useMediaQuery('(max-width:500px)');
  const valveCollectionRef = collection(db, 'valve');
  const settlementsCollectionRef = collection(db, 'settlements');

  const handleDeleteItem = async (itemId: string) => {
    const item = doc(db, 'items', itemId);
    const d = await getDocs(valveCollectionRef);
    const items = d.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as ValveType[];
    const elements = items.filter((item) => item.elementId === itemId);

    if (elements.length) {
      const promises = elements.map((e) => {
        const finded = doc(db, 'valve', e.id);
        updateDoc(finded, {
          removed: true
        });
      });

      await Promise.all(promises);
    }

    updateDoc(item, {
      removed: true
    });

    getItems();
  };

  const buttonDisabled = currentSelected?.status === 'sprzedano';

  if (!currentSelected) {
    return <></>;
  }

  return (
    <EditModal open={editModalOpen}>
      <Formik
        initialValues={{
          createDate: currentSelected.createDate || '',
          productName: currentSelected.productName || '',
          purchaseAmount: currentSelected.purchaseAmount || '',
          saleAmount: currentSelected.saleAmount || '',
          soldDate: currentSelected.soldDate || '',
          status: currentSelected.status || '',
          condition: currentSelected.condition || '',
          provision: currentSelected.provision || '',
          details: currentSelected.details || '',
          valueTransferedToValve: currentSelected.valueTransferedToValve || '',
          url: currentSelected.url || ''
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
          return errors;
        }}
        onSubmit={async (values, { setSubmitting }) => {
          if (!currentSelected) return;

          const itemDoc = doc(db, 'items', currentSelected.id);

          await updateDoc(itemDoc, {
            createDate: values.createDate,
            productName: values.productName,
            purchaseAmount: values.purchaseAmount,
            saleAmount: values.saleAmount || null,
            soldDate: values.soldDate || null,
            provision: values.provision || null,
            status: values.status,
            details: values.details,
            url: values.url
          });

          if (values.status === 'sprzedano') {
            const clearingValue =
              //@ts-ignore
              values.purchaseAmount + (values.saleAmount - values.purchaseAmount - (values.provision || 0)) / 2;

            await addDoc(settlementsCollectionRef, {
              createDate: dayjs().format(),
              productName: values.productName,
              amount: clearingValue,
              status: 'sprzedano',
              details: values.details,
              elementId: currentSelected.id
            });
          }

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
                  {magazynInputs.map((input, index) => {
                    const fullWidth = index >= 1 && magazynInputs[index - 1].addOnly ? true : input.fullWidth;

                    // const editEnabledOptions = ['status', 'url', 'details'];
                    const editEnabledOptions = [''];
                    const statusBlock = ['sprzedano', 'zwrot'];
                    const editDisabled =
                      statusBlock.includes(currentSelected.status) && !editEnabledOptions.includes(input.name);

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
                                disabled={editDisabled}
                                onChange={(d) => {
                                  setFieldValue(input.name, dayjs(d).format());
                                }}
                                renderInput={(params) => {
                                  return (
                                    <TextField
                                      {...params}
                                      datatype="date"
                                      type="date"
                                      disabled={editDisabled}
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
                              disabled={editDisabled}
                              label={input.label}
                              onChange={(d) => {
                                setFieldValue(input.name, d.target.value);
                              }}
                            >
                              {input.options?.map((option) => {
                                return (
                                  <MenuItem key={option} value={option} disabled={option === 'zwrot'}>
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
                                disabled={editDisabled}
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
                            disabled={editDisabled}
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
                    variant="contained"
                    size="small"
                    color="error"
                    disabled={isSubmitting || buttonDisabled}
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
                  <Button variant="outlined" size="small" type="submit" disabled={isSubmitting || buttonDisabled}>
                    Zapisz
                  </Button>
                </Box>
              </Box>
            </form>
          );
        }}
      </Formik>
    </EditModal>
  );
};
