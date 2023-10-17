import { useState } from 'react';
// TODO: Uncomment after installing @agoric/ui-kit
// import { parseAsAmount, stringifyValue } from '@agoric/ui-kit';
import { useStore } from '../store/store.js';

// TODO: Placeholder for parseAsAmount - remove this after installing @agoric/ui-kit
const parseAsAmount = (str, brand, assetKind, decimalPlaces) => {
  // Placeholder implementation
  return { brand, value: str };
};

// TODO: Placeholder for stringifyValue - remove this after installing @agoric/ui-kit
const stringifyValue = (value, assetKind, decimalPlaces) => {
  // Placeholder implementation
  return value.toString();
};

export default function ExchangeInterface() {
  const [inputValue, setInputValue] = useState('');
  const [outputValue, setOutputValue] = useState('');
  const [firstLabel, setFirstLabel] = useState('Asset:');
  const [secondLabel, setSecondLabel] = useState('Price:');
  const [firstValue, setFirstValue] = useState('ATOM');
  const [secondValue, setSecondValue] = useState('IST');
  const [isOpen, setIsOpen] = useState(false);

  const getDisplayInfo = useStore((state) => state.getDisplayInfo);

  const parseUserInput = (brand, ev) => {
    const { getDisplayInfo } = useStore.getState();
    const displayInfo = getDisplayInfo(brand);

    // TODO: Handle this case appropriately
    if (!displayInfo) return;

    const { assetKind, decimalPlaces } = displayInfo;
    const str = ev.target.value.replace('-', '').replace('e', '').replace('E', '');

    const parsed = parseAsAmount(str, brand, assetKind, decimalPlaces);
    // TODO: Adjust as needed
    return parsed.value;
  };

  const displayAmount = (amount) => {
    // TODO: Adjust this line as needed
    const { brand, value } = amount;
    const displayInfo = getDisplayInfo(brand);

    if (!displayInfo) return '';

    const { assetKind, decimalPlaces } = displayInfo;
    return stringifyValue(value, assetKind, decimalPlaces);
  };

  const handleInputChange = (ev) => {
    // Assuming firstValue is a brand
    const parsedValue = parseUserInput(firstValue, ev);
    // TODO: Adjust this line as needed
    setInputValue(parsedValue);
  };

  const handleOutputChange = (ev) => {
    // Assuming secondValue is a brand
    const parsedValue = parseUserInput(secondValue, ev);
    // TODO: Adjust this line as needed
    setOutputValue(parsedValue);
  };

  const handleExchange = () => {
    // TODO: Handling the exchange logic here
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
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="p-2 w-3/5 border border-gray-300 rounded"
          placeholder={firstLabel.includes('Asset:') ? firstValue : '0.00'}
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
          value={outputValue}
          onChange={(e) => setOutputValue(e.target.value)}
          className="p-2 w-3/5 border border-gray-300 rounded"
          placeholder={secondLabel.includes('Asset:') ? secondValue : '0.00'}
        />
        <span className="text-sm text-gray-600">
          {secondLabel} {secondValue}
        </span>
      </div>
      <button onClick={handleExchange} className="px-5 py-2 bg-green-500 text-white rounded">
        Make Order
      </button>
    </div>
  );
}
