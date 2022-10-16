
# mcredible

silly p2p crypto currency experiment.

## prototype

This is a p2p system of digitally signed "coins" that are just javascript objects containing cryptographic public keys and a signature. Each coin can only have one owner and one previous owner. The current owner can sign the ownership over to a different peer and propagate this change to the rest of the p2p network.

In this system each peer has to validate the signature before replicating the change for the chain of trust idea to work. It only relies on digital signatures and the fact that only the secret key holder can sign over its coin to a different peer. It relies on gossip and eventually consistent data replication for the system to agree who owns which coin.

I still haven't proven that it would be possible for a smart contract to mint and redeem it into a different crypto currency like ethereum. I think that a minting service could easily take credit cards and hold it in escrow until coins are redeemed back etc
