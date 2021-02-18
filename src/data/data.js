/* global BigInt */
import _ from 'lodash'
import * as Web3 from 'web3'
import TimeWeightedBalance, { NUMERATOR } from "./TimeWeightedBalance";

import { BehaviorSubject } from 'rxjs'

const isDev = process.env.NODE_ENV === 'development'
const apiKey = isDev ? 'db72eb2275564c62bfa71896870d8975' : '3c3dfdec6ce94abc935977aa995d1a8c'
export const web3 = new Web3(`wss://mainnet.infura.io/ws/v3/${apiKey}`)
const animals = ['🦆', '🐱', '🦁', '🦕', '🦍', '🦄', '🐊', '🐸', '🐛', '🐜', '🦐', '🦋', '🪰', '🪱', '🌱', '☃️', '🪨'];

const dataStore = {
    distribution: new BehaviorSubject([]),
    totalStake: new BehaviorSubject(BigInt(1)),
    blockNumber: new BehaviorSubject(''),

    setBalances(balances) {
        dataStore.distribution.next(balances)
    },

    setBlockNumber(blockNumber) {
        dataStore.blockNumber.next(blockNumber)
    },

    setTotalStake(amount) {
        dataStore.totalStake.next(amount)
    },
}

const TRANSFER_HASH = web3.utils.sha3('Transfer(address,address,uint256)');

const POOLS = {
    '0x49519631b404e06ca79c9c7b0dc91648d86f08db': {
        startedBlock: 11_731_951,
        createdBlock: 11_717_846,
    },
    '0x6477960dd932d29518d7e8087d5ea3d11e606068': {
        startedBlock: 11_772_123,
        createdBlock: 11_759_920,
    },
}

const ZERO_ADDRESS = '0x' + '0'.repeat(40)
const USER_STATES = new Map()
const STAKING_STARTED_AT_BLOCK = Math.min(..._.values(POOLS).map(({ startedBlock }) => startedBlock))
const TOTAL_SUPPLY = new TimeWeightedBalance(BigInt(0), STAKING_STARTED_AT_BLOCK);
const INITIAL_SUPPLY_STATES = {}
const INITIAL_USER_STATES = {}

const initialize = () => _.once(async () => {
    console.time('distr')
    const currentBlockNumber = await web3.eth.getBlockNumber();
    await fetchInitialData();
    await fetchDistributionData(currentBlockNumber);
    dataStore.setTotalStake(TOTAL_SUPPLY.current)
    console.timeEnd('distr')
    subcribeToEvents()
})()

async function fetchInitialData() {
    for (const poolAddress in POOLS) {
        const pool = POOLS[poolAddress]
        INITIAL_SUPPLY_STATES[poolAddress] = BigInt(0);
        INITIAL_USER_STATES[poolAddress] = new Map();

        const _users = INITIAL_USER_STATES[poolAddress]

        const logs = await web3.eth.getPastLogs({
            fromBlock: pool.createdBlock,
            toBlock: pool.startedBlock,
            address: poolAddress,
            topics: [TRANSFER_HASH]
        })


        logs.forEach(l => {

            const from = `0x${l.topics[1].substr(26)}`
            const to = `0x${l.topics[2].substr(26)}`
            const amount = BigInt(l.data)

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
        USER_STATES.set(userAddress, new TimeWeightedBalance(INITIAL_USER_STATES[initialPoolAddress].get(userAddress), POOLS[initialPoolAddress].startedBlock))
        INITIAL_USER_STATES[initialPoolAddress].delete(userAddress)
    }
    delete INITIAL_USER_STATES[initialPoolAddress]
}

async function fetchDistributionData(endBlockNumber) {

    const promises = _.keys(POOLS).map(poolAddress => web3.eth.getPastLogs({
        fromBlock: POOLS[poolAddress].startedBlock,
        toBlock: endBlockNumber,
        address: poolAddress,
        topics: [TRANSFER_HASH]
    }))


    const logs = _.flatten(await Promise.all(promises))
        .sort((a, b) => {
            if (a.blockNumber > b.blockNumber) {
                return 1
            }
            if (a.blockNumber < b.blockNumber) {
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

    logs.forEach(l => applyLog(l))

    finalize(endBlockNumber)

}

function finalize(endBlockNumber) {

    const balances = calculateDistribution(endBlockNumber)

    dataStore.setBalances(
        balances.map(
            (d, i) => ({
                    ...d,
                    id: animals[i] ?? i + 1,
                })
        )
    )

    dataStore.setBlockNumber(endBlockNumber)

}

function calculateDistribution(endBlock) {

    const proportionTimeTotal = BigInt(endBlock - STAKING_STARTED_AT_BLOCK) * NUMERATOR

    const supply = TOTAL_SUPPLY.current

    return Array.from(USER_STATES.entries()).map(([addr, bal]) => ({
        address: addr,
        currentStake: bal.current,
        distributionPercent: (Number(bal.finalize(endBlock, supply) * BigInt(1_000_000) / proportionTimeTotal) / 10000),
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
    const now = log.blockNumber

    for (const uninitializedPoolAddress in INITIAL_SUPPLY_STATES) {

        const { startedBlock } = POOLS[uninitializedPoolAddress]

        if (now > startedBlock) {

            const prevSupply = TOTAL_SUPPLY.current

            // apply pool initial state
            mint(INITIAL_SUPPLY_STATES[uninitializedPoolAddress], startedBlock)

            const excludeAddresses = []

            for (const userAddress of Array.from(INITIAL_USER_STATES[uninitializedPoolAddress].keys())) {
                const amount = INITIAL_USER_STATES[uninitializedPoolAddress].get(userAddress)
                const toUser = USER_STATES.get(userAddress)
                if (toUser) {
                    toUser.add(amount, now, prevSupply)
                } else {
                    USER_STATES.set(userAddress, new TimeWeightedBalance(amount, startedBlock))
                }
                INITIAL_USER_STATES[uninitializedPoolAddress].delete(userAddress)
                excludeAddresses.push(userAddress)
            }

            delete INITIAL_SUPPLY_STATES[uninitializedPoolAddress]
            delete INITIAL_USER_STATES[uninitializedPoolAddress]
            rebalance(prevSupply, startedBlock, excludeAddresses)
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
            USER_STATES.set(to, new TimeWeightedBalance(amount, log.blockNumber))
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

function subcribeToEvents() {
    web3.eth.subscribe("newBlockHeaders", (error, event) => {
        if (!error) {
            finalize(event.number)
        }
    })
    _.keys(POOLS).forEach(poolAddress =>
    web3.eth.subscribe('logs', {
        address: poolAddress,
        topics: [TRANSFER_HASH]
    }, (error, log ) => {
        if (!error) {
            applyLog(log)
            finalize(log.blockNumber)
        }
    }))
}


export default dataStore


