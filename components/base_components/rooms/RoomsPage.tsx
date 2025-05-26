/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useRooms } from '../../../src/hooks/useRooms';
import { useFilteredRooms } from '../../../src/hooks/useFilteredRooms';
import { RoomFilterOptions, Room, RoomFormData } from '../../../src/types/room';
import AuthContext from '../../../src/contexts/AuthContext';
import { toast } from 'react-toastify';

// Import room components
import RoomStats from './RoomStats';
import RoomsHeader from './RoomsHeader';
import RoomGrid from './RoomGrid';
import Pagination from '../../common/Pagination';

// Import overlay components
import RoomFilterOverlay from '../../overlay_components/RoomFilterOverlay';
import AddRoomOverlay from '../../overlay_components/AddRoomOverlay';
import EditRoomOverlay from '../../overlay_components/EditRoomOverlay';
import DeleteConfirmationOverlay from '../../overlay_components/DeleteConfirmationOverlay'; // Add this import
import LoadingOverlay from '../../overlay_components/LoadingOverlay';

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
    deleteRoom, // Add this
    clearError,
    refreshRooms,
    reservationLookup
  } = useRooms();

  // Get user role from your auth context
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

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

  // Add state for delete confirmation
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (status: 'all' | 'Occupied' | 'Vacant') => {
    setStatusFilter(status);
  };

  const handleOpenFilters = () => {
    setIsFilterOpen(true);
  };

  // Role-based permission helpers
  const isStaff = user?.role === 'staff';
  const isSuperAdmin = user?.role === 'super_admin';

  // Only super admin can delete, and only if no future restricted bookings
  const canDeleteRoom = (room: Room) => {
    if (!isSuperAdmin) return false;
    const roomReservations = reservationLookup[String(room.id)] || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Only block if any future reservation is in restricted status
    const restrictedStatuses = [
      'Confirmed_Pending_Payment',
      'Accepted',
      'Checked_In',
      'Checked_Out',
    ];
    return !roomReservations.some(reservation => {
      const checkOutDate = new Date(reservation.checkOut);
      checkOutDate.setHours(0, 0, 0, 0);
      return checkOutDate > today && restrictedStatuses.includes(reservation.status);
    });
  };

  // Only admin or super admin can toggle active status
  const canToggleActive = user?.role === 'admin' || isSuperAdmin;

  // Only staff, admin, super admin can create/edit
  const canCreateOrEdit = isStaff || user?.role === 'admin' || isSuperAdmin;

  // UI handlers with permission checks
  const handleAddRoom = () => {
    if (!canCreateOrEdit) return;
    if (Object.keys(formErrors).length > 0) {
        clearError();
    }
    setIsAddRoomOpen(true);
  };

  const handleEditRoom = (roomId: string) => {
    if (!canCreateOrEdit) return;
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
    if (!canToggleActive) return;
    const room = rooms?.find(r => String(r.id) === String(roomId));
    if (!room) return;
    
    // Only check reservations when trying to deactivate, not when activating
    if (room.isActive) {
      // Check for active or upcoming reservations
      const roomReservations = reservationLookup[String(roomId)] || [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Filter for any upcoming reservations (check-out date is in the future)
      const upcomingReservations = roomReservations.filter(reservation => {
        const checkOutDate = new Date(reservation.checkOut);
        checkOutDate.setHours(0, 0, 0, 0);
        return checkOutDate > today;
      });

      if (upcomingReservations.length > 0) {
        // Reservation exists - show error and prevent deactivation
        const earliestReservation = upcomingReservations.sort(
          (a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime()
        )[0];

        const formattedCheckIn = new Date(earliestReservation.checkIn).toLocaleDateString();
        
        alert(
          `Cannot deactivate room "${room.name}" because it has upcoming or active reservations.\n\n` +
          `The earliest reservation starts on ${formattedCheckIn}.\n\n` +
          `Please cancel all reservations for this room before deactivating it.`
        );
        return;
      }
    }

    // No active reservations or we're activating the room - proceed with confirmation
    if (window.confirm(`Are you sure you want to ${room.isActive ? 'deactivate' : 'activate'} this room?`)) {
      toggleRoomStatus(roomId);
    }
  };

  const handleDeleteRoom = (roomId: string) => {
    if (!isSuperAdmin) return;
    const room = rooms?.find(r => String(r.id) === String(roomId));
    if (!room) return;
    // Check for restricted future bookings
    const roomReservations = reservationLookup[String(roomId)] || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const restrictedStatuses = [
      'Confirmed_Pending_Payment',
      'Accepted',
      'Checked_In',
      'Checked_Out',
    ];
    const hasRestrictedFuture = roomReservations.some(reservation => {
      const checkOutDate = new Date(reservation.checkOut);
      checkOutDate.setHours(0, 0, 0, 0);
      return checkOutDate > today && restrictedStatuses.includes(reservation.status);
    });
    if (hasRestrictedFuture) {
      setDeleteErrorMessage(
        `Cannot delete room with active or upcoming bookings.`
      );
      return;
    }
    setRoomToDelete(room);
    setIsDeleteConfirmOpen(true);
  };
  
  const confirmDeleteRoom = async () => {
    if (!roomToDelete) return;
    
    const success = await deleteRoom(String(roomToDelete.id));
    if (success) {
      toast.success('Room deleted successfully.');
      setIsDeleteConfirmOpen(false);
      setRoomToDelete(null);
    }
  };

  const handleAddRoomSubmit = async (roomData: any) => {
    const success = await addRoom({
      ...roomData,
      is_active: true // Add the required is_active property
    });
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
  }, [searchTerm, statusFilter, filterOptions, showContent]);

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
      {/* Loading overlay for delete operation */}
      {isLoading && roomToDelete && (
        <LoadingOverlay message="Deleting room..." />
      )}
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
          onEdit={canCreateOrEdit ? handleEditRoom : undefined}
          onToggleStatus={canToggleActive ? handleToggleStatus : undefined}
          onDelete={isSuperAdmin ? handleDeleteRoom : undefined}
          isAdmin={isAdmin}
          isSuperAdmin={isSuperAdmin}
          isStaff={isStaff}
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

      {/* Add the delete confirmation overlay */}
      {roomToDelete && (
        <DeleteConfirmationOverlay
          isOpen={isDeleteConfirmOpen}
          title="Delete Room"
          message={`Are you sure you want to permanently delete ${roomToDelete.name}? This action cannot be undone.`}
          onConfirm={confirmDeleteRoom}
          onCancel={() => {
            setIsDeleteConfirmOpen(false);
            setRoomToDelete(null);
          }}
        />
      )}
      
      {deleteErrorMessage && (
        <DeleteConfirmationOverlay
          isOpen={!!deleteErrorMessage}
          title="Cannot Delete Room"
          message={deleteErrorMessage}
          onConfirm={() => setDeleteErrorMessage(null)}
          onCancel={() => setDeleteErrorMessage(null)}
        />
      )}
    </div>
  );
};

export default RoomsPage;