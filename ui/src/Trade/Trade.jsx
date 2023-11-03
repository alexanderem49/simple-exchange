import ExchangeInterface from './ExchangeInterface';
import { useState } from 'react';
import { buyMockData, getStatusChip, sellMockData } from '../utils/helpers.jsx';

function Trade() {
  const [activeTab, setActiveTab] = useState('all-orders');

  const renderTableContent = (data) => (
    <table className="border-collapse table-auto w-full whitespace-no-wrap bg-white table-striped relative">
      <thead>
        <tr className="text-left">
          <th className="py-2 px-4 border-b border-gray-200 text-sm">Date</th>
          <th className="py-2 px-4 border-b border-gray-200 text-sm">Status</th>
          <th className="py-2 px-4 border-b border-gray-200 text-sm">NFT Name</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => (
          <tr key={index}>
            <td className="py-2 px-4 border-b border-gray-200 text-sm">{item.date}</td>
            <td className="py-2 px-4 border-b border-gray-200 text-sm">{getStatusChip(item.status)}</td>
            <td className="py-2 px-4 border-b border-gray-200 text-sm">{item.nftName}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderNoDataContent = () => (
    <div className="p-4">
      <div className="max-w-sm rounded overflow-hidden shadow-lg bg-white p-4">
        <div className="font-bold text-xl mb-2">No Data Available</div>
        <p className="text-gray-700 text-base">
          There are currently no orders available. Check back later or create a new order.
        </p>
      </div>
    </div>
  );

  return (
    <div className="p-8 flex">
      <div className="w-2/3 pr-4">
        <div className="mb-4">
          <button
            onClick={() => setActiveTab('all-orders')}
            className={`px-4 py-2 ${activeTab === 'all-orders' ? 'underline' : ''}`}
          >
            Order Book
          </button>
        </div>
        <div className="flex space-x-4">
          {sellMockData.length === 0 && buyMockData.length === 0 ? (
            <div className="w-full">{renderNoDataContent()}</div>
          ) : (
            <>
              <div className="flex flex-col w-1/2 space-y-4">
                {sellMockData.length > 0 ? (
                  <>
                    <h2 className="text-lg font-bold">Sell</h2>
                    <div className="overflow-x-auto bg-white rounded-lg shadow overflow-y-auto relative">
                      {renderTableContent(sellMockData)}
                    </div>
                  </>
                ) : (
                  renderNoDataContent()
                )}
              </div>
              <div className="flex flex-col w-1/2 space-y-4">
                {buyMockData.length > 0 ? (
                  <>
                    <h2 className="text-lg font-bold">Buy</h2>
                    <div className="overflow-x-auto bg-white rounded-lg shadow overflow-y-auto relative">
                      {renderTableContent(buyMockData)}
                    </div>
                  </>
                ) : (
                  renderNoDataContent()
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="w-1/3 pl-4 flex items-center justify-center mt-20">
        <ExchangeInterface />
      </div>
    </div>
  );
}

export default Trade;
