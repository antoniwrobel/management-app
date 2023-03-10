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
  Typography,
  useMediaQuery
} from '@mui/material';
import { DesktopDatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { ItemType, ValveType } from '../../screens/types';
import { auth, db } from '../../config/firebase';
import { handleInputs, isAdminUser } from '../../screens/helpers';
import { useEffect, useState } from 'react';
import { ConfirmationModal } from '../modal/ConfirmationModal';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import LinkSharpIcon from '@mui/icons-material/LinkSharp';
import dayjs from 'dayjs';
import 'react-toastify/dist/ReactToastify.css';

type EditItemProps = {
  editModalOpen: boolean;
  currentSelected: ItemType | undefined;
  getItems: () => void;
  setEditModalOpen: (value: boolean) => void;
  handleValve: (value: string) => void;
};

export const EditItem = (props: EditItemProps) => {
  const navigate = useNavigate();

  const { currentSelected, editModalOpen, getItems, setEditModalOpen, handleValve } = props;
  const [historySectionOpen, setHistorySectionOpen] = useState(false);
  const [historyData, setHistoryData] = useState<
    {
      createdAt?: string;
      id: string;
      productName?: string;
      reference: string;
      details?: string;
      provision?: number;
      purchaseAmount?: number;
      saleAmount?: number;
      sendCost?: number;
      url?: string;
      condition?: string;
    }[]
  >([]);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const matches = useMediaQuery('(max-width:500px)');
  const valveCollectionRef = collection(db, 'valve');
  const changesCollectionRef = collection(db, 'changes');
  const settlementsCollectionRef = collection(db, 'settlements');

  const buttonDisabled = currentSelected?.status === 'sprzedano';
  const magazynInputs = handleInputs();

  const [user] = useState(auth.currentUser);
  const editBlocked = !isAdminUser(user);

  useEffect(() => {
    if (!currentSelected) {
      return;
    }

    if (!editModalOpen) {
      navigate('/');
      setHistoryData([]);
      setHistorySectionOpen(false);
    } else {
      navigate(`?id=${currentSelected.id}`);
    }
  }, [editModalOpen]);

  // useEffect(() => {
  //   if (!editModalOpen) {
  //     return;
  //   }

  //   getChangesHistory();
  // }, [editModalOpen]);

  useEffect(() => {
    if (!historySectionOpen) {
      return;
    }

    getChangesHistory();
  }, [historySectionOpen]);

  const handleDeleteItem = async () => {
    const itemId = currentSelected?.id;

    if (!itemId) {
      return;
    }

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

    await updateDoc(item, {
      removed: true,
      status: currentSelected.status === 'utworzono' ? 'usuni??to' : currentSelected.status,
      deletedDate: dayjs().format()
    });

    setDeleteConfirmationOpen(false);
    setEditModalOpen(false);
    getItems();
    navigate('/');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Skopiowano do schowka!');
  };

  const getChangesHistory = async () => {
    if (!currentSelected) {
      return;
    }

    const c = await getDocs(changesCollectionRef);
    const items = c.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
    //@ts-ignore
    const historyVersions = items.filter((item) => item.reference === currentSelected.id);

    setHistoryData(
      //@ts-ignore
      historyVersions
        //@ts-ignore
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    );
  };

  const handleMapKey = (key: string) => {
    switch (key) {
      case 'productName':
        return 'NAZWA PRODUKTU';
      case 'condition':
        return 'STAN';
      case 'saleAmount':
        return 'KWOTA SPRZEDA??Y';
      case 'purchaseAmount':
        return 'KWOTA ZAKUPU';
      case 'details':
        return 'UWAGI';
      case 'sendCost':
        return 'KOSZTY WYSY??KI';
      case 'provision':
        return 'PROWIZJA';
      case 'url':
        return 'URL';
      case 'createdAt':
        return 'DATA STWORZENIA';
      default:
        return key.toUpperCase();
    }
  };

  const fieldsOrder = [
    'createdAt',
    'productName',
    'status',
    'purchaseAmount',
    'saleAmount',
    'sendConst',
    'provision',
    'url',
    'details'
  ];

  const useKeypress = (key: string, action: () => void) => {
    useEffect(() => {
      //@ts-ignore
      const onKeyup = (e) => {
        if (e.key === key) {
          action();
        }
      };
      window.addEventListener('keyup', onKeyup);

      return () => window.removeEventListener('keyup', onKeyup);
    }, [editModalOpen, historySectionOpen]);
  };

  useKeypress('Escape', () => {
    if (editModalOpen) {
      if (historySectionOpen) {
        setHistorySectionOpen(false);
      } else {
        setEditModalOpen(false);
      }
    }
  });

  if (!currentSelected) {
    return <></>;
  }

  const testData = historyData.map((obj) => {
    const test = {};
    fieldsOrder.forEach((field) => {
      if (field === 'createdAt') {
        return;
      }

      if (obj.hasOwnProperty(field)) {
        //@ts-ignore
        test[field] = [obj[field], obj.createdAt];
      }
    });
    return test;
  });

  const combinedTest = testData.reduce((acc, curr) => {
    Object.entries(curr).forEach(([key, valueArr]) => {
      //@ts-ignore
      const value = `${valueArr[0]}###${dayjs(valueArr[1]).format('DD-MM-YY HH:mm:ss')}`;
      if (acc.hasOwnProperty(key)) {
        //@ts-ignore
        acc[key].push(value);
      } else {
        //@ts-ignore
        acc[key] = [value];
      }
    });
    return acc;
  }, {});

  return (
    <EditModal open={editModalOpen}>
      <>
        {/* HANDLE DELETE MODAL CONFIRMATION */}
        <ConfirmationModal
          handleConfirm={handleDeleteItem}
          open={deleteConfirmationOpen}
          handleReject={() => setDeleteConfirmationOpen(false)}
        />

        <EditModal open={historySectionOpen} noPadding customWidth="750px">
          <Box>
            {Object.keys(combinedTest).length === 0 ? (
              <Box>
                {' '}
                <Typography
                  sx={{
                    mb: '20px',
                    fontWeight: 'bold',
                    fontSize: '24px',
                    textAlign: 'center'
                  }}
                >
                  Brak danych
                </Typography>
                <Box display="flex" justifyContent="flex-end" p="16px" borderTop="1px solid #dedede" mt="16px">
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => {
                      setHistorySectionOpen(false);
                    }}
                    size="small"
                  >
                    Zamknij
                  </Button>
                </Box>
              </Box>
            ) : (
              <>
                <Box
                  sx={{
                    maxHeight: '60vh',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '0 20px 20px'
                  }}
                >
                  <Typography
                    sx={{
                      ml: '4px',
                      mr: '4px',
                      mb: '32px',
                      fontWeight: 'bold',
                      fontSize: '24px',
                      lineHeight: 'inherit'
                    }}
                  >
                    Historia zmian
                  </Typography>

                  {Object.keys(combinedTest).map((key) => {
                    //@ts-ignore
                    const elemArray = combinedTest[key];

                    //@ts-ignore
                    const fixedElemArray = elemArray.map((v) => {
                      const [value, time] = v.split('###');
                      return { value, time };
                    });

                    //@ts-ignore
                    const elementArray = [currentSelected[key], ...fixedElemArray];
                    if (key === 'createdAt') {
                      return;
                    }

                    return (
                      <Box
                        key={key}
                        sx={{ mb: '20px', padding: '4px 8px', border: '1px solid #dedede', borderRadius: '4px' }}
                      >
                        <Box
                          sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '74px', alignItems: 'center' }}
                        >
                          <Typography
                            sx={{
                              ml: '4px',
                              mr: '4px',
                              fontWeight: 'bold',
                              lineHeight: 'inherit'
                            }}
                          >
                            {handleMapKey(key)}
                          </Typography>

                          <Select name={key} value={elementArray[0]} sx={{ width: '450px' }}>
                            {elementArray.map((data, id) => {
                              const v = typeof data === 'object' ? data.value : data;
                              const d = typeof data === 'object' ? data.time : '';
                              return (
                                <MenuItem
                                  key={`${key}_${id}`}
                                  value={v}
                                  sx={{
                                    fontSize: '18px',
                                    height: '40px',
                                    backgroundColor: id === 0 ? 'inherit' : '#fff !important'
                                  }}
                                >
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      width: '100%',
                                      justifyContent: 'space-between'
                                    }}
                                  >
                                    <Typography>{v}</Typography>
                                    <Typography>{d}</Typography>
                                  </Box>
                                </MenuItem>
                              );
                            })}
                          </Select>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>

                <Box display="flex" justifyContent="flex-end" p="16px" borderTop="1px solid #dedede" mt="16px">
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => {
                      setHistorySectionOpen(false);
                    }}
                    size="small"
                  >
                    Zamknij
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </EditModal>

        <Formik
          initialValues={{
            createDate: currentSelected.createDate,
            productName: currentSelected.productName,
            purchaseAmount: currentSelected.purchaseAmount,
            saleAmount: currentSelected.saleAmount,
            soldDate: currentSelected.soldDate,
            status: currentSelected.status,
            condition: currentSelected.condition,
            sendCost: currentSelected.sendCost,
            details: currentSelected.details,
            valueTransferedToValve: currentSelected.valueTransferedToValve,
            url: currentSelected.url,
            provision: currentSelected.provision
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
              errors.purchaseAmount = 'Kwota zakupu musi by?? wi??ksza od 0';
            }

            if (saleAmount !== '' && saleAmount <= 0) {
              errors.saleAmount = 'Kwota sprzeda??y musi by?? wi??ksza od 0';
            }

            if (values.status === 'sprzedano') {
              if (!values.saleAmount) {
                errors.saleAmount = 'Kwota zakupu musi by?? wi??ksza od 0';
              }

              if (typeof values.sendCost === 'string') {
                //@ts-ignore
                if (values.sendCost.trim() === '') {
                  errors.sendCost = 'Podaj koszt wysy??ki!';
                }
              }
            }
            return errors;
          }}
          onSubmit={async (values, { setSubmitting }) => {
            if (!currentSelected) return;

            if (editBlocked) {
              return;
            }

            const valuesToCompare = [
              'condition',
              'details',
              'productName',
              'provision',
              'purchaseAmount',
              'saleAmount',
              'sendCost',
              'soldDate',
              'status',
              'url'
            ];

            const changesObj = {};

            valuesToCompare.forEach((value) => {
              //@ts-ignore
              if (currentSelected[value] !== values[value]) {
                //@ts-ignore
                changesObj[value] = currentSelected[value];
              }
            });

            const hasDataBeenChanged = Object.keys(changesObj).some((value) => valuesToCompare.includes(value));

            if (hasDataBeenChanged) {
              //@ts-ignore
              const combinedData = {};

              Object.keys(changesObj).forEach((key) => {
                //@ts-ignore
                combinedData[key] = changesObj[key];
              });

              //@ts-ignore
              combinedData.reference = currentSelected.id;

              try {
                await addDoc(changesCollectionRef, {
                  createdAt: dayjs().format(),
                  ...combinedData
                });
              } catch (error) {
                console.error(error);
              }
            }

            const itemDoc = doc(db, 'items', currentSelected.id);
            const profit =
              (values.saleAmount - values.purchaseAmount - (values.provision || 0) - (values.sendCost || 0)) / 2;
            const clearingValueWojtek = (values.purchaseAmount + profit).toFixed(2) || 0;
            const clearingValueStan = profit.toFixed(2);
            const shouldAddSpendings = values.status === 'sprzedano';
            const isReturn = currentSelected.status === 'zwrot' && values.status === 'utworzono';
            const shouldClearSettled = isReturn && currentSelected.settled;

            try {
              await updateDoc(itemDoc, {
                createDate: isReturn ? dayjs().format() : values.createDate || null,
                productName: values.productName,
                purchaseAmount: values.purchaseAmount,
                saleAmount: values.saleAmount,
                soldDate: isReturn ? null : values.soldDate || null,
                sendCost: values.sendCost,
                status: values.status,
                details: isReturn ? '' : values.details,
                url: values.url,
                settled: shouldClearSettled && false,
                provision: values.provision || 0,
                ...(shouldAddSpendings && {
                  clearingValueWojtek,
                  clearingValueStan
                })
              });
            } catch (error) {
              console.error(error);
            }

            if (values.status === 'sprzedano') {
              try {
                await addDoc(settlementsCollectionRef, {
                  createDate: dayjs().format(),
                  productName: values.productName,
                  clearingValueWojtek,
                  status: 'sprzedano',
                  details: values.details,
                  elementId: currentSelected.id
                });
                await updateDoc(itemDoc, {
                  soldDate: dayjs().format()
                });
              } catch (error) {
                console.error(error);
              }
            }

            getItems();
            setSubmitting(false);
            // setEditModalOpen(false);
            toast.success('Zapisano zmiany.');
          }}
        >
          {({ setFieldValue, values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => {
            return (
              <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                    {magazynInputs.map((input, index) => {
                      const fullWidth = index >= 1 && magazynInputs[index - 1].addOnly ? true : input.fullWidth;

                      const editEnabledOptions = currentSelected.status === 'zwrot' ? ['status'] : [''];
                      const statusBlock = ['sprzedano', 'zwrot'];
                      const editDisabled =
                        (statusBlock.includes(currentSelected.status) && !editEnabledOptions.includes(input.name)) ||
                        editBlocked;

                      if (input.addOnly) {
                        return;
                      }

                      return (
                        <Box sx={{ gridColumn: matches ? 'span 4' : fullWidth ? 'span 4' : 'span 2' }} key={input.name}>
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
                              <InputLabel id="demo-simple-select-label" disabled={editDisabled}>
                                {input.label}
                              </InputLabel>
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
                                  const blocked = option === 'sprzedano' && currentSelected.status === 'zwrot';

                                  return (
                                    <MenuItem key={option} value={option} disabled={option === 'zwrot' || blocked}>
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
                          value={`${Number(values.valueTransferedToValve).toFixed(2)}z??`}
                          fullWidth
                        />
                      </Box>
                    ) : null}

                    <Box sx={{ gridColumn: 'span 4', justifyContent: 'space-between', display: 'flex' }}>
                      <Button
                        variant="contained"
                        sx={{ mr: '10px' }}
                        onClick={() => {
                          setHistorySectionOpen(true);
                        }}
                      >
                        Historia
                      </Button>

                      <Button
                        variant="contained"
                        sx={{ mr: '10px' }}
                        disabled={currentSelected.status !== 'sprzedano'}
                        onClick={() => {
                          handleValve(currentSelected.id);
                        }}
                      >
                        Skarbonka
                      </Button>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: '20px' }}>
                    <Button
                      variant="contained"
                      size="small"
                      color="error"
                      disabled={isSubmitting || buttonDisabled || editBlocked}
                      onClick={() => {
                        setDeleteConfirmationOpen(true);
                      }}
                    >
                      Usu??
                    </Button>
                    <LinkSharpIcon
                      fontSize="large"
                      sx={{ marginLeft: '16px', mr: 'auto', color: '#197bcf', cursor: 'pointer' }}
                      onClick={copyToClipboard}
                    />
                    <Button
                      variant="outlined"
                      sx={{ mr: '10px' }}
                      color="error"
                      onClick={() => {
                        setEditModalOpen(false);
                      }}
                      size="small"
                    >
                      Zamknij
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      type="submit"
                      disabled={isSubmitting || buttonDisabled || editBlocked}
                    >
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
