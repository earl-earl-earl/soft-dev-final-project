import React, { useState, useEffect } from "react";
import Link from "next/link";
import styles from "../component_styles/Dashboard.module.css";

// Add role prop to component
interface DashboardProps {
  role: string;
}

// Update component definition to accept props
const Dashboard: React.FC<DashboardProps> = ({ role }) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(false);
    const timer = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const roomStats = {
    totalRooms: 19,
    totalRoomsChange: 30,
    occupied: 9,
    occupiedChange: -8,
    available: 10,
    availableChange: 69,
  };

  const recentRooms = [
    {
      id: "001",
      name: "Emil",
      capacity: 4,
      price: 3500.0,
      status: "Occupied",
      occupant: { name: "Lozada, Daven J." },
    },
    {
      id: "002",
      name: "Ohana",
      capacity: 2,
      price: 2000.0,
      status: "Occupied",
      occupant: { name: "Segura, Paul J." },
    },
    {
      id: "003",
      name: "Kyle",
      capacity: 6,
      price: 5000.0,
      status: "Vacant",
    },
  ];

  const reservationStats = {
    checkIns: "32",
    checkOuts: "29", 
    totalGuests: "24",
    occupancyRate: "63%",
  };

  const recentReservations = [
    {
      id: "A1701",
      name: "Lozada, Daven Jerthrude",
      room: "Resthouse",
      checkIn: "May 05, 2025",
      status: "Accepted",
    },
    {
      id: "A1189",
      name: "Ledesma, Marben Jhon",
      room: "Ohana",
      checkIn: "May 06, 2025",
      status: "Accepted",
    },
    {
      id: "A1669",
      name: "Rafael, Earl John",
      room: "Camille",
      checkIn: "May 02, 2025",
      status: "Accepted",
    },
  ];

  recentReservations.sort((a, b) => {
    return new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime();
  });

  const recentStaff = [
    {
      id: "id-1",
      username: "user1",
      name: "Name 1",
      position: "Staff",
    },
    {
      id: "id-2",
      username: "user2",
      name: "Name 2",
      position: "Staff",
    },
    {
      id: "id-3",
      username: "user3",
      name: "Name 3",
      position: "Staff",
    },
  ];

  const recentAdmins = [
    {
      id: "id-1",
      username: "admin1",
      name: "Admin 1",
      position: "Admin",
    },
    {
      id: "id-2",
      username: "admin2",
      name: "Admin 2",
      position: "Admin",
    },
    {
      id: "id-3",
      username: "admin3",
      name: "Admin 3",
      position: "Admin",
    },
  ];

  // const recentGuests = [
  //   {
  //     userId: "USR001",
  //     name: "Ledesma, Marben Jhon",
  //     room: "Ohana",
  //     isActive: true,
  //   },
  //   {
  //     userId: "USR003",
  //     name: "Rafael, Earl John",
  //     room: "Camille",
  //     isActive: true,
  //   },
  //   {
  //     userId: "USR005",
  //     name: "Segura, Paul Justin",
  //     room: "Kyle",
  //     isActive: true,
  //   },
  // ];

  return (
    <div className={`${styles.dashboardContainer} ${animate ? styles.fadeIn : ""}`}>
      
      <section className={styles.dashboardSection}>
        <div className={styles.sectionHeader}>
          <h2>Rooms Overview</h2>
          <Link href="/rooms" className={styles.seeMoreButton}>
            <span>See All Rooms</span>
            <i className="fa-regular fa-arrow-right"></i>
          </Link>
        </div>
        
        <div className={styles.statsCards}>
          <div className={styles.statsCard}>
            <h3>Total Rooms</h3>
            <div className={styles.statsValue}>{roomStats.totalRooms}</div>
            <div className={`${styles.statsChange} ${styles.positive}`}>
              <i className="fa-regular fa-arrow-up"></i>
              {Math.abs(roomStats.totalRoomsChange)}% vs last month
            </div>
          </div>
          
          <div className={styles.statsCard}>
            <h3>Occupied</h3>
            <div className={styles.statsValue}>{roomStats.occupied}</div>
            <div className={`${styles.statsChange} ${styles.negative}`}>
              <i className="fa-regular fa-arrow-down"></i>
              {Math.abs(roomStats.occupiedChange)}% vs last month
            </div>
          </div>
          
          <div className={styles.statsCard}>
            <h3>Available Rooms</h3>
            <div className={styles.statsValue}>{roomStats.available}</div>
            <div className={`${styles.statsChange} ${styles.positive}`}>
              <i className="fa-regular fa-arrow-up"></i>
              {Math.abs(roomStats.availableChange)}% vs last month
            </div>
          </div>
        </div>
        
        <div className={styles.quickRoomView}>
          {recentRooms.map((room) => (
            <div key={room.id} className={styles.roomCard}>
              <div className={styles.roomHeader}>
                <h3>{room.name}</h3>
                <div className={styles.roomCapacity}>
                  <span>Capacity</span>
                  <div className={styles.capacityValue}>{room.capacity}</div>
                </div>
              </div>
              <div className={styles.roomFooter}>
                <span className={`${styles.status} ${room.status === "Occupied" ? styles.occupied : styles.vacant}`}>
                  {room.status}
                </span>
                {room.occupant && <span className={styles.occupantName}> {room.occupant.name}</span>}
                <div className={styles.roomPrice}>
                  <span>PHP {room.price.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.dashboardSection}>
        <div className={styles.sectionHeader}>
          <h2>Recent Reservations</h2>
          <Link href="/reservations" className={styles.seeMoreButton}>
            <span>See All Reservations</span>
            <i className="fa-regular fa-arrow-right"></i>
          </Link>
        </div>
        
        <div className={styles.statsCardsHorizontal}>
          <div className={styles.statCardHorizontal}>
            <p className={styles.statTitle}>Check-ins</p>
            <div className={styles.statValueContainer}>
              <h3 className={styles.statValue}>{reservationStats.checkIns}</h3>
              <i className="fa-regular fa-person-to-portal"></i>
            </div>
          </div>
          
          <div className={styles.statCardHorizontal}>
            <p className={styles.statTitle}>Check-outs</p>
            <div className={styles.statValueContainer}>
              <h3 className={styles.statValue}>{reservationStats.checkOuts}</h3>
              <i className="fa-regular fa-person-from-portal"></i>
            </div>
          </div>
          
          <div className={styles.statCardHorizontal}>
            <p className={styles.statTitle}>Total Guests</p>
            <div className={styles.statValueContainer}>
              <h3 className={styles.statValue}>{reservationStats.totalGuests}</h3>
              <i className="fa-regular fa-people-simple"></i>
            </div>
          </div>
          
          <div className={styles.statCardHorizontal}>
            <p className={styles.statTitle}>Occupancy Rate</p>
            <div className={styles.statValueContainer}>
              <h3 className={styles.statValue}>{reservationStats.occupancyRate}</h3>
              <i className="fa-regular fa-chart-line"></i>
            </div>
          </div>
        </div>
        
        <div className={styles.tableContainer}>
          <table className={styles.dashboardTable}>
            <thead>
              <tr>
                <th>Res. ID</th>
                <th>Guest Name</th>
                <th>Room</th>
                <th>Check-in</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentReservations.map((reservation) => {
                let statusClass = '';
                
                if (reservation.status === 'Accepted') {
                  statusClass = styles.statusAccepted;
                } else if (reservation.status === 'Pending') {
                  statusClass = styles.statusPending;
                } else if (reservation.status === 'Cancelled') {
                  statusClass = styles.statusCancelled;
                } else if (reservation.status === 'Rejected') {
                  statusClass = styles.statusRejected;
                } else if (reservation.status === 'Expired') {
                  statusClass = styles.statusExpired;
                } else if (reservation.status === 'Confirmed_Pending_Payment') {
                  statusClass = styles.statusConfirmedPendingPayment;
                }
                
                return (
                  <tr key={reservation.id}>
                    <td>{reservation.id}</td>
                    <td>{reservation.name}</td>
                    <td>{reservation.room}</td>
                    <td>{reservation.checkIn}</td>
                    <td>
                      <span className={`${styles.statusPill} ${statusClass}`}>
                        {reservation.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className={`${(role === 'admin' || role === 'super_admin') 
        ? styles.twoColumnSection 
        : styles.fullWidthSection}`}>
        
        {/* Staff section - visible to all roles */}
        <section className={styles.dashboardSectionHalf}>
          <div className={styles.sectionHeader}>
            <h2>Staff Overview</h2>
            <Link href="/staff" className={styles.seeMoreButton}>
              <span>See All Staff</span>
              <i className="fa-regular fa-arrow-right"></i>
            </Link>
          </div>
          
          <div className={styles.tableContainer}>
            <table className={styles.dashboardTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Position</th>
                </tr>
              </thead>
              <tbody>
                {recentStaff.map((staff) => (
                  <tr key={staff.id}>
                    <td>{staff.name}</td>
                    <td>{staff.username}</td>
                    <td>{staff.position}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Admin section - only visible to admin and super_admin */}
        {(role === 'admin' || role === 'super_admin') && (
          <section className={styles.dashboardSectionHalf}>
            <div className={styles.sectionHeader}>
              <h2>Admin Overview</h2>
              <Link href="/admins" className={styles.seeMoreButton}>
                <span>See All Admins</span>
                <i className="fa-regular fa-arrow-right"></i>
              </Link>
            </div>
            
            <div className={styles.tableContainer}>
              <table className={styles.dashboardTable}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Position</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAdmins.map((admin) => (
                    <tr key={admin.id}>
                      <td>{admin.name}</td>
                      <td>{admin.username}</td>
                      <td>{admin.position}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Dashboard;