import React from "react";

import {Box, DataTable, Meter, Stack, Text} from "grommet";
import dataStore from "../data/data";
import useSubject from "../data/useSubject";
import { isMobile } from "react-device-detect";

export const Distribution = () => {
    const balances = useSubject(dataStore.distribution)
    return (
        <>
        <Box align='center'>
            <DataTable
            columns={[
                {
                    property: 'id',
                    header: <Text>#</Text>,
                    primary: true,
                },
                {
                    property: 'address',
                    header: <Text>Address</Text>,
                    render: datum => <Text style={{ fontFamily: 'monospace', fontSize: isMobile ? "8px" : '12px' }}>{datum.address}</Text>,
                },
                {
                    property: 'distribution',
                    header: 'Distribution',
                    render: datum => (
                        <Stack anchor="center">
                            <Box>
                                <Meter
                                    values={[{ value: datum.distributionPercent }]}
                                    thickness="medium"
                                    size="medium"
                                />
                            </Box>
                            <Box direction="row" align="center" pad={{ bottom: 'xsmall' }}>
                                <Text size="xlarge" weight="bold">
                                    {datum.distributionPercent}
                                </Text>
                                <Text size="small">%</Text>
                            </Box>
                        </Stack>
                    ),
                },
            ]}
            data={balances}
        />
        </Box>
        </>
    )
}
