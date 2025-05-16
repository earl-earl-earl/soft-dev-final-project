/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import styles from '../../components/component_styles/Dashboard.module.css';

interface Column {
  key: string;
  header: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  keyField: string;
}

const DataTable: React.FC<DataTableProps> = ({ columns, data, keyField }) => {
  return (
    <div className={styles.tableContainer}>
      <table className={styles.dashboardTable}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row[keyField]}>
              {columns.map((column) => (
                <td key={`${row[keyField]}-${column.key}`}>
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;