import EditModal from '../modal/EditModal';
import { Formik } from 'formik';
import { collection, getDocs, updateDoc, doc, addDoc } from '@firebase/firestore';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { DesktopDatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { ItemType, SettlementItemType, ValveType } from '../../screens/types';
import { db } from '../../config/firebase';

import dayjs from 'dayjs';

type EditItemProps = {
  editModalOpen: boolean;
  currentSelected: ValveType[];
  getItems: () => void;
  setEditModalOpen: (value: boolean) => void;
};

export const EditItems = (props: EditItemProps) => {
  const { currentSelected, editModalOpen, getItems, setEditModalOpen } = props;

  if (!currentSelected) {
    return <></>;
  }

  const amountToHandle = currentSelected.reduce((a, curr) => {
    return curr.amount + a;
  }, 0);

  return (
    <EditModal open={editModalOpen}>
      <>
        <Formik
          initialValues={{
            details: '',
            useDate: dayjs().format()
          }}
          validate={(values) => {
            const errors = {} as any;
            if (values.details.trim().length === 0) {
              errors.details = 'Podaj szczegóły pobrania pieniędzy';
            }

            return errors;
          }}
          onSubmit={async (values, { setSubmitting }) => {
            if (!currentSelected.length) return;

            const promisesValve = currentSelected.map((e) => {
              const valve = doc(db, 'valve', e.id);
              updateDoc(valve, {
                hasBeenUsed: true,
                details: values.details,
                usedAt: values.useDate
              });
            });

            await Promise.all(promisesValve);

            getItems();
            setSubmitting(false);
            setEditModalOpen(false);
          }}
        >
          {({ handleChange, setFieldValue, handleBlur, values, touched, errors, handleSubmit, isSubmitting }) => {
            return (
              <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', mt: '10px' }}>
                  <Typography>Suma pobrania ze skarbonki to:</Typography>
                  <Typography sx={{ fontWeight: 'bold', ml: '5px' }}>{amountToHandle}zł</Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                    <Box sx={{ gridColumn: 'span 4', mt: '20px' }}>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Stack spacing={3}>
                          <DesktopDatePicker
                            label="data pobrania"
                            inputFormat="DD/MM/YYYY"
                            value={values.useDate}
                            onChange={(d) => {
                              setFieldValue('useDate', dayjs(d).format());
                            }}
                            renderInput={(params) => {
                              return (
                                <TextField {...params} datatype="date" type="date" helperText={errors.useDate} />
                              );
                            }}
                          />
                        </Stack>
                      </LocalizationProvider>

                      <TextField
                        type="text"
                        name="details"
                        label="szczegóły pobrania"
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
                    Wypłać
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
