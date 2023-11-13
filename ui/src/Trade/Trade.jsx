import { Tab } from '@headlessui/react';
import ExchangeInterface from './ExchangeInterface';
import { useEffect, useState } from 'react';
import { extractOrderDetail } from '../utils/helpers.jsx';
import { useStore } from '../store/store.js';
import { Pagination } from './Pagination.jsx';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function Trade() {
  const buyOrders = useStore((state) => state.buyOrders);
  const sellOrders = useStore((state) => state.sellOrders);
  const getDisplayInfo = useStore((state) => state.getDisplayInfo);

  const liveBuyOrders = useStore((state) => state.liveBuyOrders);
  const liveSellOrders = useStore((state) => state.liveSellOrders);

  const [currentSellPage, setCurrentSellPage] = useState(1);
  const [currentBuyPage, setCurrentBuyPage] = useState(1);
  const itemsPerPage = 4;

  const transformOrderData = (orders) =>
    orders.map((order) => ({
      give: extractOrderDetail(order.give, getDisplayInfo),
      want: extractOrderDetail(order.want, getDisplayInfo)
    }));

  const OrderSection = ({ title, data, currentPage, onPageChange }) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);
    const totalPages = Math.ceil(data.length / itemsPerPage);

    return (
      <div className="flex flex-col w-full lg:w-2/3 space-y-4">
        <h2 className="text-lg font-bold mt-4 px-1">{title}</h2>
        {paginatedData && paginatedData.length > 0 ? (
          <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
            {renderTableContent(paginatedData)}
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
          </div>
        ) : (
          renderNoDataContent()
        )}
      </div>
    );
  };

  const renderTableContent = (data) => (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Give</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Want</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {data.map((item, index) => (
          <tr key={index}>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.give}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.want}</td>
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

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {}, [selectedIndex]);

  return (
    <div className="p-8 flex flex-col lg:flex-row">
      <div className="w-full lg:w-2/3 pr-4">
        <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
          <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/10 p-1 mt-4">
            {['Order Book', 'Your Orders'].map((tab) => (
              <Tab
                key={tab}
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700',
                    'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                    selected ? 'bg-white shadow' : 'text-blue-300 hover:bg-white/[0.12] hover:text-white'
                  )
                }
              >
                {tab}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels>
            <Tab.Panel>
              {buyOrders.length === 0 && sellOrders.length === 0 ? (
                renderNoDataContent()
              ) : (
                <div className="flex flex-wrap">
                  <div className="w-1/2">
                    <OrderSection
                      title="Sell"
                      data={transformOrderData(sellOrders)}
                      currentPage={currentSellPage}
                      onPageChange={setCurrentSellPage}
                    />
                  </div>
                  <div className="w-1/2">
                    <OrderSection
                      title="Buy"
                      data={transformOrderData(buyOrders)}
                      currentPage={currentBuyPage}
                      onPageChange={setCurrentBuyPage}
                    />
                  </div>
                </div>
              )}
            </Tab.Panel>
            <Tab.Panel>
              {liveBuyOrders.length === 0 && liveSellOrders.length === 0 ? (
                renderNoDataContent()
              ) : (
                <div className="flex flex-wrap">
                  <div className="w-1/2">
                    <OrderSection
                      title="Sell"
                      data={transformOrderData(liveSellOrders)}
                      currentPage={currentSellPage}
                      onPageChange={setCurrentSellPage}
                    />
                  </div>
                  <div className="w-1/2">
                    <OrderSection
                      title="Buy"
                      data={transformOrderData(liveBuyOrders)}
                      currentPage={currentBuyPage}
                      onPageChange={setCurrentBuyPage}
                    />
                  </div>
                </div>
              )}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
      <div className="w-1/3 pl-4 flex items-center justify-center mt-4 lg:mt-0">
        <ExchangeInterface />
      </div>
    </div>
  );
}

export default Trade;
