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
  // Get room data and operations
  const { 
    rooms, 
    isLoading,
    error, 
    formErrors, 
    addRoom, 
    updateRoom, 
    toggleRoomStatus, 
    clearError 
  } = useRooms();

  // Animation states
  const [animate, setAnimate] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const loadingFinishedRef = useRef(false);

  // Handle animation after loading finishes
  useEffect(() => {
    if (!isLoading && !loadingFinishedRef.current) {
      loadingFinishedRef.current = true;
      
      // Small delay to ensure smooth transition from loading to content
      const timer = setTimeout(() => {
        setShowContent(true);
        
        // Then trigger animations with a slight delay
        setTimeout(() => {
          setAnimate(true);
        }, 100);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading]);
  
  // Get filtered rooms and filtering operations
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

  // UI state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [isEditRoomOpen, setIsEditRoomOpen] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);

  // Event handlers
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
    setIsAddRoomOpen(true);
  };

  const handleEditRoom = (roomId: string) => {
    const roomToEdit = rooms.find(room => room.id === roomId);
    if (roomToEdit) {
      setCurrentRoom(roomToEdit);
      setIsEditRoomOpen(true);
    }
  };

  const handleToggleStatus = (roomId: string) => {
    if (window.confirm(`Are you sure you want to ${rooms.find(r => r.id === roomId)?.isActive ? 'deactivate' : 'activate'} this room?`)) {
      toggleRoomStatus(roomId);
    }
  };

  const handleAddRoomSubmit = async (roomData: RoomFormData) => {
    await addRoom(roomData);
    setIsAddRoomOpen(false);
  };

  const handleEditRoomSubmit = async (roomData: RoomFormData) => {
    if (!currentRoom) return;
    await updateRoom(currentRoom.id, roomData);
    setIsEditRoomOpen(false);
    setCurrentRoom(null);
  };

  const handleApplyFilters = (newFilters: RoomFilterOptions) => {
    setFilterOptions(newFilters);
    setIsFilterOpen(false);
  };

  // Add to your component
  useEffect(() => {
    if (showContent) {
      setAnimate(false);
      
      setTimeout(() => {
        setAnimate(true);
      }, 100);
    }
  }, [searchTerm, statusFilter, filterOptions, showContent]);

  // Show loading screen
  if (!showContent) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingAnimation}>
          <div className={styles.spinnerContainer}>
            <i className="fa-solid fa-door-open fa-beat-fade"></i>
          </div>
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
  
  // Error state
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <i className="fa-regular fa-exclamation-circle"></i>
        <h3>Error Loading Rooms</h3>
        <p>{error}</p>
        <button 
          className={styles.retryButton}
          onClick={clearError}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`${styles.roomDashboard} ${animate ? styles.fadeIn : ""}`}>
      {/* Stats Section */}
      <div className={`${animate ? styles.animateFirst : ""}`}>
        <RoomStats stats={roomStats} />
      </div>

      <div className={`${styles.topContent} ${animate ? styles.animateSecond : ""}`}>
        {/* Header with search and filters */}
        <RoomsHeader
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          onOpenFilters={handleOpenFilters}
          onAddRoom={handleAddRoom}
        />

        {/* Room Grid */}
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

      {/* Overlay components */}
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
        existingRooms={rooms}
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
          existingRooms={rooms}
          formErrors={formErrors}
          room={currentRoom}
        />
      )}
    </div>
  );
};

export default RoomsPage;