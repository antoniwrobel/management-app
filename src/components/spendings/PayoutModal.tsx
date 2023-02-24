import EditModal from '../modal/EditModal';

import { Formik } from 'formik';
import { updateDoc, doc } from '@firebase/firestore';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
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

  const handleTotal = () => {
    let totalWojtek = 0;
    let totalStan = 0;

    multiCurrentSelected.map((d) => {
      const amount = Number(d.amount);
      if (!d.removed && !d.hasBeenUsed) {
        if (d.addedBy === 'Wojtek dla Stan') {
          totalWojtek += amount;
        }

        if (d.addedBy === 'Stan dla Wojtek') {
          totalStan += amount;
        }

        if (d.addedBy === 'Stan / 2') {
          totalStan += amount;
          totalWojtek += amount / 2;
        }

        if (d.addedBy === 'Wojtek / 2') {
          totalStan += amount / 2;
          totalWojtek += amount;
        }
      }
    });

    return {
      totalStan: totalStan.toFixed(2),
      totalWojtek: totalWojtek.toFixed(2)
    };
  };
  const { totalStan, totalWojtek } = handleTotal();

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
              errors.details = 'Podaj szczegóły rozliczenia';
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
              <Box sx={{ display: 'flex' }}>
                <Typography sx={{ mb: '20px' }}>
                  {/* @ts-ignore */}
                  {totalStan - totalWojtek > 0 ? 'Do odebrania od Wojtka: ' : 'Do oddania Wojtkowi: '}
                </Typography>
                <Typography sx={{ ml: '5px', mb: '20px', fontWeight: 'bold' }}>
                  {
                    //@ts-ignore
                    Math.abs(totalStan - totalWojtek).toFixed(2)
                  }
                  zł
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '20px' }}>
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
