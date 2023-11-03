import { useEffect, useState } from 'react';
import { parseAsAmount, stringifyValue } from '@agoric/ui-components';
import { useStore } from '../store/store.js';
import { buyOffer, makeGenericOnStatusUpdate, sellOffer } from '../utils/makeOrder.js';

export default function ExchangeInterface() {
  const [inputValue, setInputValue] = useState('');
  const [outputValue, setOutputValue] = useState('');
  const [assetLabel, setAssetLabel] = useState('Asset:');
  const [priceLabel, setPriceLabel] = useState('Price:');
  const [assetBrandName, setAssetBrandName] = useState('BLD');
  const [priceBrandName, setPriceBrandName] = useState('IST');
  const [isOpen, setIsOpen] = useState(false);
  const wallet = useStore((state) => state.wallet);
  const notifyUser = useStore((state) => state.notifyUser);
  const assetBrand = useStore((state) => state.assetBrand);
  const priceBrand = useStore((state) => state.assetBrand);
  const getDisplayInfo = useStore((state) => state.getDisplayInfo);
  const isBuyOrder = assetLabel === 'Price:';

  const vbankAssets = useStore((state) => state.vbankAssets);
  const { onStatusChange } = makeGenericOnStatusUpdate(notifyUser);

  useEffect(() => {
    if (vbankAssets.length > 0) {
      console.log('vbankAssets in Exchange:', vbankAssets);
    }
  }, [vbankAssets]);

  const parseUserInput = (brand, str) => {
    const displayInfo = getDisplayInfo(brand);

    if (!displayInfo) return str;

    const { assetKind, decimalPlaces } = displayInfo;

    return parseAsAmount(str, brand, assetKind, decimalPlaces);
  };

  const handleInputChange = (ev, setFieldValue) => {
    let value = ev.target.value;

    const formattedValue = value.replace(/[^0-9.]/g, '').replace(/(\..*?)\./g, '$1');
    setFieldValue(formattedValue);
  };

  const handleExchange = () => {
    const parsedInput = parseUserInput(assetBrand, inputValue);
    const parsedOutput = parseUserInput(priceBrand, outputValue);

    console.log('Parsed Input:', parsedInput);
    console.log('Parsed Output:', parsedOutput);

    if (!parsedInput || !parsedOutput) {
      console.log('Both fields are required');
      return;
    }

    let offerSpec;
    if (isBuyOrder) {
      offerSpec = buyOffer(parsedInput, parsedOutput);
    } else {
      offerSpec = sellOffer(parsedInput, parsedOutput);
    }

    void wallet.makeOffer(
      offerSpec.invitationSpec,
      offerSpec.proposal,
      offerSpec.offerArgs,
      onStatusChange,
      offerSpec.id
    );
  };

  const displayAmount = (amount) => {
    const { brand, value } = amount;
    const { getDisplayInfo } = useStore.getState();
    const displayInfo = getDisplayInfo(brand);

    if (!displayInfo) return '';
    const parsedValue = parseUserInput(brand, value).value;

    const { assetKind, decimalPlaces } = displayInfo;

    return stringifyValue(parsedValue, assetKind, decimalPlaces);
  };

  const handleArrowClick = () => {
    setIsOpen(!isOpen);
    const tempLabel = assetLabel;
    const tempValue = assetBrandName;
    const tempInputValue = inputValue;
    setAssetLabel(priceLabel);
    setPriceLabel(tempLabel);
    setAssetBrandName(priceBrandName);
    setPriceBrandName(tempValue);
    setInputValue(outputValue);
    setOutputValue(tempInputValue);
  };

  return (
    <div className="p-6 bg-white rounded shadow-lg flex flex-col items-center space-y-4 w-80">
      <h1 className="text-xl font-bold text-left w-full">{isBuyOrder ? 'Buy' : 'Sell'}</h1>
      <div className="flex items-center w-full space-x-2">
        <input
          type="text"
          value={displayAmount({ brand: assetBrand, value: inputValue })}
          onChange={(e) => handleInputChange(e, setInputValue)}
          className="p-2 w-3/5 border border-gray-300 rounded"
          placeholder="0.00"
        />
        <span className="text-sm text-gray-600">
          {assetLabel} {assetBrandName}
        </span>
      </div>
      <div className="flex items-center mb-3 justify-center w-full mr-28">
        <button
          onClick={handleArrowClick}
          className="p-1 rounded-full bg-transparent border border-gray-300 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
            />
          </svg>
        </button>
      </div>
      <div className="flex items-center w-full space-x-2">
        <input
          type="text"
          value={displayAmount({ brand: priceBrand, value: outputValue })}
          onChange={(e) => handleInputChange(e, setOutputValue)}
          className="p-2 w-3/5 border border-gray-300 rounded"
          placeholder="0.00"
        />
        <span className="text-sm text-gray-600">
          {priceLabel} {priceBrandName}
        </span>
      </div>
      <button onClick={handleExchange} className="px-5 py-2 bg-green-500 text-white rounded">
        Make Order
      </button>
    </div>
  );
}
