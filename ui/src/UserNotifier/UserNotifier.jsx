import { Fragment, useEffect } from 'react';
import { Transition } from '@headlessui/react';
import { useStore } from '../store/store.js';

export const CustomizedSnackbars = () => {
  const notifierState = useStore((state) => state.notifierState);
  const closeNotifier = useStore((state) => state.closeNotifier);

  const { open, message, severity } = notifierState;

  const handleClose = () => {
    closeNotifier();
  };

  useEffect(() => {
    if (open) {
      const timeoutId = setTimeout(() => {
        handleClose();
      }, 4000);

      return () => clearTimeout(timeoutId);
    }
  }, [open]);

  const severityStyles = {
    error: 'bg-red-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  };

  if (!open) return null;

  return (
    <Transition show={open} as={Fragment}>
      <div className="fixed inset-0 flex items-end justify-start p-4 pointer-events-none sm:p-6">
        <Transition.Child
          as={Fragment}
          enter="transform ease-out duration-300 transition"
          enterFrom="translate-y-2 opacity-0"
          enterTo="translate-y-0 opacity-100"
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className={`w-full max-w-sm overflow-hidden rounded-lg shadow-md pointer-events-auto ring-1 ring-black ring-opacity-5 ${
              severityStyles[severity] || ''
            }`}
          >
            <div className="p-4">
              <div className="flex items-center">
                <div className="w-0 flex-1 text-sm font-medium text-white">{message}</div>
                <button
                  className="flex items-center justify-center p-2 rounded-md hover:bg-opacity-60 focus:outline-none focus:ring-2 focus:ring-white sm:-ml-2"
                  onClick={handleClose}
                >
                  <span className="sr-only">Close</span>
                  <svg
                    className="w-6 h-6 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.293 9.293a1 1 0 011.414 0L10 11.586l2.293-2.293a1 1 0 011.414 1.414L11.414 13l2.293 2.293a1 1 0 01-1.414 1.414L10 14.414l-2.293 2.293a1 1 0 01-1.414-1.414L8.586 13 6.293 10.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </Transition.Child>
      </div>
    </Transition>
  );
};
