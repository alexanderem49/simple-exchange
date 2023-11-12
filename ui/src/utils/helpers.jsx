import { stringifyValue } from '@agoric/ui-components';
export const sellMockData = [
  { date: '2022-11-02', status: 'Completed', nftName: 'CryptoPunk' },
  { date: '2022-11-03', status: 'Pending', nftName: 'Bored Ape' }
];

export const buyMockData = [
  { date: '2022-11-02', status: 'Completed', nftName: 'CryptoPunk' },
  { date: '2022-11-03', status: 'Pending', nftName: 'Bored Ape' }
];

export function getStatusChip(status) {
  let bgColor = '';
  switch (status) {
    case 'Completed':
      bgColor = 'bg-green-500';
      break;
    case 'Pending':
      bgColor = 'bg-yellow-500';
      break;
    case 'Cancelled':
      bgColor = 'bg-red-500';
      break;
    case 'CounterProposal':
      bgColor = 'bg-blue-500';
      break;
    default:
      bgColor = 'bg-gray-500';
  }

  return <span className={`${bgColor} text-white py-1 px-2 rounded-full text-xs`}>{status}</span>;
}

// TODO: change part of BLD and IST
export function extractOrderDetail(order, getDisplayInfo) {
  const orderType = Object.keys(order)[0];
  const { value, brand } = order[orderType];
  const { assetKind, decimalPlaces } = getDisplayInfo(brand);

  const valueString = stringifyValue(value, assetKind, decimalPlaces);
  const currency = orderType === 'Price' ? 'IST' : 'BLD';

  return `${valueString} ${currency}`;
}

export function renderOrderContent(data, renderNoDataContent, renderTableContent) {
  return data && data.length > 0 ? (
    <div className="overflow-x-auto bg-white rounded-lg shadow overflow-y-auto relative">
      {renderTableContent(data)}
    </div>
  ) : (
    renderNoDataContent()
  );
}
