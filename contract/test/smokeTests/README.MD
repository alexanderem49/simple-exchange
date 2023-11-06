# Guide to run the smoke tests

## Prerequisites

- agoric-sdk
  - commit: `92b6cd72484079b0349d8ccfa4510aeb820e8d67`
  - version: `0.21.2-u11.0`

## Launch local chain and client

> % cd agoric-sdk/packages/inter-protocol/scripts  
> % ./start-local-chain.sh

> % cd agoric-sdk/packages/cosmic-swingset  
> % make SOLO_COINS='13000000ubld,12345000000000uist,1122000000ibc/toyusdc' scenario2-run-client

## Submit core-eval

> % cd simple-exchange/  
> % make bundle-contract

Note: your terminal will print a message similar to the one bellow, make sure to copy the bundle IDs (`b1-265...e54.json` and `b1-60f...509.json`) and update the Makefile variables `CONTRACT_REF_BUNDLE_ID` and `MANIFEST_REF_BUNDLE_ID` respectively.

```
jorgelopes@Jorges-MBP my-simple-exchange % make build-proposal
rm -rf /Users/jorgelopes/Documents/GitHub/Agoric/bytepitch-bounties/my-simple-exchange/cache/*
/Users/jorgelopes/Documents/GitHub/Agoric/agoric-sdk/packages/agoric-cli/bin/agoric run /Users/jorgelopes/Documents/GitHub/Agoric/bytepitch-bounties/my-simple-exchange/contract/src/proposal/proposalBuilder-script.js
agoric: run: running /Users/jorgelopes/Documents/GitHub/Agoric/bytepitch-bounties/my-simple-exchange/contract/src/proposal/proposalBuilder-script.js
agoric: run: Deploy script will run with Node.js ESM
creating startSimpleExchange-permit.json
creating startSimpleExchange.js
You can now run a governance submission command like:
  agd tx gov submit-proposal swingset-core-eval startSimpleExchange-permit.json startSimpleExchange.js \
    --title="Enable <something>" --description="Evaluate startSimpleExchange.js" --deposit=1000000ubld \
    --gas=auto --gas-adjustment=1.2
Remember to install bundles before submitting the proposal:
  agd tx swingset install-bundle @/Users/jorgelopes/Documents/GitHub/Agoric/bytepitch-bounties/my-simple-exchange/cache/b1-2650f4c0249bec056ff83866ab0d5aae340e29781ef5544941c1e7f1586b1bbf57c791022ff3c9d9be0d88a9b0dc9884d3fc8fa209c505d085a1117596f52e54.json
  agd tx swingset install-bundle @/Users/jorgelopes/Documents/GitHub/Agoric/bytepitch-bounties/my-simple-exchange/cache/b1-60fe5d5e379113b78f3cfd5a00ff13a25d36e5c6e63c9fecaf9d586f834d8d6d53259bfe499876e3b8fc84d85e02da7e345bf6344868bb2135a69a2d81c70509.json
```

> % make submit-core-eval

## Run smoke tests

> % cd simple-exchange/contract/test/smokeTests/  
> % agoric deploy updateAssetList  
> % agoric deploy updateReferenceList

> % ./sellOffer  
> % ./buyOffer

## Verify order book

1. Agoric Wallet REPL

   - get instance from agoricNames
   - get publicFacet
   - get subscriber
   - get updated state

2. Storage Viewer
   - load published children keys
   - load simpleExchange data
