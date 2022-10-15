
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

var mint_keys = nacl.sign.keyPair.fromSecretKey(
  nacl.util.decodeBase64(
  '69jY5I+zx8wf406lBcfUMj54u/c8PHp2mWjIicR1VvaiFUtEOmYU+Ddt8I2xL0j32mmYtaG/Gp8A/jnXqzNk3Q=='
))

var _keys = nacl.sign.keyPair()

var db = new Model()
var emitter = new Emitter()

function mintCoins (number, keys) {
  var coins = []
  var inc = 0
  do {
    var timestamp = new Date().toISOString();
    var coin = nacl.util.encodeBase64(nacl.randomBytes(32)) + timestamp + ':mcredible'
    var c = {
      prev_owner: nacl.util.encodeBase64(mint_keys.publicKey),
      owner: nacl.util.encodeBase64(keys.publicKey),
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

function verify (coin) {
  // console.log(coin)
  var c = {
    prev_owner: coin.prev_owner,
    owner: coin.owner,
    coin: coin.coin
  }
  var result = nacl.sign.detached.verify(
    nacl.util.decodeUTF8(
      JSON.stringify(c)),
      nacl.util.decodeBase64(coin.sig),
      nacl.util.decodeBase64(coin.prev_owner
    )
  );
  return result
}

var coins = mintCoins(5, _keys)

// console.log('.... ', verify(coins[0].coin, coins[0].sig, _keys.publicKey))

db.on('update', function (dbUpdate) {
  var myCoins = 0

  var d = db.toJSON()

  Object.keys(d).forEach(function (k) {
    // console.log(k, d[k])
    if (k === 'rpc:transaction') return;
    if (d[k].owner === nacl.util.encodeBase64(_keys.publicKey)) myCoins++
  })

  console.log('<balance> you have', myCoins, 'coins')
})

coins.forEach(function (coin) {
  db.set(coin.coin, coin)
})

emitter.on('rpc:transaction', function (t) {
  if (t.prev_owner !== nacl.util.encodeBase64(_keys.publicKey)) {
    if (verify (Object.assign({}, t))) {
      console.log('<message> new coin received from ', t.prev_owner)
      db.set(t.coin, t)
    }
  }
})

var sendMoney = setInterval(function () {
  var friendPublicKey = 'jLxrsMZv7w1IfuBepGNcu+ct0J/1LVsX9oChTSpO5ec='
  console.log('sending one coin to ', friendPublicKey)
  try {
    var t = {
      prev_owner: nacl.util.encodeBase64(_keys.publicKey),
      owner: friendPublicKey,
      coin: coins.pop().coin
    }
    var sig = nacl.util.encodeBase64(nacl.sign.detached(nacl.util.decodeUTF8(
      JSON.stringify(t)
    ), _keys.secretKey))
    t.sig = sig
    emitter.emit('rpc:transaction', t)
  } catch (e) {
    console.log('... you have run out of money')
    clearInterval(sendMoney)
  }
}, 5000)


sw.on('peer', function (peer, id) {
  peer.pipe(db.createStream()).pipe(peer)
  peer.pipe(emitter.createStream()).pipe(peer)
  // peer.on('data', function (d) {
  //   console.log(d.toString())
  // })
  console.log('connected to a new peer:', id)
  console.log('total peers:', sw.peers.length)
})

sw.on('disconnect', function (peer, id) {
  console.log('disconnected from a peer:', id)
  console.log('total peers:', sw.peers.length)
})
