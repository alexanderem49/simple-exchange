import { AmountMath } from '@agoric/ertp';

export const makeSimpleExchangeHelpers = () => {
  const makeSellOffer = (assets, moolaValue, simoleansValue) => {
    const moolaAmount = AmountMath.make(assets.moolaKit.brand, moolaValue);
    const simoleanAmount = AmountMath.make(
      assets.simoleanKit.brand,
      simoleansValue,
    );

    const sellOrderProposal = harden({
      give: { Asset: moolaAmount },
      want: { Price: simoleanAmount },
    });

    const moolaPayment = assets.moolaKit.mint.mintPayment(moolaAmount);
    const sellPayment = { Asset: moolaPayment };

    return harden({ sellOrderProposal, sellPayment });
  };

  const makeBuyOffer = (assets, moolaValue, simoleansValue) => {
    const moolaAmount = AmountMath.make(assets.moolaKit.brand, moolaValue);
    const simoleanAmount = AmountMath.make(
      assets.simoleanKit.brand,
      simoleansValue,
    );

    const buyOrderProposal = harden({
      give: { Price: simoleanAmount },
      want: { Asset: moolaAmount },
    });

    const simoleanPayment = assets.simoleanKit.mint.mintPayment(simoleanAmount);
    const buyPayment = { Price: simoleanPayment };

    return harden({ buyOrderProposal, buyPayment });
  };

  return harden({ makeSellOffer, makeBuyOffer });
};
