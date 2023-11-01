#!/bin/zsh

OFFER=$(mktemp -t agops.XXX)
node ./buildBuyOffer.js >|"$OFFER"
cat $OFFER
agoric wallet send --from gov2 --keyring-backend=test --offer=$OFFER