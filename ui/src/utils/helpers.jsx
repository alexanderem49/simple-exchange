import { stringifyValue } from '@agoric/ui-components';
export const sellMockData = [
  { date: '2022-11-02', status: 'Completed', nftName: 'CryptoPunk' },
  { date: '2022-11-03', status: 'Pending', nftName: 'Bored Ape' }
];

export const buyMockData = [
  { date: '2022-11-02', status: 'Completed', nftName: 'CryptoPunk' },
  { date: '2022-11-03', status: 'Pending', nftName: 'Bored Ape' }
];

export function extractOrderDetail(order, getDisplayInfo, assetBrandName, priceBrandName) {
  const orderType = Object.keys(order)[0];
  const { value, brand } = order[orderType];
  const { assetKind, decimalPlaces } = getDisplayInfo(brand);

  const valueString = stringifyValue(value, assetKind, decimalPlaces);
  const currency = orderType === 'Price' ? priceBrandName : assetBrandName;

  return `${valueString} ${currency}`;
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function isValidInput(value) {
  const num = parseFloat(value.trim());
  return !isNaN(num) && num > 0;
}
