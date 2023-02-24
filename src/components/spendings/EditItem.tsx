import EditModal from '../modal/EditModal';

import { Formik } from 'formik';
import { updateDoc, doc } from '@firebase/firestore';
import { Box, Button, FormControl, InputLabel, MenuItem, Select, Stack, TextField, useMediaQuery } from '@mui/material';
import { SpendingType, ValveType } from '../../screens/types';
import { db } from '../../config/firebase';
import { handleSpendingInputs } from '../../screens/helpers';
import { useState } from 'react';
import { ConfirmationModal } from '../modal/ConfirmationModal';

type EditItemProps = {
  editModalOpen: boolean;
  currentSelected: SpendingType | undefined;
  getItems: () => void;
  setEditModalOpen: (value: boolean) => void;
};

export const EditItem = (props: EditItemProps) => {
  const { currentSelected, editModalOpen, getItems, setEditModalOpen } = props;

  const matches = useMediaQuery('(max-width:500px)');

  const handleDeleteItem = async () => {
    const itemId = currentSelected?.id;

    if (!itemId) {
      return;
    }

    const item = doc(db, 'spendings', itemId);

    updateDoc(item, {
      removed: true
    });

    setDeleteConfirmationOpen(false);
    setEditModalOpen(false);
    getItems();
  };

  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const magazynInputs = handleSpendingInputs(true);

  if (!currentSelected) {
    return <></>;
  }

  return (
    <EditModal open={editModalOpen}>
      <>
        {/* HANDLE DELETE MODAL CONFIRMATION */}
        <ConfirmationModal
          handleConfirm={handleDeleteItem}
          open={deleteConfirmationOpen}
          handleReject={() => setDeleteConfirmationOpen(false)}
        />

        <Formik
          initialValues={{
            elementName: currentSelected.elementName,
            amount: currentSelected.amount,
            addedBy: currentSelected.addedBy
          }}
          validate={(values) => {
            const errors = {} as any;

            return errors;
          }}
          onSubmit={async (values, { setSubmitting }) => {
            if (!currentSelected) return;

            const itemDoc = doc(db, 'spendings', currentSelected.id);
            await updateDoc(itemDoc, {
              elementName: values.elementName,
              amount: values.amount,
              addedBy: values.addedBy
            });

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
                      //@ts-ignore
                      if (input.addOnly || currentSelected.removed) {
                        return;
                      }

                      const fullWidth = input.fullWidth;

                      return (
                        <Box sx={{ gridColumn: matches ? 'span 4' : fullWidth ? 'span 4' : 'span 2' }} key={index}>
                          {input.type === 'select' ? (
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
                                    <MenuItem key={option} value={option} disabled={option === 'automat'}>
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
                      variant="contained"
                      size="small"
                      color="error"
                      sx={{ mr: 'auto' }}
                      onClick={() => {
                        setDeleteConfirmationOpen(true);
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
    </EditModal>
  );
};
