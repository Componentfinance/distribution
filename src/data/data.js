/* global BigInt */
import _ from 'lodash'
import * as Web3 from 'web3'
import TimeWeightedBalance from "./TimeWeightedBalance";

import { BehaviorSubject } from 'rxjs'

const isDev = process.env.NODE_ENV === 'development'
const apiKey = isDev ? 'db72eb2275564c62bfa71896870d8975' : '3c3dfdec6ce94abc935977aa995d1a8c'
export const web3 = new Web3(`https://mainnet.infura.io/v3/${apiKey}`)

export let data = []

const dataStore = {
    distribution: new BehaviorSubject([]),

    setBalances(balances) {
        dataStore.distribution.next(balances)
    },
}


const TRANSFER_HASH = web3.utils.sha3('Transfer(address,address,uint256)');
const POOL = '0x49519631B404E06ca79C9C7b0dC91648D86F08db'
const ZERO_ADDRESS = '0x' + '0'.repeat(40)
const STARTED_BLOCK = 11_731_951;
const CREATED_BLOCK = 11_717_846;
const USER_STATE = new Map()
const TOTAL_SUPPLY = new TimeWeightedBalance(BigInt(0), STARTED_BLOCK);

const initialize = () => _.once(async () => {
    console.time('distr')
    const currentBlockNumber = await web3.eth.getBlockNumber();
    await fetchDataOnStart();
    await fetchDistributionData(currentBlockNumber);
    console.timeEnd('distr')

})()

async function fetchDataOnStart() {
    const logs = await web3.eth.getPastLogs({
        fromBlock: CREATED_BLOCK,
        toBlock: STARTED_BLOCK,
        address: POOL,
        topics: [TRANSFER_HASH]
    })
    logs.forEach(l => {
        const from = `0x${l.topics[1].substr(26)}`
        const to = `0x${l.topics[2].substr(26)}`
        const amount = BigInt(l.data)
        const fromUser = USER_STATE.get(from)
        if (fromUser) {
            fromUser._sub(amount, STARTED_BLOCK)
        } else if (from === ZERO_ADDRESS) {
            TOTAL_SUPPLY._add(amount, STARTED_BLOCK)
        } else {
            throw new Error("from unknown")
        }
        const toUser = USER_STATE.get(to)
        if (toUser) {
            toUser._add(amount, STARTED_BLOCK)
        } else if (to === ZERO_ADDRESS) {
            TOTAL_SUPPLY._sub(amount, STARTED_BLOCK)
        } else {
            USER_STATE.set(to, new TimeWeightedBalance(amount, STARTED_BLOCK))
        }
    })
}

async function fetchDistributionData(endBlock) {
    const logs = await web3.eth.getPastLogs({
        fromBlock: STARTED_BLOCK,
        toBlock: endBlock,
        address: POOL,
        topics: [TRANSFER_HASH]
    })
    logs.forEach(l => parseLog(l))
    const balances = calculateDistribution(endBlock)
    dataStore.setBalances(balances.map((d, i) => ({...d, id: i+1})))
}

function calculateDistribution(endBlock) {
    const totalDistr = TOTAL_SUPPLY.finalize(endBlock)
    return Array.from(USER_STATE.entries()).map(([addr, bal]) => ({
        address: addr,
        // lastSeen: bal.lastSeen,
        // current: bal.current,
        // acc: bal.finalize(endBlock),
        distributionPercent: Number(bal.finalize(endBlock) * BigInt(1_000_000) / totalDistr) / 10000,
    })).sort(({ distributionPercent: a }, { distributionPercent: b }) => {
        if (a < b) return 1
        if (a > b) return -1
        return 0
    })
}

function parseLog(log) {
    const from = `0x${log.topics[1].substr(26)}`
    const to = `0x${log.topics[2].substr(26)}`
    const amount = BigInt(log.data)
    if (from === ZERO_ADDRESS) {

        mint(amount, log.blockNumber)

        const toUser = USER_STATE.get(to)
        if (toUser) {
            toUser.add(amount, log.blockNumber)
        } else {
            USER_STATE.set(to, new TimeWeightedBalance(amount, log.blockNumber))
        }

        // rebalance()

    } else if (to === ZERO_ADDRESS) {

        burn(amount, log.blockNumber)

        const fromUser = USER_STATE.get(from)
        if (fromUser) {
            fromUser.sub(amount, log.blockNumber)
        } else {
            throw new Error("from unknown")
        }

        // rebalance()

    } else {

        const fromUser = USER_STATE.get(from)
        if (fromUser) {
            fromUser.sub(amount, log.blockNumber)
        } else {
            throw new Error("from unknown")
        }

        const toUser = USER_STATE.get(to)
        if (toUser) {
            toUser.add(amount, log.blockNumber)
        } else {
            USER_STATE.set(to, new TimeWeightedBalance(amount, log.blockNumber))
        }

    }

}

function burn(amount, now) {
    TOTAL_SUPPLY.sub(amount, now)
}

function mint(amount, now) {
    TOTAL_SUPPLY.add(amount, now)
}

initialize();

export default dataStore


