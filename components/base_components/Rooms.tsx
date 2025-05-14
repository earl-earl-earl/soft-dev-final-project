import React, { useState, useEffect } from "react";
// import Link from 'next/link';
import styles from "../component_styles/Rooms.module.css";

type RoomStatus = "Occupied" | "Vacant";

interface Occupant {
  name: string;
}

interface Room {
  id: string;
  name: string;
  roomNumber: string;
  capacity: number;
  lastUpdated: string;
  amenities: string[];
  price: number;
  status: RoomStatus;
  occupant?: Occupant;
  isActive: boolean;
}

interface Stats {
  totalRooms: number;
  totalRoomsChange: number;
  occupied: number;
  occupiedChange: number;
  available: number;
  availableChange: number;
}

const RoomDashboard: React.FC = () => {
  const [statsAnimate, setStatsAnimate] = useState(false);

  const statsData: Stats = {
    totalRooms: 6,
    totalRoomsChange: 30,
    occupied: 3,
    occupiedChange: -8,
    available: 3,
    availableChange: 69,
  };

  const roomsData: Room[] = [
    {
      id: "001",
      name: "Emil",
      roomNumber: "#001",
      capacity: 4,
      lastUpdated: "May 07, 2024",
      amenities: ["Free Entrance", "Breakfast for 4"],
      price: 3500.0,
      status: "Occupied",
      occupant: { name: "Lozada, Daven J." },
      isActive: true,
    },
    {
      id: "002",
      name: "Ohana",
      roomNumber: "#002",
      capacity: 2,
      lastUpdated: "May 07, 2024",
      amenities: ["Free Entrance", "Breakfast for 2"],
      price: 2000.0,
      status: "Occupied",
      occupant: { name: "Segura, Paul J." },
      isActive: true,
    },
    {
      id: "003",
      name: "Kyle",
      roomNumber: "#003",
      capacity: 6,
      lastUpdated: "May 07, 2024",
      amenities: ["Free Entrance", "Breakfast for 6"],
      price: 5000.0,
      status: "Vacant",
      isActive: true,
    },
    {
      id: "004",
      name: "Phillip",
      roomNumber: "#004",
      capacity: 4,
      lastUpdated: "May 07, 2024",
      amenities: ["Free Entrance", "Breakfast for 4"],
      price: 3500.0,
      status: "Vacant",
      isActive: true,
    },
    {
      id: "005",
      name: "Camille",
      roomNumber: "#005",
      capacity: 3,
      lastUpdated: "May 07, 2024",
      amenities: ["Free Entrance", "Breakfast for 3"],
      price: 3000.0,
      status: "Occupied",
      occupant: { name: "James, LeBron" },
      isActive: true,
    },
    {
      id: "006",
      name: "Bungalow",
      roomNumber: "#006",
      capacity: 10,
      lastUpdated: "May 07, 2024",
      amenities: ["Free Entrance for 10"],
      price: 7000.0,
      status: "Vacant",
      isActive: true,
    },
    {
      id: "007",
      name: "Serenity",
      roomNumber: "#007",
      capacity: 2,
      lastUpdated: "May 07, 2024",
      amenities: ["Free Entrance", "Breakfast for 2", "Ocean View"],
      price: 2500.0,
      status: "Occupied",
      occupant: { name: "Garcia, Maria L." },
      isActive: true,
    },
    {
      id: "008",
      name: "Harmony",
      roomNumber: "#008",
      capacity: 5,
      lastUpdated: "May 07, 2024",
      amenities: ["Free Entrance", "Breakfast for 5", "Private Balcony"],
      price: 4500.0,
      status: "Vacant",
      isActive: true,
    },
    {
      id: "009",
      name: "Tranquil",
      roomNumber: "#009",
      capacity: 3,
      lastUpdated: "May 07, 2024",
      amenities: ["Free Entrance", "Breakfast for 3", "Garden Access"],
      price: 3200.0,
      status: "Occupied",
      occupant: { name: "Santos, Juan C." },
      isActive: true,
    },
    {
      id: "010",
      name: "Oasis",
      roomNumber: "#010",
      capacity: 4,
      lastUpdated: "May 07, 2024",
      amenities: ["Free Entrance", "Breakfast for 4", "Pool Access"],
      price: 3800.0,
      status: "Vacant",
      isActive: true,
    },
    {
      id: "011",
      name: "Sunshine",
      roomNumber: "#011",
      capacity: 2,
      lastUpdated: "May 07, 2024",
      amenities: ["Free Entrance", "Breakfast for 2", "Terrace Access"],
      price: 2200.0,
      status: "Occupied",
      occupant: { name: "Reyes, Ana B." },
      isActive: true,
    },
    {
      id: "012",
      name: "Paradise",
      roomNumber: "#012",
      capacity: 8,
      lastUpdated: "May 07, 2024",
      amenities: ["Free Entrance", "Breakfast for 8", "BBQ Area"],
      price: 6500.0,
      status: "Vacant",
      isActive: true,
    },
    {
      id: "013",
      name: "Horizon",
      roomNumber: "#013",
      capacity: 6,
      lastUpdated: "May 07, 2024",
      amenities: ["Free Entrance", "Breakfast for 6", "Sunset View"],
      price: 5200.0,
      status: "Occupied",
      occupant: { name: "Cruz, Ricardo D." },
      isActive: true,
    },
    {
      id: "014",
      name: "Breeze",
      roomNumber: "#014",
      capacity: 4,
      lastUpdated: "May 07, 2024",
      amenities: ["Free Entrance", "Breakfast for 4", "Beach Front"],
      price: 4000.0,
      status: "Vacant",
      isActive: true,
    },
    {
      id: "015",
      name: "Summit",
      roomNumber: "#015",
      capacity: 3,
      lastUpdated: "May 07, 2024",
      amenities: ["Free Entrance", "Breakfast for 3", "Mountain View"],
      price: 3300.0,
      status: "Occupied",
      occupant: { name: "Lim, Margaret T." },
      isActive: true,
    },
    {
      id: "016",
      name: "Retreat",
      roomNumber: "#016",
      capacity: 12,
      lastUpdated: "May 07, 2024",
      amenities: [
        "Free Entrance for 12",
        "Breakfast for 12",
        "Private Kitchen",
      ],
      price: 9000.0,
      status: "Vacant",
      isActive: true,
    },
    {
      id: "017",
      name: "Waterfall",
      roomNumber: "#017",
      capacity: 5,
      lastUpdated: "May 07, 2024",
      amenities: ["Free Entrance", "Breakfast for 5", "Natural Spring View"],
      price: 4800.0,
      status: "Occupied",
      occupant: { name: "Mendoza, Carlos F." },
      isActive: true,
    },
    {
      id: "018",
      name: "Forest",
      roomNumber: "#018",
      capacity: 7,
      lastUpdated: "May 07, 2024",
      amenities: ["Free Entrance", "Breakfast for 7", "Nature Trail Access"],
      price: 6200.0,
      status: "Vacant",
      isActive: true,
    },
    {
      id: "019",
      name: "Sanctuary",
      roomNumber: "#019",
      capacity: 3,
      lastUpdated: "May 07, 2024",
      amenities: ["Free Entrance", "Breakfast for 3", "Meditation Garden"],
      price: 3700.0,
      status: "Vacant",
      isActive: true,
    },
  ];

  const [rooms, setRooms] = useState<Room[]>(roomsData);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setStatsAnimate(false);
    const timer = setTimeout(() => setStatsAnimate(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setAnimate(false);
    const timer = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(timer);
  }, [currentPage, searchTerm]);

  const filteredRooms = rooms.filter(
    (room) =>
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roomsPerPage = 6;
  const indexOfLastRoom = currentPage * roomsPerPage;
  const indexOfFirstRoom = indexOfLastRoom - roomsPerPage;
  const currentRooms = filteredRooms.slice(indexOfFirstRoom, indexOfLastRoom);
  const totalPages = Math.ceil(filteredRooms.length / roomsPerPage);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleEdit = (roomId: string) => {
    console.log(`Editing room ${roomId}`);
    // edit functionality
  };

  const handleDeactivate = (roomId: string) => {
    if (window.confirm("Are you sure you want to deactivate this room?")) {
      const updatedRooms = rooms.map((room) =>
        room.id === roomId ? { ...room, isActive: !room.isActive } : room
      );
      setRooms(updatedRooms);
    }
  };

  const handleAddRoom = () => {
    console.log("Adding a new room");
    // Here you would typically:
    // 1. Show a modal form
    // 2. Handle form submission
    // 3. Add the new room to the rooms state
  };

  const isSingleRow = currentRooms.length <= 3;

  return (
    <div className={styles.roomDashboard}>
      <div className={styles.statsContainer}>
        <StatsCard
          title="Total Rooms"
          value={statsData.totalRooms}
          change={statsData.totalRoomsChange}
          isPositive={statsData.totalRoomsChange > 0}
          animate={statsAnimate}
        />
        <StatsCard
          title="Occupied"
          value={statsData.occupied}
          change={statsData.occupiedChange}
          isPositive={statsData.occupiedChange > 0}
          animate={statsAnimate}
        />
        <StatsCard
          title="Available Rooms"
          value={statsData.available}
          change={statsData.availableChange}
          isPositive={statsData.availableChange > 0}
          animate={statsAnimate}
        />
      </div>

      <div className={styles.topContent}>
        <div className={styles.roomsHeader}>
          <h2>Rooms</h2>
          <div className={styles.headerActions}>
            <div className={styles.searchContainer}>
              <div className={styles.searchBar}>
                <i className={`fa-regular fa-magnifying-glass ${styles.searchIcon}`}></i>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search rooms"
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
              <button className={styles.filterButton}>
                <i className="fa-regular fa-filter"></i>
                <span className={styles.tooltipText}>Filter</span>
              </button>
            </div>
            <button className={styles.newRoomButton} onClick={handleAddRoom}>
              <i className="fa-regular fa-plus"></i> New Room
            </button>
          </div>
        </div>
        <div
          className={`${styles.roomsGrid} ${
            isSingleRow ? styles.singleRowGrid : ""
          } ${animate ? styles.fadeIn : ""}`}
          key={currentPage + searchTerm}
        >
          {currentRooms.length > 0 ? (
            currentRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onEdit={() => handleEdit(room.id)}
                onDeactivate={() => handleDeactivate(room.id)} // Changed from onDelete
              />
            ))
          ) : (
            <div className={styles.noRoomsMessage}>
              {rooms.length === 0 ? (
                <p>No rooms available</p>
              ) : (
                <p>No rooms matching your search</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={styles.pagination}>
        <button
          className={styles.paginationButton}
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        >
          <i className="fa-regular fa-angle-left"></i> Previous
        </button>

        <div className={styles.pageNumbers}>
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              className={`${styles.pageNumber} ${
                currentPage === index + 1 ? styles.active : ""
              }`}
              onClick={() => setCurrentPage(index + 1)}
            >
              {index + 1}
            </button>
          ))}
        </div>

        <button
          className={styles.paginationButton}
          disabled={currentPage === totalPages}
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
        >
          Next <i className="fa-regular fa-angle-right"></i>
        </button>
      </div>
    </div>
  );
};

interface StatsCardProps {
  title: string;
  value: number;
  change: number;
  isPositive: boolean;
  animate?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  isPositive,
  animate = false,
}) => (
  <div className={`${styles.statsCard} ${animate ? styles.animate : ""}`}>
    <h3>{title}</h3>
    <div className={styles.statsValue}>{value}</div>
    <div
      className={`${styles.statsChange} ${
        isPositive ? styles.positive : styles.negative
      }`}
    >
      <i className={`fa-regular fa-arrow-${isPositive ? "up" : "down"}`}></i>
      {Math.abs(change)}% vs last month
    </div>
  </div>
);

interface RoomCardProps {
  room: Room;
  onEdit: () => void;
  onDeactivate: () => void; // Changed from onDelete
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onEdit, onDeactivate }) => (
  <div className={`${styles.roomCard} ${!room.isActive ? styles.deactivated : ""}`}>
    <div className={styles.roomContent}>
      {/* Left Column */}
      <div className={styles.leftColumn}>
        <div className={styles.roomTitle}>
          <h3>
            {room.name}{" "}
            <span className={styles.roomNumber}>{room.roomNumber}</span>
          </h3>
          <p className={styles.lastUpdated}>Last Updated: {room.lastUpdated}</p>
        </div>

        <div className={styles.amenitiesSection}>
          <h4>Amenities</h4>
          <ul className={styles.amenitiesList}>
            {room.amenities.map((amenity, index) => (
              <li key={index}>
                <i className="fa-regular fa-check"></i> {amenity}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.roomStatus}>
          <span
            className={`${styles.status} ${
              room.status === "Occupied" ? styles.occupied : styles.vacant
            }`}
          >
            {room.status}
          </span>
          {room.occupant && (
            <span className={styles.occupantName}>&nbsp;• {room.occupant.name}</span>
          )}
        </div>
      </div>

      <div className={styles.rightColumn}>
        <div className={styles.roomCapacity}>
          <span>Capacity</span>
          <div className={styles.capacityValue}>{room.capacity}</div>
        </div>

        <div className={styles.priceSection}>
          <div className={styles.roomPrice}>
            <span className={styles.currency}>PHP </span>
            <span className={styles.priceValue}>
              {room.price.toLocaleString()}.00
            </span>
          </div>
        </div>

        <div className={styles.roomActions}>
          <button className={styles.editButton} onClick={onEdit}>
            <i className="fa-regular fa-pen-to-square"></i>
            <span className={styles.tooltipText}>Edit</span>
          </button>
          <button className={styles.deactivateButton} onClick={onDeactivate}>
            <i className={`fa-regular ${room.isActive ? "fa-circle-minus" : "fa-circle-plus"}`}></i>
            <span className={styles.tooltipText}>
              {room.isActive ? "Deactivate" : "Activate"}
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default RoomDashboard;
