import ExchangeInterface from './ExchangeInterface';
import { useState } from 'react';
import { getStatusChip, mockData } from '../utils/helpers.jsx';

function Trade() {
  const [activeTab, setActiveTab] = useState('all-orders');

  return (
    <div className="p-8 flex">
      <div className="w-2/3 pr-4">
        <div className="mb-4">
          <button
            onClick={() => setActiveTab('all-orders')}
            className={`${activeTab === 'all-orders' ? 'underline' : ''}`}
          >
            All Orders
          </button>
          <button
            onClick={() => setActiveTab('live-orders')}
            className={`${activeTab === 'live-orders' ? 'underline' : ''}`}
          >
            Live Orders
          </button>
        </div>
        <div className="flex space-x-4">
          <div className="flex flex-col w-1/2 space-y-4">
            <h2 className="text-lg font-bold">Sell</h2>
            <div className="overflow-x-auto bg-white rounded-lg shadow overflow-y-auto relative">
              <table className="border-collapse table-auto w-full whitespace-no-wrap bg-white table-striped relative">
                <thead>
                  <tr className="text-left">
                    <th className="py-2 px-4 border-b border-gray-200 text-left text-sm">Date</th>
                    <th className="py-2 px-4 border-b border-gray-200 text-left text-sm">Status</th>
                    <th className="py-2 px-4 border-b border-gray-200 text-left text-sm">NFT Name</th>
                  </tr>
                </thead>
                <tbody>
                  {mockData.map((data, index) => (
                    <tr key={index}>
                      <td className="py-2 px-4 border-b border-gray-200 text-sm">{data.date}</td>
                      <td className="py-2 px-4 border-b border-gray-200 text-sm">{getStatusChip(data.status)}</td>
                      <td className="py-2 px-4 border-b border-gray-200 text-sm">{data.nftName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* TODO: add similar content for Live Orders*/}
          </div>
          <div className="flex flex-col w-1/2 space-y-4">
            <h2 className="text-lg font-bold">Buy</h2>
            <div className="overflow-x-auto bg-white rounded-lg shadow overflow-y-auto relative">
              <table className="border-collapse table-auto w-full whitespace-no-wrap bg-white table-striped relative">
                <thead>
                  <tr className="text-left">
                    <th className="py-2 px-4 border-b border-gray-200 text-left text-sm">Date</th>
                    <th className="py-2 px-4 border-b border-gray-200 text-left text-sm">Status</th>
                    <th className="py-2 px-4 border-b border-gray-200 text-left text-sm">NFT Name</th>
                  </tr>
                </thead>
                <tbody>
                  {mockData.map((data, index) => (
                    <tr key={index}>
                      <td className="py-2 px-4 border-b border-gray-200 text-sm">{data.date}</td>
                      <td className="py-2 px-4 border-b border-gray-200 text-sm">{getStatusChip(data.status)}</td>
                      <td className="py-2 px-4 border-b border-gray-200 text-sm">{data.nftName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div className="w-1/3 pl-4 flex items-center justify-center mt-20">
        <ExchangeInterface />
      </div>
    </div>
  );
}

export default Trade;