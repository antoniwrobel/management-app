import { User } from 'firebase/auth';
import { useState } from 'react';

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

export const handleInputs = (addForm = false) => {
  return [
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
      options: ['utworzono', 'sprzedano', 'zwrot'],
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
      type: 'number',
      name: 'sendCost',
      label: 'koszt wysyłki'
    },
    {
      type: 'number',
      name: 'provision',
      label: 'prowizja',
      editOnly: true
    },
    {
      type: 'date',
      name: 'createDate',
      label: 'data stworzenia',
      fullWidth: !addForm
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
};

export const handleSpendingInputs = (addOnly = false) => {
  return [
    {
      type: 'checkbox',
      name: 'payProvision',
      label: 'opłata prowizji',
      fullWidth: true,
      addOnly
    },
    // {
    //   type: 'checkbox',
    //   name: 'useValve',
    //   label: 'użyj skarbonki',
    //   fullWidth: true,
    //   addOnly
    // },
    {
      type: 'text',
      name: 'elementName',
      label: 'nazwa wydatku',
      fullWidth: true
    },
    {
      type: 'text',
      name: 'amount',
      label: 'kwota wydatku'
    },
    {
      type: 'select',
      options: ['Stan dla Wojtek', 'Wojtek dla Stan', 'Stan / 2', 'Wojtek / 2', 'automat'],
      name: 'addedBy',
      label: 'kto wydał'
    }
  ];
};

export const isAdminUser = (user: User | null) => {
  if (!user) return false;
  const adminUserEmails = ['antoni.aleksander@gmail.com', 'stanwrobel90@gmail.com'];
  const userEmail = user.email || '';

  return adminUserEmails.includes(userEmail);
};

export const handleSettlementInputs = () => {
  return [];
};

// Hook
export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.log(error);
      return initialValue;
    }
  });
  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to local storage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.log(error);
    }
  };
  return [storedValue, setValue] as const;
}
