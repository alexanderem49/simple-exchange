import ExchangeInterface from './ExchangeInterface';
import { useState } from 'react';
import { extractOrderDetail } from '../utils/helpers.jsx';
import { useStore } from '../store/store.js';

function Trade() {
  const [activeTab, setActiveTab] = useState('all-orders');
  const buyOrders = useStore((state) => state.buyOrders);
  const sellOrders = useStore((state) => state.sellOrders);
  const getDisplayInfo = useStore((state) => state.getDisplayInfo);

  const buyOrderData = buyOrders.map((buyOrder) => ({
    give: extractOrderDetail(buyOrder.give, getDisplayInfo),
    want: extractOrderDetail(buyOrder.want, getDisplayInfo)
  }));

  const sellOrderData = sellOrders.map((sellOrder) => ({
    give: extractOrderDetail(sellOrder.give, getDisplayInfo),
    want: extractOrderDetail(sellOrder.want, getDisplayInfo)
  }));

  console.log('buyOrderData ->: ', buyOrderData);

  const renderTableContent = (data) => (
    <table className="border-collapse table-auto w-full whitespace-no-wrap bg-white table-striped relative">
      <thead>
        <tr className="text-left">
          <th className="py-2 px-4 border-b border-gray-200 text-sm">Give</th>
          <th className="py-2 px-4 border-b border-gray-200 text-sm">Want</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => (
          <tr key={index}>
            <td className="py-2 px-4 border-b border-gray-200 text-sm">{item.give}</td>
            <td className="py-2 px-4 border-b border-gray-200 text-sm">{item.want}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderNoDataContent = () => (
    <div className="mt-11">
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
            className={` py-2 ${activeTab === 'all-orders' ? 'underline' : ''}`}
          >
            Order Book
          </button>
        </div>
        <div className="flex space-x-4">
          {sellOrderData.length === 0 && buyOrderData.length === 0 ? (
            <div className="w-full">{renderNoDataContent()}</div>
          ) : (
            <>
              <div className="flex flex-col w-1/2 space-y-4">
                {sellOrderData.length > 0 ? (
                  <>
                    <h2 className="text-lg font-bold">Sell</h2>
                    <div className="overflow-x-auto bg-white rounded-lg shadow overflow-y-auto relative">
                      {renderTableContent(sellOrderData)}
                    </div>
                  </>
                ) : (
                  renderNoDataContent()
                )}
              </div>
              <div className="flex flex-col w-1/2 space-y-4">
                {buyOrderData.length > 0 ? (
                  <>
                    <h2 className="text-lg font-bold">Buy</h2>
                    <div className="overflow-x-auto bg-white rounded-lg shadow overflow-y-auto relative">
                      {renderTableContent(buyOrderData)}
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
