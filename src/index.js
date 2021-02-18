import React, { Component } from "react";
import { render } from "react-dom";
import styled from 'styled-components'

import { Box, Grommet, Heading } from "grommet";
import { Distribution } from "./components/Distribution";
import { Head } from "./components/Head";
import "normalize.css/normalize.css";


const Styled = styled.div`
  background: radial-gradient(circle at top, #fff -0%, rgb(242, 193, 241), rgba(203, 0, 255, 0.18)) fixed;
  min-height: 100vh;
`

const myTheme = {
    tip: {
      content: {
        background: '#fff',
      },
      extend: 'text-align: center',
    },
    table: {
        header: {
            border: false,
        },
    },
    textInput: {
        extend: 'padding: 11px 0 11px 18px',
    },
    text: {
        medium: {
            size: '22px',
        },
    },
    global: {
        drop: {
            background: '#fcefff',
        },
        control: {
            border: {
                color: '#a33ce7',
            },
        },
        focus: {
            border: {
                color: 'rgb(172, 12, 238)',
            },
        },
        font: {
            // family: 'Metric, Arial, sans-serif;',
            family: 'monospace',
            face: `
          @font-face {
            font-family: "Metric";
            src: url("https://hpefonts.s3.amazonaws.com/web/MetricHPE-Web-Regular.woff") format('woff');
          }
          @font-face {
            font-family: "Metric";
            src: url("https://hpefonts.s3.amazonaws.com/web/MetricHPE-Web-Bold.woff") format('woff');
            font-weight: 700;
          }
          @font-face {
            font-family: "Metric";
            src: url("https://hpefonts.s3.amazonaws.com/web/MetricHPE-Web-Semibold.woff") format('woff');
            font-weight: 600;
          }
          @font-face {
            font-family: "Metric";
            src: url("https://hpefonts.s3.amazonaws.com/web/MetricHPE-Web-Light.woff") format('woff');
            font-weight: 100;
          }
        `,
        },
        colors: {
            brand: 'rgb(172, 12, 238)',
            placeholder: 'rgba(203,0,255,0.3)'
        },
    },
}

class App extends Component {
    render() {
        return (
            <Grommet  theme={myTheme}>
                <Styled>
                    <div style={{maxWidth: '950px', margin: '0 auto'}}>
                        <Head />
                        <Box align="center" pad="small">
                            <Heading level="2" style={{marginBottom: '10px'}}>Component LP rewards distribution</Heading>
                        </Box>
                        <Distribution />
                    </div>
                </Styled>
            </Grommet>
        );
    }
}

render(<App />, document.getElementById("root"));
