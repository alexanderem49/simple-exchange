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

CONTRACT_REF_BUNDLE_ID = @cache/b1-2650f4c0249bec056ff83866ab0d5aae340e29781ef5544941c1e7f1586b1bbf57c791022ff3c9d9be0d88a9b0dc9884d3fc8fa209c505d085a1117596f52e54.json
MANIFEST_REF_BUNDLE_ID = @cache/b1-60fe5d5e379113b78f3cfd5a00ff13a25d36e5c6e63c9fecaf9d586f834d8d6d53259bfe499876e3b8fc84d85e02da7e345bf6344868bb2135a69a2d81c70509.json

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

submit-core-eval: install-contract-bundle install-manifest-bundle submit-proposal vote