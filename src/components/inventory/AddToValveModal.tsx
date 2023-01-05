import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { Formik } from 'formik';
import { auth, db } from '../../config/firebase';
import { addDoc, updateDoc, doc, collection, getDocs } from '@firebase/firestore';

import dayjs from 'dayjs';

import ValveModal from '../modal/ValveModal';
import { useState } from 'react';
import { ItemType, SettlementItemType } from '../../screens/types';
import { Typography } from '@mui/material';

type AddToValveModalProps = {
  valveModalOpen: boolean;
  currentSelected: ItemType | undefined;
  getItems: () => void;
  setValveModalOpen: (value: boolean) => void;
};

export const AddToValveModal = (props: AddToValveModalProps) => {
  const { valveModalOpen, currentSelected, getItems, setValveModalOpen } = props;
  const [user] = useState(auth.currentUser);

  const valveCollectionRef = collection(db, 'valve');
  const settlementsCollectionRef = collection(db, 'settlements');

  if (!currentSelected) {
    return <></>
  }


  const clearProfit = currentSelected.saleAmount - currentSelected.purchaseAmount
  //@ts-ignore
  const fixedProfit = clearProfit - currentSelected.provision

  return (
    <ValveModal open={valveModalOpen}>
      <>
        <Box>
          <Typography sx={{ mb: "20px", }}>
            Kwota do podziału:
            <Typography sx={{ ml: "5px", fontWeight: "bold", display: "inline-block" }}>
              {fixedProfit.toFixed(2)}zł
            </Typography>

            <Typography sx={{ display: "inline-block", ml: "5px", fontStyle: "oblique" }}>
              ({clearProfit}zł - {currentSelected.provision}zł)
            </Typography>
          </Typography>
        </Box>

        <Formik
          initialValues={{
            amount: ''
          }}
          validate={(values) => {
            const errors = {} as any;

            if (!values.amount) {

              errors.amount = "Podaj wartość do przekazania!"
            }

            return errors;
          }}
          onSubmit={async (values, { setSubmitting }) => {
            if (!currentSelected) return;

            const { amount } = values;
            const itemDoc = doc(db, 'items', currentSelected.id);

            const amountToReduce = parseFloat(amount) / 2

            await updateDoc(itemDoc, {
              //@ts-ignore
              valueTransferedToValve: parseFloat(currentSelected.valueTransferedToValve || 0) + parseFloat(amount),
              clearingValueWojtek: currentSelected.clearingValueWojtek - amountToReduce,
              clearingValueStan: currentSelected.clearingValueStan - amountToReduce,
            });

            const d = await getDocs(settlementsCollectionRef);
            const items = d.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as SettlementItemType[];
            const elements = items.filter((item) => item.elementId === currentSelected.id);

            if (elements.length > 0) {

              const elementsPromise = elements.map(element => {
                if (element.removed) {
                  return
                }

                const settlementsDoc = doc(db, 'settlements', element.id);
                return updateDoc(settlementsDoc, {
                  clearingValueWojtek: currentSelected.clearingValueWojtek - amountToReduce,
                  clearingValueStan: currentSelected.clearingValueStan - amountToReduce,
                });
              })

              await Promise.all(elementsPromise)
            }

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
          {({ values, touched, errors, handleChange, handleBlur, handleSubmit, isSubmitting }) => {

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
                        //@ts-ignore
                        error={touched.amount && Boolean(errors.amount)}
                        //@ts-ignore
                        helperText={touched.amount && errors.amount}
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
      </>
    </ValveModal>
  );
};
