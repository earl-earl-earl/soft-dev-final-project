import React from 'react';
import styles from '../../../components/component_styles/Dashboard.module.css';
import { AdminData } from '../../../src/types/dashboard';
import SectionHeader from '../../../components/common/SectionHeader';
import DataTable from '../../../components/common/DataTable';

interface AdminOverviewProps {
  adminData: AdminData[];
}

const AdminOverview: React.FC<AdminOverviewProps> = ({ adminData }) => {
  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'username', header: 'Username' },
    { key: 'position', header: 'Position' }
  ];

  return (
    <section className={styles.dashboardSectionHalf}>
      <SectionHeader 
        title="Admin Overview"
        linkHref="/admins"
        linkText="See All Admins"
      />
      
      <DataTable 
        columns={columns}
        data={adminData}
        keyField="id"
      />
    </section>
  );
};

export default AdminOverview;