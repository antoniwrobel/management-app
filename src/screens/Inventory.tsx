import { useEffect, useState } from 'react';
import withLayout from '../components/layout/withLayout';

import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Center from '../components/utils/Center';
import AddItemModal from '../components/modal/Modal';
import { Formik } from 'formik';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';

interface Props {}

const Inventory = ({}: Props) => {
  useEffect(() => {}, []);

  const [modalOpen, setModalOpen] = useState(false);

  const inputs = [
    {
      type: 'text',
      name: 'name',
      label: 'nazwa produktu',
      fullWidth: true
    },
    {
      type: 'number',
      name: 'wojtekCost',
      label: 'cena zakupu'
    },
    {
      type: 'number',
      name: 'soldFor',
      label: 'cena sprzedazy'
    },
    {
      type: 'date',
      name: 'addDate',
      label: 'data dodania'
    },
    {
      type: 'date',
      name: 'soldDate',
      label: 'data sprzedania'
    },
    {
      type: 'select',
      name: 'status',
      label: 'status'
    },
    {
      type: 'select',
      name: 'statusRoz',
      label: 'status rozliczenia'
    },
    {
      type: 'text',
      name: 'url',
      label: 'link do aukcji',
      fullWidth: true
    }
  ];

  const initialValues = {};
  //@ts-ignore

  for (let i = 0; i < inputs.length; i++) {
    //@ts-ignore
    const e = inputs[i];
    //@ts-ignore
    initialValues[e.name] = '';
  }

  const initialFormValues = initialValues;

  console.log(initialFormValues);
  return (
    <Container maxWidth="xl" sx={{ p: '20px' }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={() => setModalOpen(true)}>
          Dodaj
        </Button>
      </Box>

      <AddItemModal open={modalOpen}>
        <Formik
          initialValues={initialFormValues}
          validate={(values) => {
            const errors = {} as any;

            // if (!values.email) {
            //   errors.email = 'Required';
            // } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
            //   errors.email = 'Invalid email address';
            // }

            // if (!values.password) {
            //   errors.password = 'Required';
            // }

            return errors;
          }}
          onSubmit={(values, { setSubmitting }) => {
            console.log(values);
            setSubmitting(false);
          }}
        >
          {({ values, errors, handleChange, handleBlur, handleSubmit, isSubmitting }) => {
            return (
              <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                    {inputs.map((input, index) => {
                      return (
                        <Box sx={{ gridColumn: input.fullWidth ? 'span 4' : 'span 2' }} key={index}>
                          {input.type === 'date' ? (
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                              <Stack spacing={3}>
                                <DesktopDatePicker
                                  label={input.label}
                                  inputFormat="MM/DD/YYYY"
                                  //@ts-ignore
                                  value={values[input.name]}
                                  onChange={handleChange}
                                  renderInput={(params) => <TextField {...params} />}
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
                                onChange={handleChange}
                              >
                                <MenuItem value={10}>Ten</MenuItem>
                                <MenuItem value={20}>Twenty</MenuItem>
                                <MenuItem value={30}>Thirty</MenuItem>
                              </Select>
                            </FormControl>
                          ) : (
                            <TextField
                              type={input.type}
                              name={input.name}
                              label={input.label}
                              variant="outlined"
                              //@ts-ignore
                              error={Boolean(errors[input.name])}
                              //@ts-ignore
                              helperText={errors[input.name]}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              //@ts-ignore
                              value={values[input.name] || ''}
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
                      sx={{ mr: '20px' }}
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
      <Center>Inventory</Center>
    </Container>
  );
};

export default withLayout(Inventory);
