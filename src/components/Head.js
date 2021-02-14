import {Anchor, Avatar, Box, Header, Nav, Text} from 'grommet';
import React from "react";
import useSubject from "../data/useSubject";
import dataStore from "../data/data";
import styled from 'styled-components';

const logo =`${process.env.PUBLIC_URL}/component.png`;

const StyledNav = styled(Nav)`
  @media screen and (max-width: 600px) {
    display: flex;
    flex-direction: column;
    text-align: right;
    font-size: 16px;
  }
`;

const StyledHeader = styled(Header)`
  margin: 0 auto 0 0;
  max-width: 925px;
  width: 100%;
  @media screen and (max-width: 600px) {
    font-size: 18px;
  }
`;

const StyledLogoText = styled(Text)`
  margin-left: 1em;
  font-weight: bold;
  font-size: 24px;
  color: #000;
  font-family: 'Metric', Arial, sans-serif;
  @media screen and (max-width: 600px) {
    display: none;
  }
`

export const Head = () => {
    const blockNumber = useSubject(dataStore.blockNumber)
    return (
        <StyledHeader pad={{'vertical': 'medium', 'horizontal': 'small'}}>
            <Box direction="row" align="center">
              <Avatar src={logo}/>
              <StyledLogoText>component</StyledLogoText>
            </Box>
            <StyledNav direction="row">
                <Anchor style={{textDecoration: 'underline', color: 'rgb(255, 66, 161)'}} label={`Mint USDP`} href="https://unit.xyz" target="_blank"/>
                <Anchor style={{textDecoration: 'underline', color: 'rgb(255, 66, 161)'}} label={`Add liquidity`} href="https://component.finance" target="_blank"/>
                <Anchor color="primary" label={`Synced at block #${blockNumber || 'fetching'}`}/>
            </StyledNav>
        </StyledHeader>
    )
}
