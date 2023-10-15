export const mockData = [
  { date: '2022-11-02', status: 'Completed', nftName: 'CryptoPunk' },
  { date: '2022-11-03', status: 'Pending', nftName: 'Bored Ape' },
  { date: '2022-11-02', status: 'Cancelled', nftName: 'CryptoPunk' },
  { date: '2022-11-03', status: 'CounterProposal', nftName: 'Bored Ape' },
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
