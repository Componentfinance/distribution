/* global BigInt */
import React, {useState, useMemo} from "react";

import Arrow from '../up-arrow.svg'

import {Box, Meter, Stack, Text, TextInput, Tip} from 'grommet';
import dataStore from "../data/data";
import useSubject from "../data/useSubject";
import Spinner from "./Spinner";
import {DataTableCustom} from './DistributionStyled.js';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import styled from 'styled-components';

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

const StyledText = styled(Text)`
  display: flex;
  align-items: center;
  img {
    opacity: 0;
    @media screen and (max-width: 600px) {
      opacity: 1;
    }
  }
  :hover {
    img {
      opacity: 1;
    }
  }
  @media screen and (max-width: 600px) {
    justify-content: center;
  }
`;

const copyIcon = `${process.env.PUBLIC_URL}/ic-copy.svg`;

export const Distribution = () => {
    const balances = useSubject(dataStore.distribution)
    const totalStake = useSubject(dataStore.totalStake)
    const [searchPhrase, setSearchPhrase] = useState('');
    const [copied, setCopied] = useState(false);

    React.useEffect(() => {
      if (copied) setTimeout(() => setCopied(false), 1000)
    }, [copied])

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
        return (

            <Box align='center' style={{margin: '0 auto'}}>
                <span style={{marginBottom:'20px'}}>Fetching data, please wait ~1 min</span>
                <Spinner/>
            </Box>
        )
    }

    return (
        <Box align='center' style={{margin: '0 auto'}}>
            <Box pad="small" style={{width: '100%', maxWidth: '925px', marginRight: 'auto'}}>
                <TextInput onInput={(e) => setSearchPhrase(e.target.value)} placeholder="Search by address"/>
            </Box>
            <DataTableCustom
              data={filteredBalances}
              sortable
              columns={[
                {
                    property: 'id',
                    header: <Text>👑</Text>,
                    primary: true,
                    sortable: false,
                },
                {
                    property: 'address',
                    header: <Text>Address</Text>,
                    render: datum =>
                      <CopyToClipboard
                        text={datum.address}
                        style={{cursor: 'copy'}}
                        onCopy={() => setCopied(true)}
                      >

                          <StyledText>
                            <>
                              <span>{datum.address.substring(0, 8)}...{datum.address.substring(36)}</span>
                                <Tip content={copied ? <Text size='small'>Copied</Text>: <Text size='small'>&nbsp;Copy&nbsp;</Text>}>
                                    <img alt='' src={copyIcon} style={{ marginLeft: '10px', width: '15px'}}/>
                                </Tip>
                            </>
                          </StyledText>
                      </CopyToClipboard>
                    ,
                    sortable: false,
                },
                {
                    property: 'currentStake',
                    header: <Text>Current stake</Text>,
                    render: datum =>
                            <Text>{formatNumber(Number(datum.currentStake / BigInt(10 ** 18)))}</Text>,
                    sortable: true,
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
                    },
                    sortable: false,
                },
                  {
                      property: 'distributionPercent',
                      header: 'Percent',
                      render: datum => {
                          const currentDistributionPercent =  Number(datum.currentStake * BigInt(1_000_000) / totalStake) / 10000
                          return (
                            <Box direction="row" align="center" pad={{bottom: 'xsmall'}}>
                                <Text size="xlarge">
                                    {datum.distributionPercent.toFixed(4)}
                                </Text>
                                <Box direction="row" align="center">
                                    <Text>{'\u00A0'}%</Text>
                                    <span style={{ marginLeft: '10px' }}>
                                        {currentDistributionPercent > datum.distributionPercent ? <img alt='' src={Arrow} style={{ display: 'block', width: '15px'}}/> : <img alt='' src={Arrow} style={{ transform: 'rotate(180deg)', display: 'block', width: '15px'}}/>}
                                    </span>
                                </Box>
                            </Box>
                          )
                      },
                      sortable: true,
                  }
              ]}
            />
        </Box>
    )
}
