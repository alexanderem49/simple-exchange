import { makeHelpers } from '@agoric/deploy-script-support';
import { getManifestForInitSimpleExchange } from './simpleExchange-proposal.js';

export const defaultProposalBuilder = async ({ publishRef, install }) => {
  return harden({
    sourceSpec: './simpleExchange-proposal.js',
    getManifestCall: [
        getManifestForInitSimpleExchange.name,
      {
        contractRef: publishRef(install('../upgradableSimpleExchange.js')),
      },
    ],
  });
};

export default async (homeP, endowments) => {
  const { writeCoreProposal } = await makeHelpers(homeP, endowments);
  await writeCoreProposal('startSimpleExchange', defaultProposalBuilder);
};
