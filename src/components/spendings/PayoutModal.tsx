import EditModal from '../modal/EditModal';

import { Formik } from 'formik';
import { updateDoc, doc } from '@firebase/firestore';
import { Box, Button, Stack, TextField } from '@mui/material';
import { SpendingType } from '../../screens/types';
import { db } from '../../config/firebase';

import dayjs from 'dayjs';
import { DesktopDatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

type EditItemProps = {
  editModalOpen: boolean;
  multiCurrentSelected: SpendingType[];
  getItems: () => void;
  setEditModalOpen: (value: boolean) => void;
  setMultiCurrentSelected: (data: SpendingType[]) => void;
};

export const PayoutModal = (props: EditItemProps) => {
  const { multiCurrentSelected, setMultiCurrentSelected, editModalOpen, getItems, setEditModalOpen } = props;

  if (!multiCurrentSelected.length) {
    return <></>;
  }

  return (
    <EditModal open={editModalOpen}>
      <>
        <Formik
          initialValues={{
            details: '',
            payoutDate: dayjs().format()
          }}
          validate={(values) => {
            const errors = {} as any;

            if (!values.details.trim().length) {
              errors.details = 'Podaj szczegóły wypłaty';
            }
            return errors;
          }}
          onSubmit={async (values, { setSubmitting }) => {
            if (!multiCurrentSelected.length) return;

            const promisesSpendings = multiCurrentSelected.map((e) => {
              const item = doc(db, 'spendings', e.id);
              updateDoc(item, {
                details: values.details,
                payoutDate: values.payoutDate,
                hasBeenUsed: true
              });
            });

            await Promise.all(promisesSpendings);

            getItems();
            setSubmitting(false);
            setMultiCurrentSelected([]);
            setEditModalOpen(false);
          }}
        >
          {({ setFieldValue, values, handleChange, touched, errors, handleSubmit, isSubmitting }) => (
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Stack spacing={3}>
                      <DesktopDatePicker
                        label="data wypłaty"
                        inputFormat="DD/MM/YYYY"
                        value={values.payoutDate}
                        onChange={(d) => {
                          setFieldValue('payoutDate', dayjs(d).format());
                        }}
                        renderInput={(params) => {
                          return <TextField {...params} datatype="date" type="date" helperText={errors.payoutDate} />;
                        }}
                      />
                    </Stack>
                  </LocalizationProvider>
                  <TextField
                    name="details"
                    type="text"
                    label="szczegóły wypłaty"
                    variant="outlined"
                    onChange={handleChange}
                    value={values.details}
                    error={touched.details && Boolean(errors.details)}
                    helperText={touched.details && errors.details}
                  />
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
                    Zapisz
                  </Button>
                </Box>
              </Box>
            </form>
          )}
        </Formik>
      </>
    </EditModal>
  );
};
