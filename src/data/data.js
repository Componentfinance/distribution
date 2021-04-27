/* global BigInt */
import _ from 'lodash'
import * as Web3 from 'web3'
import * as axios from 'axios'
import TimeWeightedBalance, { NUMERATOR } from "./TimeWeightedBalance"

import { BehaviorSubject } from 'rxjs'

const infuraApiKey = process.env.REACT_APP_INFURA_API_KEY

const explorerApiKeys = {
    eth: process.env.REACT_APP_ETHERSCAN_API_KEY,
    bsc: process.env.REACT_APP_BSCSCAN_API_KEY,
}
export const ethWeb3 = new Web3(`wss://mainnet.infura.io/ws/v3/${infuraApiKey}`)
export const xdaiWeb3 = new Web3('https://rpc.xdaichain.com/')
export const bscWeb3 = new Web3(process.env.REACT_APP_BSC_WS)
const animals = ['🦆', '🐱', '🦁', '🦕', '🦍', '🦄', '🐊', '🐸', '🐛', '🐜', '🦐', '🦋', '🪰', '🪱', '🌱', '☃️', '🪨'];

const explorerUrls = {
    eth: 'https://api.etherscan.io/api',
    xdai: 'https://blockscout.com/poa/xdai/api',
    bsc: 'https://api.bscscan.com/api'
}

const dataStore = {
    distribution: new BehaviorSubject([]),
    totalStake: new BehaviorSubject(BigInt(1)),
    error: new BehaviorSubject(null),
    time: new BehaviorSubject(''),
    stage: new BehaviorSubject(''),

    setBalances(balances) {
        dataStore.distribution.next(balances)
    },

    setTime(time) {
        dataStore.time.next(time)
    },

    setTotalStake(amount) {
        dataStore.totalStake.next(amount)
    },

    setError(error) {
        dataStore.error.next(error)
    },

    setStage(stage) {
        dataStore.stage.next(stage)
    },
}

const TRANSFER_HASH = ethWeb3.utils.sha3('Transfer(address,address,uint256)');

const POOLS = {
    '0x49519631b404e06ca79c9c7b0dc91648d86f08db': {
        startedBlock: 11_731_951,
        startedTime: 1611672647,
        createdBlock: 11_717_846,
        chain: 'eth',
    },
    '0x6477960dd932d29518d7e8087d5ea3d11e606068': {
        startedBlock: 11_772_123,
        startedTime: 1612206361,
        createdBlock: 11_759_920,
        chain: 'eth',
    },
    '0xcf76a0cedf50da184fdef08a9d04e6829d7fefdf': {
        startedBlock: 5_625_366,
        startedTime: 1615580958,
        createdBlock: 5_616_877,
        chain: 'bsc',
    },
    '0x53De001bbfAe8cEcBbD6245817512F8DBd8EEF18': {
        startedBlock: 14_511_611,
        startedTime: 1613137575,
        createdBlock: 14_498_740,
        chain: 'xdai',
    },
}

const xdaiIncluded = _.values(POOLS).find(({ chain }) => chain === 'xdai')

const ZERO_ADDRESS = '0x' + '0'.repeat(40)
const USER_STATES = new Map()
const STAKING_STARTED_TIMESTAMP = Math.min(..._.values(POOLS).map(({ startedTime }) => startedTime))
const TOTAL_SUPPLY = new TimeWeightedBalance(BigInt(0), STAKING_STARTED_TIMESTAMP);
const INITIAL_SUPPLY_STATES = {}
const INITIAL_USER_STATES = {}

const DISTRIBUTION_END_TIME = 1619522590

const initialize = () => _.once(async () => {
    console.time('loading time')
    await fetchInitialData();
    await fetchDistributionData();
    dataStore.setTotalStake(TOTAL_SUPPLY.current)
    console.timeEnd('loading time')
})()

async function fetchInitialData() {

    const receives = await xdaiWeb3.eth.getPastLogs({
        address: '0x53De001bbfAe8cEcBbD6245817512F8DBd8EEF18',
        topics: [TRANSFER_HASH, [], '0x0000000000000000000000008e370b7419f8d7bcd341a2e0c1c5a666d8ab5b4d'],
        fromBlock: 14_498_740
    })

    const sends = await xdaiWeb3.eth.getPastLogs({
        address: '0x53De001bbfAe8cEcBbD6245817512F8DBd8EEF18',
        topics: [TRANSFER_HASH, '0x0000000000000000000000008e370b7419f8d7bcd341a2e0c1c5a666d8ab5b4d'],
        fromBlock: 14_498_740,
    })

    console.log({ receives, sends })

    for (const poolAddress in POOLS) {
        const pool = POOLS[poolAddress]
        dataStore.setStage(`Fetching initial data for ${poolAddress} on ${pool.chain}`)
        INITIAL_SUPPLY_STATES[poolAddress] = BigInt(0);
        INITIAL_USER_STATES[poolAddress] = new Map();

        const _users = INITIAL_USER_STATES[poolAddress]

        let logs = []

        try {

            const url = explorerUrls[pool.chain] +
                '?module=logs&action=getLogs' +
                `&fromBlock=${pool.createdBlock}` +
                `&toBlock=${pool.startedBlock}` +
                `&address=${poolAddress}` +
                `&topic0=${TRANSFER_HASH}` +
                (explorerApiKeys[pool.chain] ? `&apikey=${explorerApiKeys[pool.chain]}` : '')
            let logArray = (await axios.get(url)).data.result

            logs = logArray

            while (logArray.length === 1_000) {

                // let's say we are not missing anything
                const fromBlock = +logs[999].blockNumber + 1

                logArray = (await axios.get(
                    explorerUrls[pool.chain] +
                    '?module=logs&action=getLogs' +
                    `&fromBlock=${fromBlock}` +
                    `&toBlock=${pool.startedBlock}` +
                    `&address=${poolAddress}` +
                    `&topic0=${TRANSFER_HASH}` +
                    (explorerApiKeys[pool.chain] ? `&apikey=${explorerApiKeys[pool.chain]}` : '')
                )).data.result;

                logs = logs.concat(logArray);
            }

        } catch (e) {
            dataStore.setError(`Failed to fetch data for ${poolAddress} on ${POOLS[poolAddress].chain}`)
        }

        logs.forEach(l => {

            const from = `0x${l.topics[1].substr(26)}`
            const to = `0x${l.topics[2].substr(26)}`
            const amount = BigInt(l.data)

            if ([from, to].includes('0x8e370b7419f8d7bcd341a2e0c1c5a666d8ab5b4d')) {
                console.log(l)
            }

            if (from === ZERO_ADDRESS) {

                INITIAL_SUPPLY_STATES[poolAddress] += amount

                const toUserBalance = _users.get(to)
                if (toUserBalance) {
                    _users.set(to, toUserBalance + amount)
                } else {
                    _users.set(to, amount)
                }

            } else if (to === ZERO_ADDRESS) {

                INITIAL_SUPPLY_STATES[poolAddress] -= amount

                const fromUserBalance = _users.get(from)
                if (fromUserBalance) {
                    _users.set(from, fromUserBalance - amount)
                } else {
                    throw new Error("from unknown")
                }

            } else {

                const fromUserBalance = _users.get(from)

                if (fromUserBalance) {
                    _users.set(from, fromUserBalance - amount)
                } else {
                    throw new Error("from unknown")
                }

                const toUserBalance = _users.get(to)
                if (toUserBalance) {
                    _users.set(to, toUserBalance + amount)
                } else {
                    _users.set(to, amount)
                }

            }

        })
    }

    const initialPoolAddress = _.keys(POOLS)[0]
    TOTAL_SUPPLY._add(INITIAL_SUPPLY_STATES[initialPoolAddress])
    delete INITIAL_SUPPLY_STATES[initialPoolAddress]
    for (const userAddress of Array.from(INITIAL_USER_STATES[initialPoolAddress].keys())) {
        USER_STATES.set(userAddress, new TimeWeightedBalance(INITIAL_USER_STATES[initialPoolAddress].get(userAddress), POOLS[initialPoolAddress].startedTime))
        INITIAL_USER_STATES[initialPoolAddress].delete(userAddress)
    }
    delete INITIAL_USER_STATES[initialPoolAddress]
}

async function fetchDistributionData() {

    const endBlocks = {
        eth: 12322099,
        bsc: 6928593,
    }

    if (xdaiIncluded) {
        endBlocks.xdai = 15756907
    }

    const promises = _.keys(POOLS).map(poolAddress => {
        const { chain, startedBlock } = POOLS[poolAddress]
        return axios.get(explorerUrls[POOLS[poolAddress].chain] +
            '?module=logs&action=getLogs' +
            `&fromBlock=${startedBlock}` +
            `&toBlock=${endBlocks[chain]}` +
            `&address=${poolAddress}` +
            `&topic0=${TRANSFER_HASH}`+
            (explorerApiKeys[chain] ? `&apikey=${explorerApiKeys[chain]}` : '')
    )})

    const respArray = []

    for (const promise of promises) {
        const address = _.keys(POOLS)[respArray.length]
        const { chain } = POOLS[address]
        dataStore.setStage(`Fetching distribution data for ${address} on ${chain}`)
        try {
            let resp = (await promise).data.result

            let logs = resp

            while (resp.length === 1_000) {
                // let's say we are not missing anything
                const fromBlock = +resp[999].blockNumber + 1

                resp = (await axios.get(
                    explorerUrls[chain] +
                    '?module=logs&action=getLogs' +
                    `&fromBlock=${fromBlock}` +
                    `&toBlock=${endBlocks[chain]}` +
                    `&address=${address}` +
                    `&topic0=${TRANSFER_HASH}` +
                    (explorerApiKeys[chain] ? `&apikey=${explorerApiKeys[chain]}` : '')
                )).data.result;

                logs = logs.concat(resp);
            }

            respArray.push(logs)
        } catch (e) {
            dataStore.setError(`Failed to fetch data for ${address} on ${chain}`)
        }
    }

    dataStore.setStage(`Calculating`)

    const logs = _.flatten(respArray)
        .sort((a, b) => {
            if (a.timeStamp > b.timeStamp) {
                return 1
            }
            if (a.timeStamp < b.timeStamp) {
                return -1
            }
            if (a.logIndex > b.logIndex) {
                return 1
            }
            if (a.logIndex < b.logIndex) {
                return -1
            }
            throw new Error("Impossible case: the same logIndex")
        });

    logs.forEach(l => {
        applyLog(l)
    })

    finalize()

}

function finalize() {

    const balances = calculateDistribution(DISTRIBUTION_END_TIME)

    dataStore.setBalances(
        balances.map(
            (d, i) => ({
                    ...d,
                    id: animals[i] ?? i + 1,
                })
        )
    )

    dataStore.setTime(DISTRIBUTION_END_TIME)

}

function calculateDistribution(endTime) {

    const proportionTimeTotal = BigInt(endTime - STAKING_STARTED_TIMESTAMP) * NUMERATOR

    const supply = TOTAL_SUPPLY.current

    return Array.from(USER_STATES.entries()).map(([addr, bal]) => ({
        address: addr,
        currentStake: bal.current,
        distributionPercent: (Number(bal.finalize(endTime, supply) * BigInt(1_000_000) / proportionTimeTotal) / 10000),
    })).sort(({ distributionPercent: a }, { distributionPercent: b }) => {
        if (a < b) return 1
        if (a > b) return -1
        return 0
    })
}

function applyLog(log) {
    const from = `0x${log.topics[1].substr(26)}`
    const to = `0x${log.topics[2].substr(26)}`
    const amount = BigInt(log.data)
    const now = log.timeStamp

    if ([from, to].includes('0x8e370b7419f8d7bcd341a2e0c1c5a666d8ab5b4d')) {
        console.log(log)
    }


    if (amount === BigInt(0)) return

    for (const uninitializedPoolAddress in INITIAL_SUPPLY_STATES) {

        const { startedTime } = POOLS[uninitializedPoolAddress]

        if (now > startedTime) {

            const prevSupply = TOTAL_SUPPLY.current

            // apply pool initial state
            mint(INITIAL_SUPPLY_STATES[uninitializedPoolAddress], startedTime)

            const excludeAddresses = []

            for (const userAddress of Array.from(INITIAL_USER_STATES[uninitializedPoolAddress].keys())) {
                const amount = INITIAL_USER_STATES[uninitializedPoolAddress].get(userAddress)
                const toUser = USER_STATES.get(userAddress)
                if (toUser) {
                    toUser.add(amount, now, prevSupply)
                } else {
                    USER_STATES.set(userAddress, new TimeWeightedBalance(amount, startedTime))
                }
                INITIAL_USER_STATES[uninitializedPoolAddress].delete(userAddress)
                excludeAddresses.push(userAddress)
            }

            delete INITIAL_SUPPLY_STATES[uninitializedPoolAddress]
            delete INITIAL_USER_STATES[uninitializedPoolAddress]
            rebalance(prevSupply, startedTime, excludeAddresses)
        }

    }

    const prevSupply = TOTAL_SUPPLY.current

    if (from === ZERO_ADDRESS) {

        mint(amount, now)

        const toUser = USER_STATES.get(to)
        if (toUser) {
            toUser.add(amount, now, prevSupply)
        } else {
            USER_STATES.set(to, new TimeWeightedBalance(amount, now))
        }

        rebalance(prevSupply, now, [to])

    } else if (to === ZERO_ADDRESS) {

        burn(amount, now)

        const fromUser = USER_STATES.get(from)
        if (fromUser) {
            fromUser.sub(amount, now, prevSupply)
        } else {
            throw new Error("from unknown")
        }

        rebalance(prevSupply, now, [from])

    } else {

        const fromUser = USER_STATES.get(from)
        if (fromUser) {
            fromUser.sub(amount, now, prevSupply)
        } else {
            throw new Error("from unknown")
        }

        const toUser = USER_STATES.get(to)
        if (toUser) {
            toUser.add(amount, now, prevSupply)
        } else {
            USER_STATES.set(to, new TimeWeightedBalance(amount, now))
        }

    }

}

function rebalance(supply, now, excludedAddr) {
    Array.from(USER_STATES.keys()).forEach(addr => {
        if (excludedAddr.includes(addr)) return
        const userState = USER_STATES.get(addr)
        userState._update(supply, now)
    })
}

function burn(amount, now) {
    TOTAL_SUPPLY._sub(amount, now)
    if (dataStore.distribution.getValue().length)
        dataStore.setTotalStake(TOTAL_SUPPLY.current)
}

function mint(amount, now) {
    TOTAL_SUPPLY._add(amount, now)
    if (dataStore.distribution.getValue().length)
        dataStore.setTotalStake(TOTAL_SUPPLY.current)
}

initialize()


export default dataStore