import React from 'react';
import styles from '../../../components/component_styles/Dashboard.module.css';
import { StaffData } from '../../../src/types/dashboard';
import SectionHeader from '../../../components/common/SectionHeader';
import DataTable from '../../../components/common/DataTable';

interface StaffOverviewProps {
  staffData: StaffData[];
}

const StaffOverview: React.FC<StaffOverviewProps> = ({ staffData }) => {
  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'username', header: 'Username' },
    { key: 'position', header: 'Position' }
  ];

  return (
    <section className={styles.dashboardSectionHalf}>
      <SectionHeader 
        title="Staff Overview"
        linkHref="/staff"
        linkText="See All Staff"
      />
      
      <DataTable 
        columns={columns}
        data={staffData}
        keyField="id"
      />
    </section>
  );
};

export default StaffOverview;