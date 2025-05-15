import React, { useState, useEffect } from "react";
// import Link from 'next/link';
import styles from "../component_styles/Rooms.module.css";
import RoomFilterOverlay, { RoomFilterOptions } from "../overlay_components/RoomFilterOverlay";
import AddRoomOverlay, { RoomFormData } from "../overlay_components/AddRoomOverlay";
import EditRoomOverlay from "../overlay_components/EditRoomOverlay";

type RoomStatus = "Occupied" | "Vacant";

interface Reservation {
  checkIn: Date;
  checkOut: Date;
  guestName: string; // Keep this in case you need it later
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
  reservation?: Reservation; // Replace occupant with reservation
  isActive: boolean;
  [key: string]: unknown;
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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [isEditRoomOpen, setIsEditRoomOpen] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [filterOptions, setFilterOptions] = useState<RoomFilterOptions>({
    minCapacity: '',
    maxCapacity: '',
    minPrice: '',
    maxPrice: '',
    availableFrom: '',
    availableTo: '',
    isActive: 'all',
    sortBy: 'none'
  });

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
      reservation: { 
        guestName: "Lozada, Daven J.",
        checkIn: new Date(2025, 4, 10),
        checkOut: new Date(2025, 4, 15)
      },
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
      reservation: { 
        guestName: "Segura, Paul J.",
        checkIn: new Date(2025, 4, 10),
        checkOut: new Date(2025, 4, 15)
      },
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
    }
  ];

  const [rooms, setRooms] = useState<Room[]>(roomsData);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Occupied" | "Vacant">("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [animate, setAnimate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setStatsAnimate(false);
    const timer = setTimeout(() => setStatsAnimate(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setAnimate(false);
    const timer = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(timer);
  }, [currentPage, searchTerm, statusFilter]); // Add statusFilter dependency

  // Update the filteredRooms calculation to include the additional filters:
  let filteredRooms = rooms.filter(
    (room) => {
      // Status filter (existing)
      if (statusFilter !== "all" && room.status !== statusFilter) return false;
      
      // Search term filter (existing)
      if (searchTerm && !room.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Capacity filter
      if (filterOptions.minCapacity && room.capacity < parseInt(filterOptions.minCapacity)) return false;
      if (filterOptions.maxCapacity && room.capacity > parseInt(filterOptions.maxCapacity)) return false;
      
      // Price filter
      if (filterOptions.minPrice && room.price < parseInt(filterOptions.minPrice)) return false;
      if (filterOptions.maxPrice && room.price > parseInt(filterOptions.maxPrice)) return false;
      
      // Active status filter
      if (filterOptions.isActive === 'active' && !room.isActive) return false;
      if (filterOptions.isActive === 'inactive' && room.isActive) return false;
      
      // Date availability filter - only apply to vacant rooms for simplicity
      if (filterOptions.availableFrom && filterOptions.availableTo) {
        const fromDate = new Date(filterOptions.availableFrom);
        const toDate = new Date(filterOptions.availableTo);
        
        if (room.status === "Occupied" && room.reservation) {
          // Room must be vacant during the entire requested period
          const checkIn = new Date(room.reservation.checkIn);
          const checkOut = new Date(room.reservation.checkOut);
          
          // Check if reservation overlaps with requested period
          if (checkOut > fromDate && checkIn < toDate) {
            return false;
          }
        }
      }
      
      return true;
    }
  );

  // 3. Apply sorting after filtering
  if (filterOptions.sortBy !== 'none') {
    filteredRooms = [...filteredRooms].sort((a, b) => {
      switch (filterOptions.sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'id_asc':
          return a.id.localeCompare(b.id);
        case 'id_desc':
          return b.id.localeCompare(a.id);
        default:
          return 0;
      }
    });
  }

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
    const roomToEdit = rooms.find(room => room.id === roomId);
    if (roomToEdit) {
      setCurrentRoom(roomToEdit);
      setIsEditRoomOpen(true);
    }
  };

  const handleDeactivate = (roomId: string) => {
    if (window.confirm("Are you sure you want to deactivate this room?")) {
      const updatedRooms = rooms.map((room) =>
        room.id === roomId ? { ...room, isActive: !room.isActive } : room
      );
      setRooms(updatedRooms);
    }
  };

  const handleAddRoomSubmit = async (roomData: RoomFormData) => {
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roomData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle validation errors
        if (data.details) {
          setFormErrors(data.details);
          setError('Please fix the errors in the form');
        } else {
          setError(data.error || 'Failed to add room');
        }
        return;
      }
      
      // Success - add the new room to the UI
      setRooms([...rooms, data]);
      setIsAddRoomOpen(false);
      
      // Show success message
      // (implement your success notification logic here)
      
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    }
  };

  const handleEditRoomSubmit = async (roomData: RoomFormData) => {
    try {
      if (!currentRoom) return;
      
      // Skip API call - update UI directly (for testing/development)
      const updatedRooms = rooms.map(room => 
        room.id === currentRoom.id ? {
          ...room,
          name: roomData.name,
          roomNumber: roomData.roomNumber,
          capacity: roomData.capacity,
          price: roomData.price,
          amenities: roomData.amenities,
          isActive: roomData.isActive,
          lastUpdated: new Date().toLocaleDateString('en-US', {
            month: 'long',
            day: '2-digit',
            year: 'numeric'
          })
        } : room
      );
      
      setRooms(updatedRooms);
      setIsEditRoomOpen(false);
      setCurrentRoom(null);
      
      // Show success notification
      setError(null);
      console.log("Room updated successfully (UI only)");
      
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    }
  };

  const handleAddRoom = () => {
    setIsAddRoomOpen(true);
  };

  const handleApplyFilters = (newFilters: RoomFilterOptions) => {
    setFilterOptions(newFilters);
    setCurrentPage(1); // Reset to first page when applying filters
    setIsFilterOpen(false);
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
              <div className={styles.statusFilter}>
                <button 
                  className={`${styles.statusButton} ${statusFilter === "all" ? styles.activeFilter : ""}`}
                  onClick={() => {
                    setStatusFilter("all");
                    setCurrentPage(1); // Reset to page 1 when filter changes
                  }}
                >
                  All
                </button>
                <button 
                  className={`${styles.statusButton} ${statusFilter === "Occupied" ? styles.activeFilter : ""}`}
                  onClick={() => {
                    setStatusFilter("Occupied");
                    setCurrentPage(1); // Reset to page 1 when filter changes
                  }}
                >
                  Occupied
                </button>
                <button 
                  className={`${styles.statusButton} ${statusFilter === "Vacant" ? styles.activeFilter : ""}`}
                  onClick={() => {
                    setStatusFilter("Vacant");
                    setCurrentPage(1); // Reset to page 1 when filter changes
                  }}
                >
                  Vacant
                </button>
              </div>
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
              <button className={styles.filterButton} onClick={() => setIsFilterOpen(true)}>
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

      <RoomFilterOverlay
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={handleApplyFilters}
        initialFilters={filterOptions}
      />
      
      {error && (
        <div className={styles.errorMessage}>
          <i className="fa-regular fa-exclamation-circle"></i> {error}
          <button onClick={() => setError(null)}>
            <i className="fa-regular fa-times"></i>
          </button>
        </div>
      )}
      
      <AddRoomOverlay 
        isOpen={isAddRoomOpen}
        onClose={() => setIsAddRoomOpen(false)}
        onSubmit={handleAddRoomSubmit}
        existingRooms={rooms}
        formErrors={formErrors}
      />
      
      {currentRoom && (
        <EditRoomOverlay 
          isOpen={isEditRoomOpen}
          onClose={() => setIsEditRoomOpen(false)}
          onSubmit={handleEditRoomSubmit}
          existingRooms={rooms}
          formErrors={formErrors}
          room={currentRoom}
        />
      )}
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

const RoomCard: React.FC<RoomCardProps> = ({ room, onEdit, onDeactivate }) => {
  // Format date function
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
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
            {room.status === "Occupied" && room.reservation && (
              <span className={styles.dateSpan}>
                &nbsp;• {formatDate(room.reservation.checkIn)} - {formatDate(room.reservation.checkOut)}
              </span>
            )}
            {room.status === "Vacant" && (
              <span className={styles.dateSpan}>
                &nbsp;• Available
              </span>
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
              <i className="fa-regular fa-pencil"></i>
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
};

export default RoomDashboard;
