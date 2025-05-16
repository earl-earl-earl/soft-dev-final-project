import React, { useState } from 'react';
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
    error, 
    formErrors, 
    addRoom, 
    updateRoom, 
    toggleRoomStatus, 
    clearError 
  } = useRooms();

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

  return (
    <div className={styles.roomDashboard}>
      {/* Stats Section */}
      <RoomStats stats={roomStats} />

      <div className={styles.topContent}>
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

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

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
      
      {/* Error message */}
      {error && (
        <div className={styles.errorMessage}>
          <i className="fa-regular fa-exclamation-circle"></i> {error}
          <button onClick={clearError}>
            <i className="fa-regular fa-times"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default RoomsPage;