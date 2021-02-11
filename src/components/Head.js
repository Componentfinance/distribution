import {Anchor, Avatar, Header, Nav} from "grommet";
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
  }
`;

export const Head = () => {
    const blockNumber = useSubject(dataStore.blockNumber)
    return (
        <Header pad="small">
            <Avatar src={logo}/>
            <StyledNav direction="row">
                <Anchor label={`Take part`} href="https://component.finance" target="_blank"/>
                <Anchor color="primary" label={`Synced at block #${blockNumber || 'fetching'}`}/>
            </StyledNav>
        </Header>
    )
}
