import EditModal from '../modal/EditModal';
import { Formik } from 'formik';
import { collection, getDocs, updateDoc, doc, addDoc } from '@firebase/firestore';
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { DesktopDatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { ItemType, SettlementItemType } from '../../screens/types';
import { db } from '../../config/firebase';

import dayjs from 'dayjs';

type EditItemProps = {
  editModalOpen: boolean;
  currentSelected: SettlementItemType[];
  getItems: () => void;
  setEditModalOpen: (value: boolean) => void;
};

export const EditItems = (props: EditItemProps) => {
  const { currentSelected, editModalOpen, getItems, setEditModalOpen } = props;

  if (!currentSelected) {
    return <></>;
  }
  const amountToHandle = currentSelected.reduce((a, curr) => {
    return curr.clearingValueWojtek + a;
  }, 0);

  return (
    <EditModal open={editModalOpen}>
      <>
        <Formik
          initialValues={{
            details: '',
            settlementDate: dayjs().format()
          }}
          validate={(values) => {
            const errors = {} as any;
            if (values.details.trim().length === 0) {
              errors.details = 'Podaj szczegóły płatności';
            }

            return errors;
          }}
          onSubmit={async (values, { setSubmitting }) => {
            if (!currentSelected.length) return;

            const promisesSettlement = currentSelected.map((e) => {
              const item = doc(db, 'settlements', e.id);
              updateDoc(item, {
                settled: true,
                settlementDate: values.settlementDate,
                settlementStatus: 'rozliczono',
                details: e.details ? e.details + ' - ' + values.details : values.details
              });
            });

            const itemsCollectionRef = collection(db, 'items');
            const itemDoc = await getDocs(itemsCollectionRef);
            const items = itemDoc.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as ItemType[];

            const promisesItems = currentSelected.map((e) => {
              const itemFound = items.find((item) => item.id === e.elementId);

              if (!itemFound) {
                return;
              }

              const itemToUpdate = doc(db, 'items', itemFound.id);

              updateDoc(itemToUpdate, {
                settled: true,
                details: itemFound.details ? itemFound.details + ' - ' + values.details : values.details,
                settlementStatus: 'rozliczono'
              });
            });

            await Promise.all(promisesSettlement);
            await Promise.all(promisesItems);

            getItems();
            setSubmitting(false);
            setEditModalOpen(false);
          }}
        >
          {({ handleChange, setFieldValue, handleBlur, values, touched, errors, handleSubmit, isSubmitting }) => {
            return (
              <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex' }}>
                  <Typography>Czy na pewno chcesz się rozliczyć za: </Typography>
                  <Typography sx={{ fontWeight: 'bold', ml: '5px' }}>
                    {currentSelected.length === 1 ? '1 rzecz' : `${currentSelected.length} rzeczy`}?
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', mt: '10px' }}>
                  <Typography>Suma do rozliczenia to:</Typography>
                  <Typography sx={{ fontWeight: 'bold', ml: '5px' }}>{amountToHandle}zł</Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                    <Box sx={{ gridColumn: 'span 4', mt: '20px' }}>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Stack spacing={3}>
                          <DesktopDatePicker
                            label="data rozliczenia"
                            inputFormat="DD/MM/YYYY"
                            value={values.settlementDate}
                            onChange={(d) => {
                              setFieldValue('settlementDate', dayjs(d).format());
                            }}
                            renderInput={(params) => {
                              return (
                                <TextField {...params} datatype="date" type="date" helperText={errors.settlementDate} />
                              );
                            }}
                          />
                        </Stack>
                      </LocalizationProvider>

                      <TextField
                        type="text"
                        name="details"
                        label="szczegóły rozliczenia"
                        variant="outlined"
                        sx={{
                          mt: '20px'
                        }}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.details}
                        error={touched.details && Boolean(errors.details)}
                        helperText={touched.details && errors.details}
                        fullWidth
                      />
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '20px' }}>
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
                    Rozlicz
                  </Button>
                </Box>
              </form>
            );
          }}
        </Formik>
      </>
    </EditModal>
  );
};
