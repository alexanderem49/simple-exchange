SDK_ROOT = $(shell cd ../../agoric-sdk >/dev/null && pwd)
AGORIC = $(SDK_ROOT)/packages/agoric-cli/bin/agoric
AGD = $(SDK_ROOT)/bin/agd
LOCAL_CHAIN_ID = agoriclocal
DEV_CHAIN_ID = agoricdev-23

GAS = 400000
GAS_ADJUSTMENT = 1.2

AG_SOLO_ADDR = \"$(shell $(AGCH) keys show -a ag-solo --home $(SDK_ROOT)/packages/cosmic-swingset/t1/8000/ag-cosmos-helper-statedir/ --keyring-backend=test)\"
GOV_1_ADDR = $(shell $(AGCH) keys show -a gov1 --keyring-backend=test)
GOV_2_ADDR = $(shell $(AGCH) keys show -a gov2 --keyring-backend=test)
BECH_HOME = $(SDK_ROOT)/packages/cosmic-swingset/t1/bootstrap
FROM = bootstrap

BUNDLE_ID_1 = ''
BUNDLE_ID_2 = ''


VOTE_PROPOSAL = 1
VOTE_OPTION = yes

install-bundle-1:
	${AGD} tx swingset install-bundle ${BUNDLE_ID_1} --from=${FROM} --home=${BECH_HOME}  --chain-id=${LOCAL_CHAIN_ID} --keyring-backend=test --gas=$(GAS)

install-bundle-2:
	${AGD} tx swingset install-bundle ${BUNDLE_ID_2} --from=${FROM} --home=${BECH_HOME}  --chain-id=${LOCAL_CHAIN_ID} --keyring-backend=test --gas=$(GAS)

submit-proposal:
	${AGD} tx gov submit-proposal swingset-core-eval startSimpleExchange-permit.json startSimpleExchange.js \
 	--title="Enable simpleExchange" --description="Evaluate startSimpleExchange.js" --deposit=1000000ubld \
    --gas=auto --gas-adjustment=$(GAS_ADJUSTMENT) \
	--from=${FROM} --home=${BECH_HOME}  --chain-id=${LOCAL_CHAIN_ID} --keyring-backend=test

vote:
	$(AGCH)  tx gov vote $(VOTE_PROPOSAL) $(VOTE_OPTION) \
		--gas=auto --gas-adjustment=$(GAS_ADJUSTMENT) \
		--from=${FROM} --home=${BECH_HOME}  --chain-id=${LOCAL_CHAIN_ID} --keyring-backend=test
