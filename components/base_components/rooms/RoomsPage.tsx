import React, { useState, useEffect, useRef } from 'react';
import { useRooms } from '../../../src/hooks/useRooms';
import { useFilteredRooms } from '../../../src/hooks/useFilteredRooms';
import { RoomFilterOptions, Room, RoomFormData } from '../../../src/types/room';

// Import room components
import RoomStats from './RoomStats';
import RoomsHeader from './RoomsHeader';
import RoomGrid from './RoomGrid';
import Pagination from '../../common/Pagination';

// Import overlay components
import RoomFilterOverlay from '../../overlay_components/RoomFilterOverlay';
import AddRoomOverlay from '../../overlay_components/AddRoomOverlay';
import EditRoomOverlay from '../../overlay_components/EditRoomOverlay';

import styles from '../../component_styles/Rooms.module.css';

const RoomsPage: React.FC = () => {
  const {
    rooms,
    isLoading,
    error,
    formErrors,
    addRoom,
    updateRoom,
    toggleRoomStatus,
    clearError,
    refreshRooms
  } = useRooms();

  const [animate, setAnimate] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const loadingFinishedRef = useRef(false);

  useEffect(() => {
    if (!isLoading && !loadingFinishedRef.current) {
      loadingFinishedRef.current = true;
      const timer = setTimeout(() => {
        setShowContent(true);
        setTimeout(() => {
          setAnimate(true);
        }, 100);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);
  
  const {
    currentRooms,
    currentPage,
    setCurrentPage,
    totalPages,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    filterOptions,
    setFilterOptions,
    isSingleRow,
    roomStats
  } = useFilteredRooms({ rooms });

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [isEditRoomOpen, setIsEditRoomOpen] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (status: 'all' | 'Occupied' | 'Vacant') => {
    setStatusFilter(status);
  };

  const handleOpenFilters = () => {
    setIsFilterOpen(true);
  };

  const handleAddRoom = () => {
    // Clear previous form errors when opening the Add Room overlay
    if (Object.keys(formErrors).length > 0) {
        clearError(); // clearError in useRooms also clears formErrors
    }
    setIsAddRoomOpen(true);
  };

// In RoomsPage.tsx
const handleEditRoom = (roomId: string) => {
  console.log("--- handleEditRoom ---");
  console.log("1. roomId received from RoomCard/RoomGrid:", roomId, "(type:", typeof roomId + ")");
  console.log("2. Current 'rooms' state (first few items shown):", rooms.slice(0, 3));

  const roomToEdit = rooms.find(room => {
    console.log(`Comparing (received) "${roomId}" with (room state) "${room.id}" (type: ${typeof room.id})`);
    return String(room.id) === String(roomId);
  });
  
  console.log("3. roomToEdit found:", roomToEdit);

  if (roomToEdit) {
    if (Object.keys(formErrors).length > 0) {
        console.log("Clearing existing form errors.");
        clearError();
    }
    setCurrentRoom(roomToEdit);
    setIsEditRoomOpen(true);
    console.log("4. setCurrentRoom done, setIsEditRoomOpen(true) done. currentRoom is now:", roomToEdit, "isEditRoomOpen is now true.");
  } else {
    console.warn("4. Room NOT found for ID:", roomId, "- Check if this ID exists in the 'rooms' array above with matching type.");
  }
  console.log("--- end handleEditRoom ---");
};

  const handleToggleStatus = (roomId: string) => {
    const room = rooms.find(r => String(r.id) === roomId);
    if (window.confirm(`Are you sure you want to ${room?.is_active ? 'deactivate' : 'activate'} this room?`)) {
      toggleRoomStatus(roomId);
    }
  };

  const handleAddRoomSubmit = async (roomData: RoomFormData) => {
    // addRoom now returns a boolean indicating success
    const success = await addRoom(roomData);
    if (success) {
        setIsAddRoomOpen(false); // Close overlay only on success
    }
    // If not successful, formErrors should be populated by useRooms, and overlay remains open
  };

  const handleEditRoomSubmit = async (updatedFormData: RoomFormData) => {
    if (!currentRoom) return;
    // updateRoom now takes currentRoom (initial data) and returns a boolean
    const success = await updateRoom(String(currentRoom.id), updatedFormData, currentRoom);
    if (success) {
        setIsEditRoomOpen(false);
        setCurrentRoom(null); // Clear current room on success
    }
  };

  const handleApplyFilters = (newFilters: RoomFilterOptions) => {
    setFilterOptions(newFilters);
    setIsFilterOpen(false);
  };

  useEffect(() => {
    if (showContent) {
      setAnimate(false);
      setTimeout(() => {
        setAnimate(true);
      }, 100);
    }
  }, [searchTerm, statusFilter, filterOptions, showContent]);

  if (!showContent && isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingAnimation}>
          <div className={styles.spinnerContainer}>
            <i className="fa-solid fa-door-open fa-beat-fade"></i>
          </div>
          {/* ... rest of loading animation ... */}
          <div className={styles.loadingCards}>
            <div className={`${styles.loadingCard} ${styles.loadingCard1}`}></div>
            <div className={`${styles.loadingCard} ${styles.loadingCard2}`}></div>
            <div className={`${styles.loadingCard} ${styles.loadingCard3}`}></div>
          </div>
          <div className={styles.loadingTable}>
            <div className={styles.loadingTableHeader}></div>
            <div className={styles.loadingRooms}>
              <div className={styles.loadingRoom}></div>
              <div className={styles.loadingRoom}></div>
              <div className={styles.loadingRoom}></div>
              <div className={styles.loadingRoom}></div>
              <div className={styles.loadingRoom}></div>
              <div className={styles.loadingRoom}></div>
            </div>
          </div>
        </div>
        <h3 className={styles.loadingTitle}>Loading Rooms</h3>
        <p className={styles.loadingText}>Preparing room information...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <i className="fa-regular fa-exclamation-circle"></i>
        <h3>Error Loading Rooms</h3>
        <p>{error}</p>
        <button
          className={styles.retryButton}
          onClick={() => {
            clearError();
            refreshRooms();
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`${styles.roomDashboard} ${animate ? styles.fadeIn : ""}`}>
      <div className={`${animate ? styles.animateFirst : ""}`}>
        <RoomStats stats={roomStats} />
      </div>

      <div className={`${styles.topContent} ${animate ? styles.animateSecond : ""}`}>
        <RoomsHeader
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          onOpenFilters={handleOpenFilters}
          onAddRoom={handleAddRoom}
        />
        <RoomGrid
          rooms={currentRooms}
          isSingleRow={isSingleRow}
          page={currentPage}
          searchTerm={searchTerm}
          onEdit={handleEditRoom}
          onToggleStatus={handleToggleStatus}
        />
      </div>

      {totalPages > 1 && (
        <div className={`${animate ? styles.animateThird : ""}`}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      <RoomFilterOverlay
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={handleApplyFilters}
        initialFilters={filterOptions}
      />
      
      <AddRoomOverlay 
        isOpen={isAddRoomOpen}
        onClose={() => setIsAddRoomOpen(false)}
        onSubmit={handleAddRoomSubmit}
        existingRooms={rooms.map(r => ({ id: String(r.id), name: r.name, amenities: r.amenities }))}
        formErrors={formErrors} // Passed from useRooms
      />
      
      {currentRoom && (
        <EditRoomOverlay 
          isOpen={isEditRoomOpen}
          onClose={() => {
            setIsEditRoomOpen(false);
            setCurrentRoom(null);
          }}
          onSubmit={handleEditRoomSubmit}
          formErrors={formErrors} // Passed from useRooms
          room={currentRoom}
existingRooms={rooms.map(r => ({ id: String(r.id), name: r.name, amenities: r.amenities || [] }))} 
        />
      )}
    </div>
  );
};

export default RoomsPage;