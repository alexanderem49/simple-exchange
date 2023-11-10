import { useStore } from '../store/store.js';

const createOffer = (type, priceAmount, assetAmount) => {
  const { wallet } = useStore.getState();

  if (!wallet) {
    throw new Error('Wallet is not connected');
  }

  const isBuy = type === 'buy';

  return harden({
    id: `${isBuy ? 'buy' : 'sell'}-order-${wallet.address}-${Date.now()}`,
    invitationSpec: {
      source: 'agoricContract',
      instancePath: ['simpleExchangeInstance'],
      callPipe: [['makeInvitation']]
    },
    proposal: {
      give: {
        [isBuy ? 'Price' : 'Asset']: isBuy ? priceAmount : assetAmount
      },
      want: {
        [isBuy ? 'Asset' : 'Price']: isBuy ? assetAmount : priceAmount
      }
    }
  });
};

export const buyOffer = (priceAmount, assetAmount) => {
  return createOffer('buy', priceAmount, assetAmount);
};

export const sellOffer = (priceAmount, assetAmount) => {
  return createOffer('sell', priceAmount, assetAmount);
};
harden(buyOffer);
harden(sellOffer);

export const makeGenericOnStatusUpdate = (snackBarUpdater) => {
  const onStatusChange = (args) => {
    console.log('args: ', { args });
    const { status, data } = args;

    if (status === 'error') {
      snackBarUpdater('error', 'Offer with error');
      console.log('ERROR', data);
    }
    if (status === 'seated') {
      snackBarUpdater('info', 'Transaction submitted');
      console.log('Transaction:', data.txn);
      console.log('Offer id:', data.offerId);
    }
    if (status === 'refunded') {
      snackBarUpdater('warning', 'Transaction refunded');
      console.log('Transaction:', data.txn);
      console.log('Offer id:', data.offerId);
    }
    if (status === 'accepted') {
      snackBarUpdater('success', 'Offer accepted');
      console.log('Transaction:', data.txn);
      console.log('Offer id:', data.offerId);
    }
  };

  return harden({
    onStatusChange
  });
};
harden(makeGenericOnStatusUpdate);
