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
  provision: number;
  valueTransferedToValve: number;
  color: string;
  previousSaleAmount: number | null;
  removed: boolean;
  url: string;
};

export type ValveType = {
  id: string;
  amount: number;
  elementId: string;
  elementName: string;
  createdAt: Date;
  userName: string;
  removed: boolean;
};

export type SpendingType = {
  id: string;
  elementId: string;
  elementName: string;
  amount: number;
  addedBy: string;
  createdAt: string;
};

export type SettlementItemType = {
  id: string;
  createDate: string;
  productName: string;
  amount: number;
  status: string;
  details: string;
  elementId: string;
  removed: boolean;
};
