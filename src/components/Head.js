import {Anchor, Avatar, Header, Nav} from "grommet";
import React from "react";
import useSubject from "../data/useSubject";
import dataStore from "../data/data";

const logo =`${process.env.PUBLIC_URL}/component.png`;

export const Head = () => {
    const blockNumber = useSubject(dataStore.blockNumber)
    return (
        <Header pad="small">
            <Avatar src={logo}/>
            <Nav direction="row">
                <Anchor label={`Take part`} href="https://component.finance" target="_blank"/>
                <Anchor color="primary" label={`Synced at block #${blockNumber || 'fetching'}`}/>
            </Nav>
        </Header>
    )
}