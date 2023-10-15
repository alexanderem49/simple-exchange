import { useState } from 'react';

export default function ExchangeInterface() {
    const [inputValue, setInputValue] = useState('');
    const [outputValue, setOutputValue] = useState('');

    const handleExchange = () => {
        // TODO: Handling the exchange logic here
    };

    const handleArrowClick = () => {
        console.log("Arrow clicked");
        // TODO: Need to put logic for arrow click here
    };

    return (
        <div className="flex flex-col items-center">
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="mb-3 p-2 border border-gray-300 rounded"
            />
            <div className="flex items-center mb-3">
                <button onClick={handleArrowClick} className="p-1 rounded-full bg-transparent border border-gray-300 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                    </svg>
                </button>
            </div>
            <input
                type="text"
                value={outputValue}
                onChange={(e) => setOutputValue(e.target.value)}
                className="mb-6 p-2 border border-gray-300 rounded"
            />
            <button onClick={handleExchange} className="px-5 py-2 bg-green-500 text-white rounded">
                Make Order
            </button>
        </div>
    );
}
