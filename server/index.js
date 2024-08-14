import swarm from 'hyperswarm'
import RPC from '@hyperswarm/rpc'
import DHT from 'hyperdht'
import Hypercore from 'hypercore'
import Hyperbee from 'hyperbee'
import id from 'hypercore-crypto'
import b4a from 'b4a'

import Ajv from 'ajv'

// Auctions shared behaviour and schema
import Auctions from './auctions'
import AuctionSchemas from './schemas'

const { versions, teardown } = Pear
console.log('Pear terminal application running')
console.log(await versions())
console.log('Auctions', (new Auctions).version())
teardown(() => swarm.destroy())

const main = async () => {
    const core = new Hypercore('./db/rpc-server')
    const bee = new Hyperbee(core, { keyEncoding: 'utf-8', valueEncoding: 'binary'})
    await bee.ready()

    let dht_seed = (await bee.get('dht-seed'))?.value
    if (!dht_seed) {
        dht_seed = id.randomBytes(32)
        await bee.put('dht-seed', dht_seed)
    }

    console.log('dht_seed ', b4a.toString(dht_seed, 'hex'))

    const dht = new DHT({
        port: 40001,
        keyPair: DHT.keyPair(dht_seed),
        bootstrap: [{ host: '0.0.0.0', port: 30001}] // node multiaddress
    })
    await dht.ready()

    let rpc_seed = (await bee.get('rpc-seed'))?.value
    if (!rpc_seed) {
        rpc_seed = id.randomBytes(32)
        await bee.put('rpc-seed', rpc_seed)
    }

    let rpc = new RPC({seed : rpc_seed, dht})
    const rpc_server = rpc.createServer()
    await rpc_server.listen()

    console.log('rpc_seed ', b4a.toString(rpc_seed, 'hex'))
    console.log('rpc public key ', rpc_server.publicKey.toString('hex') + '  <--------- RPC_PUBLIC_KEY of this example')

    let app_instance = new Auctions
    let setup = {
        ajv: new Ajv,
        schemas: AuctionSchemas,
      }
    app_instance.setup(setup)

    rpc_server.respond('ping', async (req_raw) => {
        console.log('ping')
        let req = await parse_req(req_raw).catch(console.error)

        if (!req && !req.nonce) {
            return Buffer.from('Bad request', 'utf-8')
        } else {
            console.log('nonce', req.nonce)
            return Buffer.from(JSON.stringify({ nonce: req.nonce + 1 }), 'utf-8')
        }
    })

    rpc_server.respond('update_app', async (req_raw) => {
        console.log('update_app')
        let req = await parse_req(req_raw).catch(console.error)

        let response = Auctions.toString()

        console.log('auctions', response)

        if (!req && !req.nonce) {
            return Buffer.from('Bad request', 'utf-8')
        } else {
            return Buffer.from(response, 'utf-8')
        }
    })

    rpc_server.respond('update_schemas', async (req_raw) => {
        console.log('update_schemas')
        let req = await parse_req(req_raw).catch(console.error)

        let response = JSON.stringify(AuctionSchemas)

        console.log('auctions', response)

        if (!req && !req.nonce) {
            return Buffer.from('Bad request', 'utf-8')
        } else {
            return Buffer.from(response, 'utf-8')
        }
    })

    rpc_server.respond('create_auction', async (req_raw) => {

        let req = await parse_req(req_raw).catch(console.error)
        let schema = app_instance.get_schemas().auction_properties
        console.log('incoming auction', req)
        console.log('schema', schema)
        let is_valid = app_instance.is_valid_auction(req)
        console.log('is_valid ', is_valid)
        if (is_valid) {
            let bids = (await bee.get('bids'))?.value
            console.log('bids ', bids)
            if (!bids) {
                bids = {
                    [req.id.toString()]: req 
                }
                console.log('created bids ', bids)
                await bee.put('bids', bids) // TODO: resolve "offset is out of bounds" error
                return bids
            } else if (!bids[req.id]) {
                bids[req.id] = req
                await bee.put('bids', bids)
                console.log('updated bids ', JSON.stringify(bids))
                return bids
            } else {
                return Buffer.from('Entry id already exists', 'utf-8')
            }
        } else {
            return Buffer.from('Bad request', 'utf-8')
        }
    })

    console.log('progress')

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



await main().catch(console.error)