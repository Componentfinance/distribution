import styled from 'styled-components';
import {DataTable} from 'grommet';

export const DataTableCustom = styled(DataTable)`
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
    }
    td:last-child {
      flex: 1 1 150px;
    }
    tr {
      display: flex;
      flex-wrap: wrap;
      width: 100%;
      margin-bottom: 10px;
      background: rgba(255,255,255,0.4);
    }
  }
`;
