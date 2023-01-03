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
export function getColor() {
  return randomHexColor();
}

export const magazynInputs = [
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
    options: ['utworzono', 'oczekuję na płatność', 'sprzedano', 'zwrot'],
    name: 'status',
    label: 'status',
    fullWidth: true,
    editOnly: true
  },
  {
    type: 'number',
    name: 'provision',
    label: 'prowizja',
    fullWidth: true
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
    name: 'url',
    label: 'link do aukcji',
    fullWidth: true
  },
  {
    type: 'text',
    name: 'details',
    label: 'uwagi',
    fullWidth: true
  }
];
