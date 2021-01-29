import React, { Component } from "react";
import { render } from "react-dom";

import { Box, Grommet, Heading } from "grommet";
import { grommet } from "grommet/themes";
import { Distribution } from "./components/Distribution";
import { Head } from "./components/Head";


class App extends Component {
    render() {
        return (
            <Grommet theme={grommet}>
                <Head />
                <Box align="center" pad={{ bottom:"large" }}>
                    <Heading level="3">Realtime Component LP rewards distribution</Heading>
                </Box>
                <Distribution />
            </Grommet>
        );
    }
}

render(<App />, document.getElementById("root"));
