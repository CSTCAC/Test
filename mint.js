
var nacl = require('tweetnacl')
var swarm = require('webrtc-swarm')
nacl.util = require('tweetnacl-util')
var Model = require('scuttlebutt/model')
var Emitter = require('scuttlebutt/events')
var signalhub = require('./signalhub/index.js')

var mint_keys = nacl.sign.keyPair.fromSecretKey(
  nacl.util.decodeBase64(
  '69jY5I+zx8wf406lBcfUMj54u/c8PHp2mWjIicR1VvaiFUtEOmYU+Ddt8I2xL0j32mmYtaG/Gp8A/jnXqzNk3Q=='
))

var _keys = nacl.sign.keyPair()

var mint_publicKey = nacl.util.encodeBase64(mint_keys.publicKey)

console.log(mint_publicKey)

var hub = signalhub(mint_publicKey, [
  'http://localhost:9999'
])
var sw = swarm(hub, {
  wrtc: require('wrtc') // don't need this if used in the browser
})

var new_coin_beneficiary = process.argv.slice(2)[0]

if (typeof new_coin_beneficiary !== 'string') throw Error('needs a coin benficiary public key')

var db = new Model()
var emitter = new Emitter()

db.on('update', function () {
  var myCoins = 0
  var d = db.toJSON()
  Object.keys(d).forEach(function (k) {
    // console.log(k, d[k])
    if (k === 'rpc:transaction') return;
    if (d[k].owner === new_coin_beneficiary) myCoins++
  })
  console.log(myCoins, 'coins have been sent to ', new_coin_beneficiary)
})

function mintCoins (number, newOwner) {
  var coins = []
  var inc = 0
  do {
    var timestamp = new Date().toISOString();
    var coin = nacl.util.encodeBase64(nacl.randomBytes(32)) + timestamp + ':mcredible'
    var c = {
      prev_owner: nacl.util.encodeBase64(mint_keys.publicKey),
      owner: newOwner,
      coin: coin
    }
    var sig = nacl.util.encodeBase64(nacl.sign.detached(nacl.util.decodeUTF8(
      JSON.stringify(c)
    ), mint_keys.secretKey))
    c.sig =  sig
    coins.push(c)
    inc++;
  } while (inc < number)
  return coins
}

var coins = mintCoins(5, new_coin_beneficiary)

coins.forEach(function (c) {
  emitter.emit('rpc:transaction', c)
})

console.log('minted ', coins, ' to ', new_coin_beneficiary.trim())

sw.on('peer', function (peer, id) {
  peer.pipe(db.createStream()).pipe(peer)
  peer.pipe(emitter.createStream()).pipe(peer)
  console.log('connected to a new peer:', id)
  console.log('total peers:', sw.peers.length)
})

sw.on('disconnect', function (peer, id) {
  console.log('disconnected from a peer:', id)
  console.log('total peers:', sw.peers.length)
})
