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
    refreshRooms,
    reservationLookup
  } = useRooms();

  useEffect(() => {
    console.log(
      "RoomsPage - Props from useRooms updated:",
      { isLoading, error, roomsCount: rooms?.length, reservationLookupKeys: Object.keys(reservationLookup || {}).length }
    );
  }, [isLoading, error, rooms, reservationLookup]);

  const [animate, setAnimate] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const loadingFinishedRef = useRef(false);

  useEffect(() => {
    if (!isLoading && !loadingFinishedRef.current) {
      // console.log("RoomsPage: isLoading is false, first time. Setting showContent.");
      loadingFinishedRef.current = true;
      const contentTimer = setTimeout(() => {
        setShowContent(true);
        const animationTimer = setTimeout(() => {
          setAnimate(true);
        }, 100); // Short delay for animation
        return () => clearTimeout(animationTimer);
      }, 100);
      return () => clearTimeout(contentTimer);
    } else if (isLoading) {
      // console.log("RoomsPage: isLoading is true. Resetting showContent and loadingFinishedRef.");
      setShowContent(false);
      setAnimate(false);
      loadingFinishedRef.current = false;
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
  } = useFilteredRooms({ rooms: rooms || [], reservationLookup: reservationLookup || {} });

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
    if (Object.keys(formErrors).length > 0) {
        clearError();
    }
    setIsAddRoomOpen(true);
  };

  const handleEditRoom = (roomId: string) => {
    const roomToEdit = rooms?.find(room => String(room.id) === String(roomId));
    if (roomToEdit) {
      if (Object.keys(formErrors).length > 0) {
          clearError();
      }
      setCurrentRoom(roomToEdit);
      setIsEditRoomOpen(true);
    } else {
      console.warn(`RoomsPage: Room NOT found for ID: ${roomId}`);
    }
  };

  const handleToggleStatus = (roomId: string) => {
    const room = rooms?.find(r => String(r.id) === String(roomId));
    if (room && window.confirm(`Are you sure you want to ${room.isActive ? 'deactivate' : 'activate'} this room?`)) {
      toggleRoomStatus(roomId);
    }
  };

  const handleAddRoomSubmit = async (roomData: RoomFormData) => {
    const success = await addRoom(roomData);
    if (success) {
        setIsAddRoomOpen(false);
    }
  };

  const handleEditRoomSubmit = async (updatedFormData: RoomFormData) => {
    if (!currentRoom) return;
    const success = await updateRoom(String(currentRoom.id), updatedFormData, currentRoom);
    if (success) {
        setIsEditRoomOpen(false);
        setCurrentRoom(null);
    }
  };

  const handleApplyFilters = (newFilters: RoomFilterOptions) => {
    setFilterOptions(newFilters);
    setIsFilterOpen(false);
  };

  useEffect(() => {
    if (showContent) {
      setAnimate(false);
      const timer = setTimeout(() => {
        setAnimate(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, statusFilter, filterOptions]);

  // Conditional Rendering Logic
  if (isLoading && !showContent) {
    return (
      <div className={styles.loadingContainer}>
        {/* ... loading animation ... (as provided previously) ... */}
        <div className={styles.loadingAnimation}>
          <div className={styles.spinnerContainer}><i className="fa-solid fa-door-open fa-beat-fade"></i></div>
          <div className={styles.loadingCards}>
            <div className={`${styles.loadingCard} ${styles.loadingCard1}`}></div>
            <div className={`${styles.loadingCard} ${styles.loadingCard2}`}></div>
            <div className={`${styles.loadingCard} ${styles.loadingCard3}`}></div>
          </div>
          <div className={styles.loadingTable}>
            <div className={styles.loadingTableHeader}></div>
            <div className={styles.loadingRooms}>
              {[...Array(6)].map((_, i) => <div key={i} className={styles.loadingRoom}></div>)}
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
        <button className={styles.retryButton} onClick={() => { clearError(); refreshRooms(); }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`${styles.roomDashboard} ${showContent && animate ? styles.fadeIn : styles.hiddenInitially}`}>
      <div className={`${showContent && animate ? styles.animateFirst : styles.hiddenInitially}`}>
        <RoomStats stats={roomStats} />
      </div>

      <div className={`${showContent && animate ? styles.animateSecond : styles.hiddenInitially}`}>
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
          reservationLookup={reservationLookup || {}}
        />
      </div>

      {totalPages > 1 && (
        <div className={`${showContent && animate ? styles.animateThird : styles.hiddenInitially}`}>
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
        existingRooms={rooms?.map(r => ({ id: String(r.id), name: r.name, amenities: r.amenities })) || []}
        formErrors={formErrors}
      />
      
      {currentRoom && (
        <EditRoomOverlay
          isOpen={isEditRoomOpen}
          onClose={() => {
            setIsEditRoomOpen(false);
            setCurrentRoom(null);
          }}
          onSubmit={handleEditRoomSubmit}
          formErrors={formErrors}
          room={currentRoom}
          existingRooms={rooms?.map(r => ({ id: String(r.id), name: r.name, amenities: r.amenities || [] })) || []} 
        />
      )}
    </div>
  );
};

export default RoomsPage;