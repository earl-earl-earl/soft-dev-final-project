import React from 'react';
import styles from './Reservations.module.css';
// No react-icons imports needed

interface StatCardProps {
  title: string;
  value: string;
  dateRange: string;
  valueIconClass?: string; // Changed to valueIconClass
  dateRangeColor?: string;
  dateRangeBg?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, dateRange, valueIconClass, dateRangeColor = '#6c757d', dateRangeBg ='red' }) => {
  return (
    <div className={styles.statCard}>
      <div className={styles.statCardTop}>
        <p className={styles.statTitle}>{title}</p>
        <div className={styles.statValueContainer}>
          <h3 className={styles.statValue}>{value}</h3>
          {valueIconClass && <i className={`${valueIconClass} ${styles.statValueIcon}`}></i>}
        </div>
      </div>
      <div className={styles.statCardBottom} style={{ backgroundColor: dateRangeBg }}>
        <p className={styles.statDateRange} style={{ color: dateRangeColor }}>{dateRange}</p>
      </div>
    </div>
  );
};

interface ReservationItem {
  id: string;
  name: string;
  reservationNo: string;
  room: string;
  checkInDate: string;
  days: string;
  guests: number;
  phone: string;
  status: 'Checked In' | 'Arriving Today' | 'Arrived Late' | 'Pending' | 'Checked out' | 'Cancelled';
}

const reservationsData: ReservationItem[] = [
  { id: '1', name: 'Ledesma, Marben Jhon', reservationNo: 'A1189', room: 'Ohana', checkInDate: 'Tue, 06 May', days: '3D 2N', guests: 3, phone: '0972 786 8762', status: 'Checked In' },
  { id: '2', name: 'Lozada, Daven Jerthrude', reservationNo: 'A1701', room: 'Resthouse', checkInDate: 'Mon, 05 May', days: '4D 3N', guests: 1, phone: '0954 435 5243', status: 'Arriving Today' },
  { id: '3', name: 'Rafael, Earl John', reservationNo: 'A1669', room: 'Camille', checkInDate: 'Fri, 02 May', days: '3D 2N', guests: 1, phone: '0912 653 7887', status: 'Arrived Late' },
  { id: '4', name: 'Recede, Jhon Biancent', reservationNo: 'A1526', room: 'Phillip', checkInDate: 'Wed, 07 May', days: '7D 6N', guests: 2, phone: '0930 546 2123', status: 'Pending' },
  { id: '5', name: 'Segura, Paul Justine', reservationNo: 'A1487', room: 'Kyle', checkInDate: 'Sun, 04 May', days: '4D 3N', guests: 1, phone: '0943 6654 7665', status: 'Checked out' },
  { id: '6', name: 'James, LeBron', reservationNo: 'A1666', room: 'Emil', checkInDate: 'Wed, 07 May', days: '4D 3N', guests: 1, phone: '0965 544 2109', status: 'Cancelled' },
  { id: '7', name: 'Ledesma, Marben Jhon', reservationNo: 'A1189', room: 'Ohana', checkInDate: 'Tue, 06 May', days: '3D 2N', guests: 3, phone: '0972 786 8762', status: 'Checked In' },
  { id: '8', name: 'Lozada, Daven Jerthrude', reservationNo: 'A1701', room: 'Resthouse', checkInDate: 'Mon, 05 May', days: '4D 3N', guests: 1, phone: '0954 435 5243', status: 'Arriving Today' },
];


const Reservations = () => {
  return (
    <div className={styles.container}>
      <div className={styles.headerTabs}>
        <div className={styles.tabs}>
          <button className={`${styles.tabButton} ${styles.activeTab}`}>
            <i className="fa-regular fa-list"></i> All Reservations
          </button>
          <button className={styles.tabButton}>
            <i className="fa-regular fa-mobile"></i> Online Reservations
          </button>
          <button className={styles.tabButton}>
            <i className="fa-regular fa-bell-concierge"></i> Direct Reservations {/* Or fas fa-home */}
          </button>
        </div>
        <button className={styles.newReservationButton}>
          <i className="fa-regular fa-plus"></i> New Reservation
        </button>
      </div>

      <div className={styles.statsCardsContainer}>
        <StatCard
          title="Total Check-ins"
          value="32"
          valueIconClass="fa-regular fa-person-to-portal" // Font Awesome class
          dateRange="From Jan 01, 2025 - April 30, 2025"
          dateRangeColor="#007bff"
          dateRangeBg="#e7f3ff"
        />
        <StatCard
          title="Total Check-outs"
          value="29"
          valueIconClass="fa-regular fa-person-from-portal" // Font Awesome class
          dateRange="From Jan 01, 2025 - April 30, 2025"
          dateRangeColor="#6c757d"
          dateRangeBg="#f8f9fa"
        />
        <StatCard
          title="Total Guests"
          value="24"
          valueIconClass="fa-regular fa-people-simple" // Font Awesome class
          dateRange="From Jan 01, 2025 - April 30, 2025"
          dateRangeColor="#6c757d"
          dateRangeBg="#f8f9fa"
        />
        <StatCard
          title="Occupancy Rate"
          value="24"
          valueIconClass="fa-regular fa-chart-line" // Font Awesome class
          dateRange="From Jan 01, 2025 - April 30, 2025"
          dateRangeColor="#6c757d"
          dateRangeBg="#f8f9fa"
        />
      </div>

      <div className={styles.reservationListSection}>
        <div className={styles.listHeader}>
          <h2 className={styles.listTitle}>Reservation List</h2>
          <div className={styles.listControls}>
            <div className={styles.searchBar}>
              <i className={`fa-regular fa-magnifying-glass ${styles.searchIcon}`}></i>
              <input type="text" placeholder="Search" className={styles.searchInput} />
            </div>
            <button className={styles.filterButton}>
              <i className="fa-regular fa-sliders-up"></i> {/* Font Awesome filter icon */}
            </button>
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.reservationTable}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Reservation No.</th>
                <th>Room</th>
                <th>Check-in Date</th>
                <th>Days</th>
                <th>Guests</th>
                <th>Phone Number</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reservationsData.map(item => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.reservationNo}</td>
                  <td>{item.room}</td>
                  <td>{item.checkInDate}</td>
                  <td>{item.days}</td>
                  <td>{item.guests}</td>
                  <td>{item.phone}</td>
                  <td>
                    <span className={`${styles.statusPill} ${styles[item.status.toLowerCase().replace(/ /g, '')]}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reservations;