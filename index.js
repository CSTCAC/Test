
var nacl = require('tweetnacl')
var swarm = require('webrtc-swarm')
nacl.util = require('tweetnacl-util')
var Model = require('scuttlebutt/model')
var Emitter = require('scuttlebutt/events')
var signalhub = require('./signalhub/index.js')

var channel = 'zonked11'

var hub = signalhub(channel, [
  'http://localhost:9999'
])
var sw = swarm(hub, {
  wrtc: require('wrtc') // don't need this if used in the browser
})

var _keys = nacl.sign.keyPair()

var db = new Model()
var emitter = new Emitter()

function mintCoins (number, keys) {
  var coins = []
  var inc = 0
  do {
    var timestamp = new Date().toISOString();
    var coin = nacl.util.encodeBase64(nacl.randomBytes(32)) + timestamp + ':mcredible'
    var sig = nacl.util.encodeBase64(nacl.sign.detached(nacl.util.decodeUTF8(coin), keys.secretKey))
    coins.push({
      timestamp: timestamp,
      coin: coin,
      sig: sig
    })
    inc++;
  } while (inc < number)
  return coins
}

function verify (coin, sig, publicKey) {
  var result = nacl.sign.detached.verify(
    nacl.util.decodeUTF8(coin), nacl.util.decodeBase64(sig), publicKey
  );
  return result
}

var coins = mintCoins(5, _keys)

console.log('.... ', verify(coins[0].coin, coins[0].sig, _keys.publicKey))

db.on('update', console.log)


coins.forEach(function (coin) {
  db.set(coin.coin, coin)
})

var publicKey = nacl.util.encodeBase64(_keys.publicKey)

emitter.on('announcement', function () {

  // maintain a list of peers
})

emitter.emit('announcement', {
  node: publicKey,
  peer_id: sw.me,
  timestamp: new Date().toISOString()
})

console.log('public_key ', publicKey)
console.log(sw.me)


// setInterval(function () {
//   emitter.emit('rpc:transaction', {
//     timestamp: new Date().toISOString()
//   })
// }, 3000)

// setInterval(function () {
//   var a = db.get('zonked')
//   console.log(a)
//   if (!a) a = 0
//   a = a + 1
//   b.set('zonked', a)
// }, 5000)

emitter.on('rpc:transaction', function (t) {
  console.log(typeof t, t)

  // listen and act on transaction events
})

sw.on('peer', function (peer, id) {

  peer.pipe(db.createStream()).pipe(peer)
  peer.pipe(emitter.createStream()).pipe(peer)
  peer.on('data', console.log)
  console.log('connected to a new peer:', id)
  console.log('total peers:', sw.peers.length)
})

sw.on('disconnect', function (peer, id) {
  console.log('disconnected from a peer:', id)
  console.log('total peers:', sw.peers.length)
})

/*

announcement

both peers must "announce" themselves to the p2p network
by using RPC and announcing their public key

during the transaction the code can check that both public
keys have been announced and reject transactions from unknown public keys.
..
all peers can run the p2p network node code.

*/


var rpc = {
  hash_of_this_rpc_object: 'xxxxxx',
  timestamp: 'timestamp',
  owner: 'owner_pk',
  coin: 'coin_string',
  signed: 'signature from DHT authority',
  new_owner: 'new_owner_pk',
  signed_owner: 'signature for this transaction',
  signature_new_owner: 'signature for this transation',
  signature_from_authority: 'signature via RPC from authority'
}

/*

RPC executing a transaction

validate all the signatures
check owner in the current db

if the checks pass add an entry into the chain for the coin for the new owner.

to forge transations you need:

the keys to the authority
the keys for both owner and new owner.

in this system its possible to exchange money between accounts you own

*/
