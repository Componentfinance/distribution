import React, { Component } from "react";
import { render } from "react-dom";

import { Box, Grommet, Heading } from "grommet";
import { grommet } from "grommet/themes";
import { Distribution } from "./components/Distribution";



class App extends Component {
    render() {
        return (
            <Grommet theme={grommet}>
                <Box align="center" pad="large">
                    <Heading level="3">Realtime Component LP rewards distribution</Heading>
                </Box>
                <Distribution />
            </Grommet>
        );
    }
}

render(<App />, document.getElementById("root"));
