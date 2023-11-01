import { Fragment, useEffect } from 'react';
import { Transition } from '@headlessui/react';
import { useStore } from '../store/store.js';
import { XCircleIcon } from '@heroicons/react/24/outline/index.js';

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
                  <XCircleIcon className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
          </div>
        </Transition.Child>
      </div>
    </Transition>
  );
};
