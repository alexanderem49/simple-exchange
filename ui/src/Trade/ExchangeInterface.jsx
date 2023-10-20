import { useEffect, useState } from 'react';
import { parseAsAmount, stringifyValue } from '@agoric/ui-components';
import { useStore } from '../store/store.js';
import { XCircleIcon } from '@heroicons/react/24/outline/index.js';

export default function ExchangeInterface() {
  const [inputValue, setInputValue] = useState('');
  const [outputValue, setOutputValue] = useState('');
  const [firstLabel, setFirstLabel] = useState('Asset:');
  const [secondLabel, setSecondLabel] = useState('Price:');
  const [firstValue, setFirstValue] = useState('uist');
  const [secondValue, setSecondValue] = useState('ubld');
  const [isOpen, setIsOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  const vbankAssets = useStore((state) => state.vbankAssets);

  const closeNotification = () => {
    setShowNotification(false);
  };

  useEffect(() => {
    if (vbankAssets.length > 0) {
      console.log('vbankAssets in Exchange:', vbankAssets);
    }
  }, [vbankAssets]);

  const getDisplayInfo = useStore((state) => state.getDisplayInfo);

  const parseUserInput = (brand, str) => {
    const displayInfo = getDisplayInfo(brand);

    if (!displayInfo) return str;

    const { assetKind, decimalPlaces } = displayInfo;
    console.log('displayInfo: ', displayInfo);
    return parseAsAmount(str, brand, assetKind, decimalPlaces).value;
  };

  const handleInputChange = (ev, setFieldValue) => {
    let value = ev.target.value;

    const formattedValue = value.replace(/[^0-9.]/g, '').replace(/(\..*?)\./g, '$1');

    setFieldValue(formattedValue);
  };

  const handleExchange = () => {
    const parsedInput = parseUserInput(firstValue, inputValue);
    const parsedOutput = parseUserInput(secondValue, outputValue);

    console.log('Parsed Input:', parsedInput);
    console.log('Parsed Output:', parsedOutput);

    if (!parsedInput || !parsedOutput) {
      console.log('Both fields are required');
      return;
    }

    // Implement the logic for making the order with parsedInput and parsedOutput
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const getFormattedInputValue = (brand, rawValue) => {
    const displayInfo = getDisplayInfo(brand);

    if (!displayInfo || !rawValue) return rawValue;

    const { assetKind, decimalPlaces } = displayInfo;
    const parsedValue = parseAsAmount(rawValue, brand, assetKind, decimalPlaces).value;
    console.log('parsedValue: ', parsedValue);

    return stringifyValue(parsedValue, assetKind, decimalPlaces);
  };

  const handleArrowClick = () => {
    setIsOpen(!isOpen);
    const tempLabel = firstLabel;
    const tempValue = firstValue;
    const tempInputValue = inputValue;
    setFirstLabel(secondLabel);
    setSecondLabel(tempLabel);
    setFirstValue(secondValue);
    setSecondValue(tempValue);
    setInputValue(outputValue);
    setOutputValue(tempInputValue);
  };

  return (
    <div className="p-6 bg-white rounded shadow-lg flex flex-col items-center space-y-4 w-80">
      <div className="flex items-center w-full space-x-2">
        <input
          type="text"
          value={getFormattedInputValue(firstValue, inputValue)}
          onChange={(e) => handleInputChange(e, setInputValue)}
          className="p-2 w-3/5 border border-gray-300 rounded"
          placeholder="0.00"
        />
        <span className="text-sm text-gray-600">
          {firstLabel} {firstValue}
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
          value={getFormattedInputValue(secondValue, outputValue)}
          onChange={(e) => handleInputChange(e, setOutputValue)}
          className="p-2 w-3/5 border border-gray-300 rounded"
          placeholder="0.00"
        />
        <span className="text-sm text-gray-600">
          {secondLabel} {secondValue}
        </span>
      </div>
      <button onClick={handleExchange} className="px-5 py-2 bg-green-500 text-white rounded">
        Make Order
      </button>
      {showNotification && (
        <div className="fixed bottom-3.5 left-3 mb-20 ml-6 p-2 bg-green-500 text-white rounded shadow-lg flex items-center space-x-2 transition-all duration-400 ease-in-out">
          <span>Order Accepted</span>
          <button
            onClick={closeNotification}
            className="p-1 rounded hover:bg-green-600 transition-colors duration-300 ease-in-out"
          >
            <XCircleIcon className="h-5 w-5 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}
