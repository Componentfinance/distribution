/* global BigInt */
import React, {useState, useMemo} from "react";

import {Box, DataTable, Meter, Stack, Text, TextInput} from 'grommet';
import dataStore from "../data/data";
import useSubject from "../data/useSubject";
import { isMobile } from "react-device-detect";
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


    if (!balances.length) {
        return <Spinner />
    }

    return (
        <Box align='center' style={{maxWidth: '950px', margin: '0 auto'}}>
            <Box pad="medium" style={{width: '100%'}}>
                <TextInput onInput={(e) => setSearchPhrase(e.target.value)} placeholder="Search by address"/>
            </Box>
            <DataTableCustom
              data={filteredBalances}
              columns={[
                {
                    property: 'id',
                    header: <Text>#</Text>,
                    primary: true,
                },
                {
                    property: 'address',
                    header: <Text>Address</Text>,
                    render: datum =>
                            <Text style={{ fontFamily: 'monospace', fontSize: '11px' }}>{datum.address}</Text>
                    ,
                },
                {
                    property: 'currentStake',
                    header: <Text>Current stake</Text>,
                    render: datum =>
                            <Text>{formatNumber(Number(datum.currentStake / BigInt(10 ** 18)))}</Text>,
                },
                {
                    property: 'distributionPercent',
                    header: 'Distribution',
                    render: datum => {
                        const currentDistributionPercent =  Number(datum.currentStake * BigInt(1_000_000) / totalStake) / 10000
                        return (
                            <Stack anchor="center">
                                <Box>
                                    <Meter
                                        values={[{value: datum.distributionPercent}]}
                                        thickness="medium"
                                        size="medium"
                                    />
                                </Box>
                                <Box direction="row" align="center" pad={{bottom: 'xsmall'}}>
                                    <Text size="xlarge" weight="bold">
                                        {datum.distributionPercent}
                                    </Text>
                                    <Text size="small">%{currentDistributionPercent > datum.distributionPercent ? '⬆️' : '⬇️'}</Text>
                                </Box>
                            </Stack>
                        )
                    }
                },
              ]}
            />
        </Box>
    )
}
