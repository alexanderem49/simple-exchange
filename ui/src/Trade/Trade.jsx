import { Tab } from '@headlessui/react';
import ExchangeInterface from './ExchangeInterface';
import { useEffect, useState } from 'react';
import { extractOrderDetail } from '../utils/helpers.jsx';
import { useStore } from '../store/store.js';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function Trade() {
  const buyOrders = useStore((state) => state.buyOrders);
  const sellOrders = useStore((state) => state.sellOrders);
  const getDisplayInfo = useStore((state) => state.getDisplayInfo);

  const liveBuyOrders = useStore((state) => state.liveBuyOrders);
  const liveSellOrders = useStore((state) => state.liveSellOrders);

  const transformOrderData = (orders) =>
    orders.map((order) => ({
      give: extractOrderDetail(order.give, getDisplayInfo),
      want: extractOrderDetail(order.want, getDisplayInfo)
    }));

  const OrderSection = ({ title, data }) => (
    <div className="flex flex-col w-1/2 space-y-4">
      <h2 className="text-lg font-bold mt-4 px-1">{title}</h2>
      {data && data.length > 0 ? (
        <div className="overflow-x-auto bg-white rounded-lg shadow overflow-y-auto relative">
          {renderTableContent(data)}
        </div>
      ) : (
        renderNoDataContent()
      )}
    </div>
  );

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
                <div className="flex flex-wrap ">
                  <OrderSection title="Sell" data={transformOrderData(sellOrders)} />
                  <OrderSection title="Buy" data={transformOrderData(buyOrders)} />
                </div>
              )}
            </Tab.Panel>
            <Tab.Panel>
              {liveBuyOrders.length === 0 && liveSellOrders.length === 0 ? (
                renderNoDataContent()
              ) : (
                <div className="flex flex-wrap">
                  <OrderSection title="Sell" data={transformOrderData(liveSellOrders)} className="mr-8" />
                  <OrderSection title="Buy" data={transformOrderData(liveBuyOrders)} />
                </div>
              )}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
      <div className="w-1/3 pl-4 flex items-center justify-center mt-4">
        <ExchangeInterface />
      </div>
    </div>
  );
}

export default Trade;
