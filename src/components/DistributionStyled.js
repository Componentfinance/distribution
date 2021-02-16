import styled from 'styled-components';
import {DataTable} from 'grommet';

export const DataTableCustom = styled(DataTable)`
  min-width: 100%;
  margin: 0 auto;
  thead {
    font-weight: bold;
  }
  @media screen and (max-width: 600px) {
    display: flex;
    thead {
      display: none;
    }
    tbody {
      display: flex;
      flex-direction: column;
      width: 100%;
    }
    td:nth-child(2) {
      flex-grow: 1;
      text-align: center;
      span {
        font-size: 15px;
      }
    }
    td:nth-child(3) {
      span {
        font-size: 16px;
      }
    }
    td:nth-child(4) {
      display: none;
    }
    td:last-child {
      flex: 1 1 150px;
    }
    td:last-child div {
      justify-content: center;
    }
    tr {
      display: flex;
      flex-wrap: wrap;
      width: 100%;
      margin-bottom: 20px;
      background: rgba(255,255,255,0.4);
    }
    tr:first-child {
      margin-top: 20px
    }
  }
`;
