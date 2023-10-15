import { useState } from 'react';
import { UserCircleIcon } from '@heroicons/react/24/outline';

function NavBar() {
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useState(null);

    const handleConnect = async () => {

        setIsLoading(true);
        // TODO: implement the logic to connect the user
        // INFO: Mocking an API call to get the user info upon connecting
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setIsConnected(true);
        setUser({
            name: 'JohnDoegdfgdfgdfgdfgdfgdfgdfgdfgdfg',
            image: 'https://i.pravatar.cc/300',
        });

        setIsLoading(false);
    };

    const handleDisconnect = () => {
        setIsConnected(false);
        setUser(null);
    };

    return (
        <header className="bg-gray-800 text-white py-4 px-6">
            <nav className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="flex items-center">
                    <img src="/Agoric-logo-white.png" alt="Agoric Logo" className="h-8 mr-2" />
                    <span className="text-2xl font-bold">Agoric</span>
                </div>

                <div className="flex items-center space-x-8">
                    <a href="#trade" className="hover:text-gray-400">
                        Trade
                    </a>
                    <a href="#about" className="hover:text-gray-400">
                        About
                    </a>
                    <a href="#contact-us" className="hover:text-gray-400">
                        Contact Us
                    </a>
                </div>

                <div className="flex items-center space-x-6">
                    {isLoading ? (
                        <span>Loading...</span>
                    ) : isConnected && user ? (
                        <>
                            <img src={user.image} alt={user.name} className="h-8 w-8 rounded-full" />
                            <span style={{ maxWidth: '150px' }} className="self-center text-white mr-4 max-w-xs overflow-hidden whitespace-nowrap overflow-ellipsis">{user.name}</span>
                        </>
                    ) : (
                        <UserCircleIcon className="h-8 w-8 text-white mr-4" aria-hidden="true" />
                    )}

                    <button
                        onClick={isConnected ? handleDisconnect : handleConnect}
                        className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md text-white focus:outline-none min-w-125"
                    >
                        {isConnected ? 'Disconnect' : 'Connect'}
                    </button>
                </div>
            </nav>
        </header>
    );
}

export default NavBar;
