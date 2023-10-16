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
      exit: { onDemand: null },
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
      exit: { onDemand: null },
    });

    const simoleanPayment = assets.simoleanKit.mint.mintPayment(simoleanAmount);
    const buyPayment = { Price: simoleanPayment };

    return harden({ buyOrderProposal, buyPayment });
  };

  const makeInvalidOffer = (
    assets,
    moolaValue,
    simoleanValue,
    invalidOfferType,
  ) => {
    const wrongIssuer = (want) => {
      const moolaAmount = AmountMath.make(assets.moolaKit.brand, moolaValue);
      const simoleanAmount = AmountMath.make(
        assets.simoleanKit.brand,
        simoleanValue,
      );
      const nothingAmount = AmountMath.make(
        assets.nothingKit.brand,
        simoleanValue,
      );

      const expectedError =
        'key "[Alleged: Nothing brand]" not found in collection "brandToIssuerRecord"';

      if (want) {
        const sellOrderProposal = harden({
          give: { Asset: moolaAmount },
          want: { Price: nothingAmount },
        });

        const moolaPayment = assets.moolaKit.mint.mintPayment(moolaAmount);
        const sellPayment = { Asset: moolaPayment };

        return harden({ sellOrderProposal, sellPayment, expectedError });
      } else {
        const sellOrderProposal = harden({
          give: { Asset: nothingAmount },
          want: { Price: simoleanAmount },
        });

        const nothingPayment =
          assets.nothingKit.mint.mintPayment(nothingAmount);
        const sellPayment = { Asset: nothingPayment };

        return harden({ sellOrderProposal, sellPayment, expectedError });
      }
    };

    const missingWantOrGive = (want) => {
      const moolaAmount = AmountMath.make(assets.moolaKit.brand, moolaValue);
      const simoleanAmount = AmountMath.make(
        assets.simoleanKit.brand,
        simoleanValue,
      );

      const sellOrderProposal = want
        ? harden({
            give: { Asset: moolaAmount },
          })
        : harden({
            want: { Price: simoleanAmount },
          });

      const moolaPayment = assets.moolaKit.mint.mintPayment(moolaAmount);
      const sellPayment = { Asset: moolaPayment };

      const expectedError = want
        ? '"exchange" proposal: want: {} - Must match one of [{"Asset":{"brand":"[match:remotable]","value":"[match:or]"}},{"Price":{"brand":"[match:remotable]","value":"[match:or]"}}]'
        : '"exchange" proposal: give: {} - Must match one of [{"Asset":{"brand":"[match:remotable]","value":"[match:or]"}},{"Price":{"brand":"[match:remotable]","value":"[match:or]"}}]';

      return harden({ sellOrderProposal, sellPayment, expectedError });
    };

    const invalidShapes = () => {
      const moolaAmount = AmountMath.make(assets.moolaKit.brand, moolaValue);
      const simoleanAmount = AmountMath.make(
        assets.simoleanKit.brand,
        simoleanValue,
      );

      const invalidShapes = [
        {
          proposal: harden({
            give: null,
            want: { Asset: simoleanAmount },
          }),
          errorMessage:
            'In "offer" method of (ZoeService): arg 1?: give?: null null - Must be a copyRecord',
        },
        {
          proposal: harden({
            give: {},
            want: { Asset: simoleanAmount },
          }),
          errorMessage:
            '"exchange" proposal: give: {} - Must match one of [{"Asset":{"brand":"[match:remotable]","value":"[match:or]"}},{"Price":{"brand":"[match:remotable]","value":"[match:or]"}}]',
        },
        {
          proposal: harden({
            give: undefined,
            want: { Asset: simoleanAmount },
          }),
          errorMessage:
            '"exchange" proposal: give: {} - Must match one of [{"Asset":{"brand":"[match:remotable]","value":"[match:or]"}},{"Price":{"brand":"[match:remotable]","value":"[match:or]"}}]',
        },
        {
          proposal: harden({
            give: { Price: null },
            want: { Asset: simoleanAmount },
          }),
          errorMessage:
            'In "offer" method of (ZoeService): arg 1?: give?: Price: [1]: null - Must be a copyRecord to match a copyRecord pattern: {"brand":"[match:remotable]","value":"[match:or]"}',
        },
        {
          proposal: harden({
            give: { Price: undefined },
            want: { Asset: simoleanAmount },
          }),
          errorMessage:
            'In "offer" method of (ZoeService): arg 1?: give?: Price: [1]: "[undefined]" - Must be a copyRecord to match a copyRecord pattern: {"brand":"[match:remotable]","value":"[match:or]"}',
        },
        {
          proposal: harden({
            give: { Price: {} },
            want: { Asset: simoleanAmount },
          }),
          errorMessage:
            'In "offer" method of (ZoeService): arg 1?: give?: Price: [1]: {} - Must have missing properties ["value","brand"]',
        },
        ///////////
        {
          proposal: harden({
            give: { Asset: moolaAmount },
            want: null,
          }),
          errorMessage:
            'In "offer" method of (ZoeService): arg 1?: want?: null null - Must be a copyRecord',
        },
        {
          proposal: harden({
            give: { Asset: moolaAmount },
            want: {},
          }),
          errorMessage:
            '"exchange" proposal: want: {} - Must match one of [{"Asset":{"brand":"[match:remotable]","value":"[match:or]"}},{"Price":{"brand":"[match:remotable]","value":"[match:or]"}}]',
        },
        {
          proposal: harden({
            give: { Asset: moolaAmount },
            want: undefined,
          }),
          errorMessage:
            '"exchange" proposal: want: {} - Must match one of [{"Asset":{"brand":"[match:remotable]","value":"[match:or]"}},{"Price":{"brand":"[match:remotable]","value":"[match:or]"}}]',
        },
        {
          proposal: harden({
            give: { Asset: moolaAmount },
            want: { Price: null },
          }),
          errorMessage: "Cannot read properties of null (reading 'brand')",
        },
        {
          proposal: harden({
            give: { Asset: moolaAmount },
            want: { Price: undefined },
          }),
          errorMessage: "Cannot read properties of undefined (reading 'brand')",
        },
        {
          proposal: harden({
            give: { Asset: moolaAmount },
            want: { Price: {} },
          }),
          errorMessage:
            'In "getAssetKindByBrand" method of (ZoeStorageManager makeOfferAccess): arg 0: undefined "[undefined]" - Must be a remotable (Brand)',
        },
      ];

      return invalidShapes.map(({ proposal, errorMessage }) => {
        const moolaPayment = assets.moolaKit.mint.mintPayment(moolaAmount);
        const sellPayment = { Asset: moolaPayment };

        return harden({
          sellOrderProposal: proposal,
          sellPayment,
          expectedError: errorMessage,
        });
      });
    };

    switch (invalidOfferType) {
      case 'wrongWantIssuer':
        return wrongIssuer(true);

      case 'wrongGiveIssuer':
        return wrongIssuer(false);

      case 'missingWant':
        return missingWantOrGive(true);

      case 'missingGive':
        return missingWantOrGive(false);

      case 'invalidShapes':
        return invalidShapes();

      default:
        throw new Error(`Unknown invalid offer type: ${invalidOfferType}`);
    }
  };

  return harden({ makeSellOffer, makeInvalidOffer, makeBuyOffer });
};
