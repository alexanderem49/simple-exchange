SDK_ROOT = $(shell cd ../../agoric-sdk >/dev/null && pwd)
AGORIC = $(SDK_ROOT)/packages/agoric-cli/bin/agoric
AGD = $(SDK_ROOT)/bin/agd
LOCAL_CHAIN_ID = agoriclocal
DEV_CHAIN_ID = agoricdev-23

GAS = 40000000
GAS_ADJUSTMENT = 1.2
VOTE_PROPOSAL = 1
VOTE_OPTION = yes

PROPOSAL_BUILDER = ${shell pwd}/contract/src/proposal/proposalBuilder-script.js
HOME = $(SDK_ROOT)/packages/cosmic-swingset/t1/bootstrap
FROM = bootstrap

CONTRACT_REF_BUNDLE_ID = @cache/b1-8196beb7c9d93fc869a36c675b8fb64faa422248ccd2a18bdee9974baad9f25fd507376ecf8d2864082faadd7f07a57abb9b258ae26b4f5c209d477197308a54.json
MANIFEST_REF_BUNDLE_ID = @cache/b1-26c2eb70a48ecdb8b0ef659b2b29f772ff5fff34111c87d2adb17ad884328956c2abaf7d493c18d36398028a75be97c300989e0071ff3ee428a4efc9b4c5f553.json


build-proposal:
	rm -rf ${shell pwd}/cache/*
	${AGORIC} run ${PROPOSAL_BUILDER}

install-contract-bundle:
	${AGD} tx swingset install-bundle ${CONTRACT_REF_BUNDLE_ID} \
		--from=${FROM} --home=${HOME}  --chain-id=${LOCAL_CHAIN_ID} --keyring-backend=test --gas=$(GAS) --yes -b block

install-manifest-bundle:
	${AGD} tx swingset install-bundle ${MANIFEST_REF_BUNDLE_ID} \
		--from=${FROM} --home=${HOME}  --chain-id=${LOCAL_CHAIN_ID} --keyring-backend=test --gas=$(GAS) --yes -b block

submit-proposal:
	${AGD} tx gov submit-proposal swingset-core-eval startSimpleExchange-permit.json startSimpleExchange.js \
		--title="Enable simpleExchange" --description="Evaluate startSimpleExchange.js" --deposit=1000000ubld \
		--gas=auto --gas-adjustment=$(GAS_ADJUSTMENT) \
		--from=${FROM} --home=${HOME}  --chain-id=${LOCAL_CHAIN_ID} --keyring-backend=test --yes -b block

vote:
	$(AGD) tx gov vote $(VOTE_PROPOSAL) $(VOTE_OPTION) \
		--gas=auto --gas-adjustment=$(GAS_ADJUSTMENT) \
		--from=${FROM} --home=${HOME}  --chain-id=${LOCAL_CHAIN_ID} --keyring-backend=test --yes -b block

submit-core-eval: build-proposal install-contract-bundle install-manifest-bundle submit-proposal vote