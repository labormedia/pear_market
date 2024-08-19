'use strict'

import RPC from '@hyperswarm/rpc'
import DHT from 'hyperdht'
import Hypercore from 'hypercore'
import Hyperbee from 'hyperbee'
import crypto from 'hypercore-crypto'

import app_id from './app_id'
import Ajv from 'ajv'

console.log('app_id ',app_id ) 

const main = async () => {
  // hyperbee db
  const hcore = new Hypercore('./db/rpc-client')
  const hbee = new Hyperbee(hcore, { keyEncoding: 'utf-8', valueEncoding: 'binary' })
  const ajv = new Ajv
  await hbee.ready()

  // resolved distributed hash table seed for key pair
  let dhtSeed = (await hbee.get('dht-seed'))?.value
  if (!dhtSeed) {
    // not found, generate and store in db
    dhtSeed = crypto.randomBytes(32)
    await hbee.put('dht-seed', dhtSeed)
  }

  // start distributed hash table, it is used for rpc service discovery
  const dht = new DHT({
    port: 50001,
    keyPair: DHT.keyPair(dhtSeed),
    bootstrap: [{ host: '127.0.0.1', port: 30001 }] // note boostrap points to dht that is started via cli
  })
  await dht.ready()

  
  // public key of rpc server, used instead of address, the address is discovered via dht
  const serverPubKey = Buffer.from(app_id, 'hex')
  
  // rpc lib
  const rpc = new RPC({ dht })

  let nonce = await ping(serverPubKey, rpc, 42)

  nonce = await ping(serverPubKey, rpc, nonce.nonce)

  let auctions_instance = await load_update(serverPubKey, rpc, nonce.nonce)
  let schemas = auctions_instance.get_schemas()

  console.log(auctions_instance.version())
  console.log('Schemas', schemas)

  let new_auction = {
    id: 0,
    resource : "made for hex value",
    initial_price: 10,
    bids: {}
  }

  const is_valid = ajv.validate(
    schemas.auction_properties,
    new_auction,
  ) 
  console.log('is_valid', await auctions_instance.is_valid_auction(new_auction))

  let updated_auctions = (await create_auction(serverPubKey, rpc, new_auction)).toString('utf-8')
  console.log('New Auctions', updated_auctions)

  // closing connection
  await rpc.destroy()
  await dht.destroy()
}

async function parse_req(raw) {
  let req = false
  try { 
      req = JSON.parse(raw)
  } catch(e) {
      console.error(e)
  }

  if (!req) {
      return { error : 'Bad request' }
  } else {
      return req
  }
}

async function ping(key, rpc, nonce) {
    // payload for request
    const payload = { nonce }
    const payloadRaw = Buffer.from(JSON.stringify(payload), 'utf-8')
  
    // sending request and handling response
    // see console output on server code for public key as this changes on different instances
    
    const respRaw = await rpc.request(key, 'ping', payloadRaw)
    
    return JSON.parse(respRaw.toString('utf-8'))
}

async function update_app(key, rpc, nonce) {
  // payload for request
  const payload = { nonce }
  const payloadRaw = Buffer.from(JSON.stringify(payload), 'utf-8')
  
  const respRaw = await rpc.request(key, 'update_app', payloadRaw)
  
  return respRaw.toString('utf-8')
}

async function update_schemas(key, rpc, nonce) {
  // payload for request
  const payload = { nonce }
  const payloadRaw = Buffer.from(JSON.stringify(payload), 'utf-8')
  
  const respRaw = await rpc.request(key, 'update_schemas', payloadRaw)
  
  return respRaw.toString('utf-8')
}

// This function requires library ajv and functions [update_schemas, parse_req]
async function load_update(key, rpc, nonce) {
  let setup = {
    ajv: new Ajv,
    schemas: await parse_req(await update_schemas(key, rpc, nonce))
  }
  let Auctions = {}
  eval("Auctions = " + await update_app(key, rpc, nonce.nonce))
  let instance = new Auctions
  instance.setup(setup)
  return instance
}

// For testing purposes
async function create_auction(key, rpc, auction) {
  const respRaw = await rpc.request(key, 'create_auction', Buffer.from(JSON.stringify(auction)) )
  return respRaw
}


await main().catch(console.error)
    
document.querySelector('h1').addEventListener('click', (e) => { e.target.innerHTML = 'Worlds'})