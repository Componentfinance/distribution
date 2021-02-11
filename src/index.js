import React, { Component } from "react";
import { render } from "react-dom";
import styled from 'styled-components'

import { Box, Grommet, Heading } from "grommet";
import { grommet } from "grommet/themes";
import { Distribution } from "./components/Distribution";
import { Head } from "./components/Head";
import "normalize.css/normalize.css";


const Styled = styled.div`
  background: radial-gradient(circle at top, #fff -0%, rgb(242, 193, 241), rgba(203, 0, 255, 0.18)) fixed;
  min-height: 100vh;
`

class App extends Component {
    render() {
        return (
            <Grommet theme={grommet}>
                <Styled>
                    <Head />
                    <Box align="center" pad="none">
                        <Heading level="3">Component LP rewards distribution</Heading>
                    </Box>
                    <Distribution />
                </Styled>
            </Grommet>
        );
    }
}

render(<App />, document.getElementById("root"));
