import '@endo/init';
import { AmountMath } from '@agoric/ertp';
import { makeSmokeTestMarshaller } from './smokeTestMarshaller.js';

const main = () => {
  const sellIndex = process.env.SELL_INDEX || 0;
  const offerId = `makeSellOffer${sellIndex}`
  
  const {
    serialize,
    assets: { instance, agoricNamesAssets },
  } = makeSmokeTestMarshaller();

  const assetAmount = AmountMath.make(agoricNamesAssets.BLD.brand, harden(2n));
  const priceAmount = AmountMath.make(agoricNamesAssets.IST.brand, harden(5n));

  const spendAction = {
    method: 'executeOffer',
    offer: {
      id: offerId,
      invitationSpec: {
        source: 'contract',
        instance,
        publicInvitationMaker: 'makeInvitation',
      },
      proposal: {
        give: { Asset: assetAmount },
        want: { Price: priceAmount },
      },
    },
  };

  process.stdout.write(JSON.stringify(serialize(harden(spendAction))));
  process.stdout.write('\n');
};

main();
