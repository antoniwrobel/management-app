export type ItemType = {
  id: string;
  productName: string;
  purchaseAmount: number;
  saleAmount: number;
  index: string;
  status: string;
  condition: string;
  details: string;
  createDate: Date;
  soldDate: Date;
  sendCost: number;
  valueTransferedToValve: number;
  color: string;
  previousSaleAmount: number | null;
  removed: boolean;
  url: string;
  clearingValueWojtek: number;
  clearingValueStan: number;
  provision: number | null;
  provisionPayed: boolean;
  settled: boolean;
  settlementStatus: 'nierozliczono' | 'rozliczono';
};

export type ValveType = {
  id: string;
  amount: number;
  elementId: string;
  elementName: string;
  createdAt: Date;
  userName: string;
  removed: boolean;
  hasBeenUsed?: boolean;
  useDate: Date;
  details?: string
};

export type SpendingType = {
  id: string;
  elementId: string;
  elementName: string;
  amount: number;
  addedBy: string;
  createdAt: string;
  removed: boolean;
  payProvison: boolean;
};

export type SettlementItemType = {
  id: string;
  createDate: string;
  productName: string;
  clearingValueWojtek: number;
  clearingValueStan: number;
  status: string;
  details: string;
  elementId: string;
  removed: boolean;
  settlementDate: string;
  settled: boolean;
  settlementStatus: string
};
