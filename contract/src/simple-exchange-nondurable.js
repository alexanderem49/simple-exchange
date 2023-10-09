import { AmountShape } from '@agoric/ertp';
import { makeNotifierKit } from '@agoric/notifier';
import { M } from '@agoric/store';
import '@agoric/zoe/exported.js';
import { assertIssuerKeywords, swap } from '@agoric/zoe/src/contractSupport';

// Test script
// 1: Alice creates a simpleExchange instance and spreads the publicFacet far
// and wide with instructions on how to call makeInvitation().

// 2: Alice escrows with zoe to create a sell order. She wants to
// sell 3 moola and wants to receive at least 4 simoleans in
// return.

// 4: Alice adds her sell order to the exchange

// 5: Bob decides to join.

// Bob creates a buy order, saying that he wants exactly 3 moola,
// and is willing to pay up to 7 simoleans.

// 6: Bob escrows with zoe
// 8: Bob submits the buy order to the exchange

// Alice gets paid at least what she wanted

// 6: Alice deposits her payout to ensure she can
// Alice had 0 moola and 4 simoleans.

// 7: Bob deposits his original payments to ensure he can
// Bob had 3 moola and 3 simoleans.

/**
 * @type {ContractStartFn}
 * @param {ZCF} zcf
 */
const start = zcf => {
    const { notifier, updater } = makeNotifierKit();

    const sellSeats = [];
    const buySeats = [];

    const getBookOrders = () => {
        return {
            buys: buySeats.map(seat => seat.getProposal()),
            sells: sellSeats.map(seat => seat.getProposal()),
        }
    }

    const bookOrdersChanged = () => {
        updater.updateState(getBookOrders());
    }

    const exchangeOfferHandler = seat => {
        const { give, want } = seat.getProposal();
        const { Asset: asset, Price: price } = give;
        const { Asset: assetWanted, Price: priceWanted } = want;

        // Check that the keywords are correct
        assertIssuerKeywords(zcf, harden(['Asset', 'Price']));

        // Check that the proposal shape is correct

        //
        // TODO: Use atomicRearrange to check that the proposal shape is correct
        //
        // Is this correct?
        zcf.atomicRearrange(
            harden([price, asset]),
            harden([priceWanted, assetWanted]),
        )

        // // Check that the offer is satisfiable
        // swap(zcf, { seat, gains: { Asset: assetWanted }, losses: { Price: priceWanted } });

        // // Check that the offer is satisfiable
        // swap(zcf, { seat, gains: { Price: price }, losses: { Asset: asset } });

        // Add the seat to the appropriate list
        if (assetWanted === 'Asset') {
            sellSeats.push(seat);
        } else {
            buySeats.push(seat);
        }

        // Tell the notifier that there has been a change to the book orders
        bookOrdersChanged();

        // Make the seat available to the other side
        return seat;
    }

    const makeExchangeInvitation = () =>
        zcf.makeInvitation(exchangeOfferHandler, 'exchange', undefined, M.splitRecord(
            {
                give: { Asset: AmountShape },
                want: { Price: AmountShape }
            }
        ));

    const creatorFacet = Far('creatorFacet', {

    });

    const publicFacet = Far('publicFacet', {
        makeInvitation: makeExchangeInvitation,
        getNotifier: () => notifier,
    });

    return harden({ creatorFacet, publicFacet });
}

harden(start)
export { start };