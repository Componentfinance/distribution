/* global BigInt */
import React, {useState, useMemo} from "react";

import Arrow from '../up-arrow.svg'

import {Box, DataTable, Meter, Stack, Text, TextInput} from 'grommet';
import dataStore from "../data/data";
import useSubject from "../data/useSubject";
import Spinner from "./Spinner";
import {DataTableCustom} from './DistributionStyled.js';

export function formatNumber(x) {
    if (x > 1_000_000) {
        return `${Math.floor(x / 10_000) / 100}M`
    }
    if (x > 1_000) {
        return `${Math.floor(x / 10) / 100}K`
    }
    let y = x.toString()
    const dotIndex = y.indexOf('.')
    if (dotIndex !== -1) {
        let a = y.substr(0, y.indexOf('.'))
        let b = y.substr(y.indexOf('.'))
        return a.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + b
    }
    return y.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export const Distribution = () => {
    const balances = useSubject(dataStore.distribution)
    const totalStake = useSubject(dataStore.totalStake)
    const [searchPhrase, setSearchPhrase] = useState('');
    const filteredBalances = useMemo(() => {
        if (searchPhrase)
            return balances.filter((balance) => {
                return balance.address.toLowerCase().includes(searchPhrase.toLowerCase());
            });
        else return balances;
    }, [searchPhrase, balances]);

    const maxPercent = useMemo(
      () => Math.max(...filteredBalances.map(balance => Number(balance.distributionPercent))),
      [filteredBalances]
    );


    if (!balances.length) {
        return <Spinner />
    }

    return (
        <Box align='center' style={{margin: '0 auto'}}>
            <Box pad="small" style={{width: '100%', maxWidth: '925px', marginRight: 'auto'}}>
                <TextInput onInput={(e) => setSearchPhrase(e.target.value)} placeholder="Search by address"/>
            </Box>
            <DataTableCustom
              data={filteredBalances}
              columns={[
                {
                    property: 'id',
                    header: <Text>👑</Text>,
                    primary: true,
                },
                {
                    property: 'address',
                    header: <Text>Address</Text>,
                    render: datum =>
                      <Text>
                          {datum.address.substring(0, 8)}...{datum.address.substring(36)}
                      </Text>
                    ,
                },
                {
                    property: 'currentStake',
                    header: <Text>Current stake</Text>,
                    render: datum =>
                            <Text>{formatNumber(Number(datum.currentStake / BigInt(10 ** 18)))}</Text>,
                },
                {
                    property: 'distributionLine',
                    header: 'Distribution',
                    render: datum => {
                        return (
                            <Stack anchor="center">
                                <Box>
                                    <Meter
                                      background="transparent"
                                      values={[{value: Number(datum.distributionPercent) * 100 / maxPercent, color: '#ff42a1'}]}
                                      thickness="medium"
                                      size="xsmall"
                                    />
                                </Box>
                            </Stack>
                        )
                    }
                },
                  {
                      property: 'distributionPercent',
                      header: 'Percent',
                      render: datum => {
                          const currentDistributionPercent =  Number(datum.currentStake * BigInt(1_000_000) / totalStake) / 10000
                          return (
                            <Box direction="row" align="center" pad={{bottom: 'xsmall'}}>
                                <Text size="xlarge">
                                    {datum.distributionPercent}
                                </Text>
                                <Box direction="row" align="center">
                                    <Text>{'\u00A0'}%</Text>
                                    <span style={{ marginLeft: '10px' }}>
                                        {currentDistributionPercent > datum.distributionPercent ? <img src={Arrow} style={{ display: 'block', width: '15px'}}/> : <img src={Arrow} style={{ transform: 'rotate(180deg)', display: 'block', width: '15px'}}/>}
                                    </span>
                                </Box>
                            </Box>
                          )
                      }
                  }
              ]}
            />
        </Box>
    )
}
