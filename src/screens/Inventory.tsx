import { useEffect, useState, MouseEvent } from 'react';

import withLayout from '../components/layout/withLayout';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Center from '../components/utils/Center';
import AddItemModal from '../components/modal/Modal';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';

import { Formik } from 'formik';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { Checkbox, FormControlLabel, useMediaQuery } from '@mui/material';

import { db } from '../config/firebase';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from '@firebase/firestore';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import Paper from '@mui/material/Paper';

import { alpha } from '@mui/material/styles';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableSortLabel from '@mui/material/TableSortLabel';
import Toolbar from '@mui/material/Toolbar';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Switch from '@mui/material/Switch';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import { visuallyHidden } from '@mui/utils';

import dayjs from 'dayjs';

import ValveModal from '../components/modal/ValveModal';

function randomInteger(max: number) {
  return Math.floor(Math.random() * (max + 1));
}
function randomRgbColor() {
  let r = randomInteger(255);
  let g = randomInteger(255);
  let b = randomInteger(255);
  return [r, g, b];
}
function randomHexColor() {
  let [r, g, b] = randomRgbColor();
  let hr = r.toString(16).padStart(2, '0');
  let hg = g.toString(16).padStart(2, '0');
  let hb = b.toString(16).padStart(2, '0');
  return '#' + hr + hg + hb;
}
function getColor() {
  return randomHexColor();
}

interface Data {
  productName: string;
  quantity: number;
  condition: string;
  status: string;
  purchaseAmount: number;
  saleAmount: number;
  createDate: Date;
  details: string;
  profit: number;
  profit1: number;
}

//@ts-ignore
const rows = [];

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

type Order = 'asc' | 'desc';

function getComparator<Key extends keyof any>(
  order: Order,
  orderBy: Key
): (a: { [key in Key]: number | string }, b: { [key in Key]: number | string }) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

// Since 2020 all major browsers ensure sort stability with Array.prototype.sort().
// stableSort() brings sort stability to non-modern browsers (notably IE11). If you
// only support modern browsers you can replace stableSort(exampleArray, exampleComparator)
// with exampleArray.slice().sort(exampleComparator)
function stableSort<T>(array: readonly T[], comparator: (a: T, b: T) => number) {
  const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

interface HeadCell {
  id: keyof Data;
  type: 'text' | 'select' | 'number' | 'date';
  label: string;
  numeric?: boolean;
  fullWidth?: boolean;
  options?: string[];
  editOnly?: boolean;
  addOnly?: boolean;
}

const headCells: readonly HeadCell[] = [
  {
    type: 'text',
    id: 'productName',
    label: 'nazwa produktu',
    fullWidth: true
  },
  {
    type: 'select',
    options: ['nowe', 'używane'],
    id: 'condition',
    label: 'stan'
  },
  {
    type: 'select',
    options: ['utworzono', 'oczekuję na płatność', 'sprzedano'],
    id: 'status',
    label: 'status',
    fullWidth: true,
    editOnly: true
  },
  {
    type: 'number',
    id: 'purchaseAmount',
    label: 'kwota zakupu'
  },
  {
    type: 'number',
    id: 'saleAmount',
    label: 'kwota sprzedazy'
  },
  {
    type: 'number',
    id: 'profit',
    label: 'zysk stan'
  },
  {
    type: 'number',
    id: 'profit1',
    label: 'zysk wojtek'
  },
  {
    type: 'date',
    id: 'createDate',
    label: 'data stworzenia',
    fullWidth: true
  },
  {
    type: 'text',
    id: 'details',
    label: 'uwagi',
    fullWidth: true
  }
];

interface EnhancedTableProps {
  numSelected: number;
  onRequestSort: (event: React.MouseEvent<unknown>, property: keyof Data) => void;
  onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
  order: Order;
  orderBy: string;
  rowCount: number;
}

function EnhancedTableHead(props: EnhancedTableProps) {
  const { onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort } = props;
  const createSortHandler = (property: keyof Data) => (event: React.MouseEvent<unknown>) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
          <Checkbox
            color="primary"
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
            inputProps={{
              'aria-label': 'select all desserts'
            }}
          />
        </TableCell>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? 'right' : 'left'}
            padding={'normal'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

interface EnhancedTableToolbarProps {
  numSelected: number;
}

function EnhancedTableToolbar(props: EnhancedTableToolbarProps) {
  const { numSelected } = props;

  return (
    <Toolbar
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 1 },
        ...(numSelected > 0 && {
          bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity)
        })
      }}
    >
      {numSelected > 0 ? (
        <Typography sx={{ flex: '1 1 100%' }} color="inherit" variant="subtitle1" component="div">
          {numSelected} selected
        </Typography>
      ) : (
        <Typography sx={{ flex: '1 1 100%' }} variant="h6" id="tableTitle" component="div">
          Nutrition
        </Typography>
      )}
      {numSelected > 0 ? (
        <Tooltip title="Delete">
          <IconButton>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title="Filter list">
          <IconButton>
            <FilterListIcon />
          </IconButton>
        </Tooltip>
      )}
    </Toolbar>
  );
}

export function EnhancedTable() {
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof Data>('productName');
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [page, setPage] = useState(0);
  const [dense, setDense] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [items, setItems] = useState<any>([]);

  const itemsCollectionRef = collection(db, 'items');

  const getItems = async () => {
    // const data = await getDocs(itemsCollectionRef);
    // const items = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));

    setItems([]);
  };

  useEffect(() => {
    getItems();
  });

  const handleRequestSort = (event: MouseEvent<unknown>, property: keyof Data) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      //@ts-ignore
      const newSelected = rows.map((n) => n.productName);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event: React.MouseEvent<unknown>, name: string) => {
    const selectedIndex = selected.indexOf(name);
    let newSelected: readonly string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, name);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
    }

    setSelected(newSelected);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleChangeDense = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDense(event.target.checked);
  };

  let summaryWojt = 0;
  let summaryStan = 0;

  const isSelected = (name: string) => selected.indexOf(name) !== -1;

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <EnhancedTableToolbar numSelected={selected.length} />
        <TableContainer>
          <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size={dense ? 'small' : 'medium'}>
            <EnhancedTableHead
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={handleSelectAllClick}
              onRequestSort={handleRequestSort}
              rowCount={rows.length}
            />
            <TableBody>
              {/* //@ts-ignore */}
              {items.map((row: any, index: number) => {
                const profit = row.saleAmount ? (row.saleAmount - row.purchaseAmount) / 2 : false;

                summaryWojt +=
                  row.status === 'sprzedano' ? (profit ? row.purchaseAmount + profit : row.purchaseAmount) : 0;
                summaryStan += row.status === 'sprzedano' ? profit || 0 : 0;

                const isItemSelected = isSelected(row.productName);
                const labelId = `enhanced-table-checkbox-${index}`;

                return (
                  <TableRow
                    hover
                    onClick={(event) => handleClick(event, row.productName)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={row.id}
                    selected={isItemSelected}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={isItemSelected}
                        inputProps={{
                          'aria-labelledby': labelId
                        }}
                      />
                    </TableCell>

                    <TableCell align="right">{row.productName}</TableCell>
                    <TableCell align="right">{row.condition}</TableCell>
                    <TableCell align="right">{row.status}</TableCell>
                    <TableCell align="right">{row.purchaseAmount}zł</TableCell>
                    <TableCell align="right">{row.saleAmount ? `${row.saleAmount}zł` : '-'} </TableCell>
                    <TableCell align="right">{profit ? `${profit}zł` : '-'}</TableCell>
                    <TableCell align="right">
                      {' '}
                      {row.saleAmount ? `${profit ? row.purchaseAmount + profit : row.purchaseAmount}zł` : '-'}
                    </TableCell>
                    <TableCell align="right">{dayjs(row.createDate).format('DD/MM/YYYY')}</TableCell>
                    <TableCell align="right">{row.soldDate ? dayjs(row.soldDate).format('DD/MM/YYYY') : '-'}</TableCell>
                    <TableCell align="right">{row.details}</TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="contained" type="submit">
                        Edytuj
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {emptyRows > 0 && (
                <TableRow
                  style={{
                    height: (dense ? 33 : 53) * emptyRows
                  }}
                >
                  <TableCell colSpan={6} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
}

const inputs = [
  // {
  //   type: 'checkbox',
  //   name: 'takenIntoCommission',
  //   label: 'komis',
  //   fullWidth: true
  // },
  {
    type: 'text',
    name: 'productName',
    label: 'nazwa produktu',
    fullWidth: true
  },
  {
    type: 'number',
    name: 'quantity',
    label: 'ilość',
    addOnly: true
  },
  {
    type: 'select',
    options: ['nowe', 'używane'],
    name: 'condition',
    label: 'stan'
  },
  {
    type: 'select',
    options: ['utworzono', 'oczekuję na płatność', 'sprzedano'],
    name: 'status',
    label: 'status',
    fullWidth: true,
    editOnly: true
  },
  {
    type: 'number',
    name: 'purchaseAmount',
    label: 'kwota zakupu'
  },
  {
    type: 'number',
    name: 'saleAmount',
    label: 'kwota sprzedazy'
  },
  {
    type: 'date',
    name: 'createDate',
    label: 'data stworzenia',
    fullWidth: true
  },
  {
    type: 'text',
    name: 'details',
    label: 'uwagi',
    fullWidth: true
  }
];

const Inventory = () => {
  useEffect(() => {}, []);
  const matches = useMediaQuery('(max-width:500px)');

  type ItemType = {
    id: string;
    productName: string;
    purchaseAmount: number;
    saleAmount: number;
    index: string;
    takenIntoCommission: boolean;
    status: string;
    condition: string;
    details: string;
    createDate: Date;
    soldDate: Date;
    color: string;
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [valveModalOpen, setValveModalOpen] = useState(false);
  const [currentSelected, setCurrentSelected] = useState<ItemType>();
  const [items, setItems] = useState<ItemType[]>([]);

  const itemsCollectionRef = collection(db, 'items');

  const getItems = async () => {
    const data = await getDocs(itemsCollectionRef);
    const items = data.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as ItemType[];

    setItems(items);
  };

  const handleDeleteItem = async (itemId: string) => {
    deleteDoc(doc(db, 'items', itemId));
  };

  useEffect(() => {
    getItems();
  }, []);

  const initialValues = {
    productName: '',
    status: '',
    quantity: '',
    condition: '',
    purchaseAmount: '',
    takenIntoCommission: false,
    color: '',
    saleAmount: '',
    createDate: dayjs().format(),
    details: ''
  };

  const addToValve = (itemId: string) => {
    const selectedItem = items.find((item) => item.id === itemId);

    if (selectedItem) {
      setCurrentSelected(selectedItem);
      setValveModalOpen(true);
    }
  };

  let summaryWojt = 0;
  let summaryStan = 0;

  return (
    <Container sx={{ p: '20px', maxWidth: 'calc(100% - 20px)!important' }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={() => setModalOpen(true)}>
          Dodaj
        </Button>
      </Box>

      <AddItemModal open={modalOpen}>
        <Formik
          initialValues={initialValues}
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

            if (values.createDate === 'Invalid Date') {
              errors.createDate = 'Błędny format daty';
            }

            if (values.status === 'sprzedano') {
              if (!values.saleAmount) {
                errors.saleAmount = 'Kwota zakupu musi być większa od 0';
              }
            }

            return errors;
          }}
          onSubmit={async (values, { setSubmitting }) => {
            const color = getColor();
            //@ts-ignore
            const addDocumentPromises = [...Array(parseInt(values.quantity) || 1).keys()].map(() =>
              addDoc(itemsCollectionRef, {
                createDate: values.createDate,
                productName: values.productName,
                purchaseAmount: values.purchaseAmount,
                saleAmount: values.saleAmount || null,
                status: 'utworzono',
                condition: values.condition,
                takenIntoCommission: values.takenIntoCommission || false,
                details: values.details,
                color
              })
            );

            await Promise.all(addDocumentPromises);

            getItems();
            setSubmitting(false);
            setModalOpen(false);
          }}
        >
          {({ setFieldValue, values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => {
            return (
              <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                    {inputs.map((input, index) => {
                      if (input.editOnly) {
                        return;
                      }
                      return (
                        <Box
                          sx={{
                            gridColumn: matches ? 'span 4' : input.fullWidth ? 'span 4' : 'span 2'
                          }}
                          key={index}
                        >
                          {input.type === 'date' ? (
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                              <Stack spacing={3}>
                                <DesktopDatePicker
                                  label={input.label}
                                  inputFormat="DD/MM/YYYY"
                                  //@ts-ignore
                                  value={values[input.name]}
                                  onChange={(d) => {
                                    setFieldValue(input.name, dayjs(d).format());
                                  }}
                                  renderInput={(params) => {
                                    return (
                                      <TextField
                                        {...params}
                                        datatype="date"
                                        type="date"
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
                                label={input.label}
                                onChange={(d) => {
                                  setFieldValue(input.name, d.target.value);
                                }}
                              >
                                {input.options?.map((option) => {
                                  return (
                                    <MenuItem key={option} value={option}>
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
                                  onChange={(v) => {
                                    const value = v.target.value === 'on' ? true : false;
                                    setFieldValue(input.name, value);
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
                      variant="outlined"
                      sx={{ mr: '10px' }}
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
      <ValveModal open={valveModalOpen}>
        <Formik
          initialValues={{
            createDate: currentSelected?.createDate || '',
            productName: currentSelected?.productName || '',
            purchaseAmount: currentSelected?.purchaseAmount || '',
            takenIntoCommission: currentSelected?.takenIntoCommission || false,
            saleAmount: currentSelected?.saleAmount || '',
            soldDate: currentSelected?.soldDate || '',
            status: currentSelected?.status || '',
            condition: currentSelected?.condition || '',
            details: currentSelected?.details || ''
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

            // if (values.createDate === 'Invalid Date') {
            //   errors.createDate = 'Błędny format daty';
            // }

            // if (values.soldDate === 'Invalid Date') {
            //   errors.soldDate = 'Błędny format daty';
            // }

            return errors;
          }}
          onSubmit={async (values, { setSubmitting }) => {
            if (!currentSelected) return;

            const itemDoc = doc(db, 'items', currentSelected.id);

            //@ts-ignore
            await updateDoc(itemDoc, {
              createDate: values.createDate,
              productName: values.productName,
              purchaseAmount: values.purchaseAmount,
              saleAmount: values.saleAmount || null,
              takenIntoCommission: values.takenIntoCommission || false,
              soldDate: values.soldDate || null,
              status: values.status,
              details: values.details
            });

            getItems();
            setSubmitting(false);
            setValveModalOpen(false);
          }}
        >
          {({ setFieldValue, values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => {
            return (
              <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                    {inputs.map((input, index) => {
                      const fullWidth = index >= 1 && inputs[index - 1].addOnly ? true : input.fullWidth;

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
                                  onChange={(d) => {
                                    setFieldValue(input.name, dayjs(d).format());
                                  }}
                                  renderInput={(params) => {
                                    return (
                                      <TextField
                                        {...params}
                                        datatype="date"
                                        type="date"
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
                                label={input.label}
                                onChange={(d) => {
                                  setFieldValue(input.name, d.target.value);
                                }}
                              >
                                {input.options?.map((option) => {
                                  return (
                                    <MenuItem key={option} value={option}>
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
                      variant="outlined"
                      size="small"
                      color="error"
                      disabled={isSubmitting}
                      sx={{ mr: 'auto' }}
                      onClick={async () => {
                        await handleDeleteItem(currentSelected!.id);
                        setValveModalOpen(false);
                        getItems();
                      }}
                    >
                      Usuń
                    </Button>
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

      <Center>
        {/* <EnhancedTable /> */}
        <TableContainer component={Paper} sx={{ mt: '20px' }}>
          <Table sx={{ minWidth: 1550 }}>
            <TableHead>
              <TableRow>
                <TableCell>Nazwa produktu</TableCell>

                <TableCell align="right">stan</TableCell>

                <TableCell align="right">status</TableCell>

                <TableCell align="right">kwota zakupu</TableCell>

                <TableCell align="right">kwota sprzedazy</TableCell>

                <TableCell align="right">saldo stan</TableCell>

                <TableCell align="right">saldo wojtek</TableCell>

                <TableCell align="right">data stworzenia</TableCell>

                <TableCell align="right">data sprzedazy</TableCell>

                <TableCell align="right">uwagi</TableCell>

                <TableCell align="right">akcja</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!items.length ? (
                <TableRow>
                  <TableCell component="th" scope="row" align="left">
                    brak danych
                  </TableCell>
                </TableRow>
              ) : (
                items
                  // @ts-ignore
                  .sort((a, b) => new Date(b.createDate) - new Date(a.createDate))
                  .map((item) => {
                    const profit = item.saleAmount ? (item.saleAmount - item.purchaseAmount) / 2 : false;
                    summaryWojt +=
                      item.status === 'sprzedano' ? (profit ? item.purchaseAmount + profit : item.purchaseAmount) : 0;
                    summaryStan += item.status === 'sprzedano' ? profit || 0 : 0;

                    return (
                      <TableRow
                        key={item.id}
                        sx={{ backgroundColor: `${item.color}26`, '&:last-child td, &:last-child th': { border: 0 } }}
                      >
                        <TableCell component="th" scope="row">
                          {item.productName}
                        </TableCell>

                        <TableCell align="right">{item.condition}</TableCell>

                        <TableCell align="right">{item.status}</TableCell>

                        <TableCell align="right">{item.purchaseAmount}zł</TableCell>

                        <TableCell align="right">{item.saleAmount ? `${item.saleAmount}zł` : '-'} </TableCell>

                        <TableCell align="right">{profit ? `${profit}zł` : '-'}</TableCell>

                        <TableCell align="right">
                          {item.saleAmount ? `${profit ? item.purchaseAmount + profit : item.purchaseAmount}zł` : '-'}
                        </TableCell>

                        <TableCell align="right">{dayjs(item.createDate).format('DD/MM/YYYY')}</TableCell>

                        <TableCell align="right">
                          {item.soldDate ? dayjs(item.soldDate).format('DD/MM/YYYY') : '-'}
                        </TableCell>

                        <TableCell
                          align="right"
                          style={{
                            width: '50px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {item.details}
                        </TableCell>

                        <TableCell align="right">
                          <Button size="small" variant="contained" type="submit" onClick={() => addToValve(item.id)}>
                            Edytuj
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
          <Box
            sx={{
              minWidth: 1550,
              padding: '16px',
              borderTop: '16px solid #dedede',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box sx={{ fontWeight: 'bold' }}>Podsumowanie</Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              Wojtek suma:{' '}
              <Box sx={{ fontWeight: 'bold', marginLeft: '10px', minWidth: '150px', textAlign: 'end' }}>
                {summaryWojt.toFixed(2)}zł
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              Stan suma:{' '}
              <Box sx={{ fontWeight: 'bold', marginLeft: '10px', minWidth: '150px', textAlign: 'end' }}>
                {summaryStan.toFixed(2)}zł
              </Box>
            </Box>
          </Box>
        </TableContainer>
        ;
      </Center>
    </Container>
  );
};

export default withLayout(Inventory);

{
  /* <TableContainer component={Paper} sx={{ mt: '20px' }}>
  <Table sx={{ minWidth: 1550 }}>
    <TableHead>
      <TableRow>
        <TableCell>Nazwa produktu</TableCell>

        <TableCell align="right">stan</TableCell>

        <TableCell align="right">status</TableCell>

        <TableCell align="right">kwota zakupu</TableCell>

        <TableCell align="right">kwota sprzedazy</TableCell>

        <TableCell align="right">saldo stan</TableCell>

        <TableCell align="right">saldo wojtek</TableCell>

        <TableCell align="right">data stworzenia</TableCell>

        <TableCell align="right">data sprzedazy</TableCell>

        <TableCell align="right">uwagi</TableCell>

        <TableCell align="right">akcja</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {!items.length ? (
        <TableRow>
          <TableCell component="th" scope="row" align="left">
            brak danych
          </TableCell>
        </TableRow>
      ) : (
        items
          // @ts-ignore
          .sort((a, b) => new Date(b.createDate) - new Date(a.createDate))
          .map((item) => {
            const profit = item.saleAmount ? (item.saleAmount - item.purchaseAmount) / 2 : false;
            summaryWojt +=
              item.status === 'sprzedano' ? (profit ? item.purchaseAmount + profit : item.purchaseAmount) : 0;
            summaryStan += item.status === 'sprzedano' ? profit || 0 : 0;

            return (
              <TableRow
                key={item.id}
                sx={{ backgroundColor: `${item.color}26`, '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {item.productName}
                </TableCell>

                <TableCell align="right">{item.condition}</TableCell>

                <TableCell align="right">{item.status}</TableCell>

                <TableCell align="right">{item.purchaseAmount}zł</TableCell>

                <TableCell align="right">{item.saleAmount ? `${item.saleAmount}zł` : '-'} </TableCell>

                <TableCell align="right">{profit ? `${profit}zł` : '-'}</TableCell>

                <TableCell align="right">
                  {item.saleAmount ? `${profit ? item.purchaseAmount + profit : item.purchaseAmount}zł` : '-'}
                </TableCell>

                <TableCell align="right">{dayjs(item.createDate).format('DD/MM/YYYY')}</TableCell>

                <TableCell align="right">{item.soldDate ? dayjs(item.soldDate).format('DD/MM/YYYY') : '-'}</TableCell>

                <TableCell
                  align="right"
                  style={{
                    width: '50px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {item.details}
                </TableCell>

                <TableCell align="right">
                  <Button size="small" variant="contained" type="submit" onClick={() => addToValve(item.id)}>
                    Edytuj
                  </Button>
                </TableCell>
              </TableRow>
            );
          })
      )}
    </TableBody>
  </Table>
  <Box
    sx={{
      minWidth: 1550,
      padding: '16px',
      borderTop: '16px solid #dedede',
      display: 'flex',
      flexDirection: 'column'
    }}
  >
    <Box sx={{ fontWeight: 'bold' }}>Podsumowanie</Box>
    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
      Wojtek suma:{' '}
      <Box sx={{ fontWeight: 'bold', marginLeft: '10px', minWidth: '150px', textAlign: 'end' }}>
        {summaryWojt.toFixed(2)}zł
      </Box>
    </Box>
    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
      Stan suma:{' '}
      <Box sx={{ fontWeight: 'bold', marginLeft: '10px', minWidth: '150px', textAlign: 'end' }}>
        {summaryStan.toFixed(2)}zł
      </Box>
    </Box>
  </Box>
</TableContainer>; */
}
