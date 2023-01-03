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

  return (
    <ValveModal open={valveModalOpen}>
      <Formik
        initialValues={{
          amount: ''
        }}
        validate={(values) => {
          const errors = {} as any;

          return errors;
        }}
        onSubmit={async (values, { setSubmitting }) => {
          if (!currentSelected) return;

          const { amount } = values;

          const updatedSaleAmount = currentSelected.saleAmount - parseInt(amount);
          const itemDoc = doc(db, 'items', currentSelected.id);

          await updateDoc(itemDoc, {
            saleAmount: updatedSaleAmount,
            //@ts-ignore
            valueTransferedToValve: parseInt(currentSelected.valueTransferedToValve || 0) + parseInt(amount)
          });

          const d = await getDocs(settlementsCollectionRef);
          const items = d.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as SettlementItemType[];
          const element = items.find((item) => item.elementId === currentSelected.id);

          if (element) {
            const settlementsDoc = doc(db, 'settlements', element.id);

            const amount =
              currentSelected.purchaseAmount +
              //@ts-ignore
              (currentSelected.saleAmount -
                currentSelected.purchaseAmount -
                (currentSelected.provision || 0) -
                //@ts-ignore
                values.amount) /
                2;

            await updateDoc(settlementsDoc, {
              amount
            });
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
        {({ values, handleChange, handleBlur, handleSubmit, isSubmitting }) => {
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
    </ValveModal>
  );
};
