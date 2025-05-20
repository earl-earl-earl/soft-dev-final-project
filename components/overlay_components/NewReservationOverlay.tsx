import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
// VERIFY PATH - This path should be correct for your project structure
import styles from '@components/component_styles/NewReservationOverlay.module.css';

// Interface for room options, including price
export interface RoomOption {
  id: string;
  name: string;
  price: number; // Price per night
}

// Props for the NewReservationOverlay component
interface NewReservationOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reservationData: ReservationData) => void;
  availableRooms?: RoomOption[] | null; // Accepts an array of RoomOption objects or null
}

// Interface for the reservation data structure
export interface ReservationData {
  name: string;
  room: string; // Will store the room ID
  checkIn: Date;
  checkOut: Date;
  phone: string;
  adults: number;
  children: number;
  seniors: number;
  totalPeople: number;
  type: string;
  notes: string;
  numberOfNights: number; // Calculated number of nights
  calculatedPrice: number; // Calculated total price
}

const NewReservationOverlay: React.FC<NewReservationOverlayProps> = ({
  isOpen,
  onClose,
  onSubmit,
  availableRooms: passedAvailableRooms // Use alias for clarity
}) => {
  // Derived state to ensure availableRoomsForForm is always an array for the dropdown
  const availableRoomsForForm = passedAvailableRooms || [];

  // Initial form data state
  const [formData, setFormData] = useState<ReservationData>({
    name: '',
    room: '', // Initialize as empty; will be set by an effect
    checkIn: new Date(),
    checkOut: new Date(new Date().setDate(new Date().getDate() + 1)), // Default to tomorrow
    phone: '',
    adults: 1,
    children: 0,
    seniors: 0,
    totalPeople: 1,
    type: 'direct', // Fixed type
    notes: '',
    numberOfNights: 0, // Initialized to 0
    calculatedPrice: 0, // Initialized to 0
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ReservationData, string>>>({});
  const [checkoutDisabled, setCheckoutDisabled] = useState(false);

  // Variables for display to make JSX cleaner
  const displayNumberOfNights = formData.numberOfNights;
  const displayEstimatedPrice = formData.calculatedPrice;

  // Effect to reset form or set initial/updated room when overlay opens/closes or available rooms change
  useEffect(() => {
    console.log("OVERLAY: Effect for [passedAvailableRooms, isOpen] triggered. isOpen:", isOpen, "Current formData.room:", formData.room, "Passed rooms count:", (passedAvailableRooms || []).length);

    if (!isOpen) {
      // When overlay closes, reset form for the next time it opens.
      // This ensures a clean state and picks the first available room if the list changed.
      const initialRoomIdOnNextOpen = (passedAvailableRooms && passedAvailableRooms.length > 0) ? passedAvailableRooms[0].id : '';
      console.log("OVERLAY: Closing or initially closed. Resetting form. Initial room for next open:", initialRoomIdOnNextOpen);
      setFormData({
        name: '',
        room: initialRoomIdOnNextOpen, // Set for next open
        checkIn: new Date(),
        checkOut: new Date(new Date().setDate(new Date().getDate() + 1)),
        phone: '',
        adults: 1,
        children: 0,
        seniors: 0,
        totalPeople: 1,
        type: 'direct',
        notes: '',
        numberOfNights: 0,
        calculatedPrice: 0,
      });
      setErrors({}); // Clear errors on close
      return; // Exit effect if not open
    }

    // --- Logic for when overlay IS OPEN ---
    const currentEffectiveRooms = passedAvailableRooms || [];
    const currentSelectedRoomIdInState = formData.room;

    if (currentEffectiveRooms.length > 0) {
      const isSelectedRoomStillInList = currentEffectiveRooms.some(room => room.id === currentSelectedRoomIdInState);

      if (!currentSelectedRoomIdInState || !isSelectedRoomStillInList) {
        // Case 1: No room is currently selected in formData (e.g., on first open after mount).
        // Case 2: The room currently selected in formData is NO LONGER in the passedAvailableRooms list.
        // In both cases, default to the first room in the current passedAvailableRooms list.
        console.warn(`OVERLAY: currentSelectedRoomIdInState ('${currentSelectedRoomIdInState}') is falsy or not in currentEffectiveRooms. Resetting to first available: ${currentEffectiveRooms[0].id}`);
        setFormData(prev => ({ ...prev, room: currentEffectiveRooms[0].id }));
      } else {
        // The currently selected room in formData IS valid and present in passedAvailableRooms.
        // This respects user selection if they changed rooms while the modal was open.
        console.log(`OVERLAY: currentSelectedRoomIdInState ('${currentSelectedRoomIdInState}') is valid and in currentEffectiveRooms. No change by this effect.`);
      }
    } else {
      // No rooms are available in passedAvailableRooms.
      if (currentSelectedRoomIdInState) {
        // A room was selected, but now the list of available rooms is empty. Clear the selection.
        console.warn("OVERLAY: No rooms available in passedAvailableRooms. Clearing selected room ID.");
        setFormData(prev => ({ ...prev, room: '' }));
      } else {
        console.log("OVERLAY: No rooms available and no room selected. State remains empty for room.");
      }
    }
  }, [passedAvailableRooms, isOpen]); // Key dependencies: the list of rooms and the open state

  // Logging effect for formData.room specifically (useful for debugging)
  useEffect(() => {
    if (isOpen) {
        console.log("OVERLAY: formData.room state updated to:", formData.room);
    }
  }, [formData.room, isOpen]);

  // Effect to calculate totalPeople
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      totalPeople: (prev.adults || 0) + (prev.children || 0) + (prev.seniors || 0)
    }));
  }, [formData.adults, formData.children, formData.seniors]);

  // Effect to manage checkoutDisabled state and clear checkout errors
  useEffect(() => {
    const isCheckInInvalid = formData.checkIn.getTime() >= formData.checkOut.getTime();
    setCheckoutDisabled(isCheckInInvalid);
    if (!isCheckInInvalid && errors.checkOut) {
      setErrors(prev => ({ ...prev, checkOut: undefined }));
    }
  }, [formData.checkIn, formData.checkOut, errors.checkOut]);

  // Helper function to calculate the number of nights
  const calculateNights = (checkInDate: Date, checkOutDate: Date): number => {
    if (!checkInDate || !checkOutDate || checkOutDate.getTime() <= checkInDate.getTime()) return 0;
    const differenceInTime = checkOutDate.getTime() - checkInDate.getTime();
    return Math.max(0, Math.round(differenceInTime / (1000 * 3600 * 24)));
  };

  // Effect to calculate numberOfNights and calculatedPrice
  useEffect(() => {
    const { checkIn, checkOut, room: selectedRoomId } = formData;
    const currentEffectiveRooms = passedAvailableRooms || []; // Use prop directly for calculation consistency
    const nights = calculateNights(checkIn, checkOut);
    let price = 0;

    if (nights > 0 && selectedRoomId && currentEffectiveRooms.length > 0) {
      const selectedRoomDetails = currentEffectiveRooms.find(r => r.id === selectedRoomId);
      if (selectedRoomDetails?.price) {
        price = nights * selectedRoomDetails.price;
      }
    }
    
    // Only update if nights or price actually change to avoid potential loops
    if (nights !== formData.numberOfNights || price !== formData.calculatedPrice) {
        setFormData(prev => ({ ...prev, numberOfNights: nights, calculatedPrice: price }));
    }
  }, [formData.checkIn, formData.checkOut, formData.room, passedAvailableRooms, formData.numberOfNights, formData.calculatedPrice]);

  // Handles changes in form inputs (text, select, textarea)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    console.log(`OVERLAY: handleChange - Field: ${name}, New User-Selected Value: ${value}`);
    
    const numericFields = ['adults', 'children', 'seniors'];
    let parsedValue: string | number = value;

    if (numericFields.includes(name)) {
      parsedValue = parseInt(value, 10);
      // Default adults to 1 if parsing fails, others to 0
      if (isNaN(parsedValue as number)) {
        parsedValue = name === 'adults' ? 1 : 0;
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: parsedValue }));

    // Clear error for the field being changed
    if (errors[name as keyof ReservationData]) {
      setErrors(prevErrors => ({ ...prevErrors, [name]: undefined }));
    }
  };

  // Handles changes in date pickers
  const handleDateChange = (date: Date | null, field: 'checkIn' | 'checkOut') => {
    if (!date) return;

    const today = new Date(); 
    today.setHours(0, 0, 0, 0); // Normalize today's date

    if (field === 'checkIn') {
      const newCheckIn = new Date(date); 
      newCheckIn.setHours(0,0,0,0); // Normalize new check-in date

      // Prevent selecting a date before today
      if (newCheckIn < today && newCheckIn.toDateString() !== today.toDateString()) return;

      if (newCheckIn.getTime() >= formData.checkOut.getTime()) {
        // If new check-in is same or after current check-out, adjust check-out to be one day after new check-in
        const newCheckOut = new Date(newCheckIn);
        newCheckOut.setDate(newCheckOut.getDate() + 1);
        setFormData(prev => ({ ...prev, checkIn: newCheckIn, checkOut: newCheckOut }));
      } else {
        setFormData(prev => ({ ...prev, checkIn: newCheckIn }));
      }
    } else { // field === 'checkOut'
      const newCheckOut = new Date(date); 
      newCheckOut.setHours(0,0,0,0); // Normalize new check-out date

      // Check-out must be after check-in
      if (newCheckOut.getTime() <= formData.checkIn.getTime()) return; 
      
      setFormData(prev => ({ ...prev, checkOut: newCheckOut }));
      if (errors.checkOut) { // Clear checkout error if date becomes valid
        setErrors(prevErrors => ({ ...prevErrors, checkOut: undefined }));
      }
    }
  };

  // Validates the form data
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ReservationData, string>> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    
    const currentEffectiveRoomsVal = passedAvailableRooms || []; // Use prop for validation consistency
    if (currentEffectiveRoomsVal.length > 0 && !formData.room) {
      newErrors.room = 'Room selection is required';
    }
    // If no rooms are available at all, this validation might be skipped or handled differently based on requirements.
    // Current logic: if rooms could be available (list > 0), then selection is a must.

    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^\+?[0-9\s-()]{7,20}$/.test(formData.phone)) newErrors.phone = 'Valid phone number required (e.g., +1 123-456-7890).';
    
    if (formData.adults < 1) newErrors.adults = 'At least one adult is required';
    
    if (formData.checkOut.getTime() <= formData.checkIn.getTime()) {
      newErrors.checkOut = 'Checkout date must be after check-in date.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handles form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      onClose(); // Close the overlay on successful submission
    }
  };

  if (!isOpen) return null; // Do not render if not open

  return (
    <div className={styles.reservationOverlay}>
      <div className={styles.reservationModal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>New Reservation</h2>
          <button onClick={onClose} className={styles.closeButton} aria-label="Close">×</button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          {/* Guest Name and Room Selection */}
          <div className={`${styles.formGrid} ${styles.formGrid2}`}>
            <div>
              <label htmlFor="name" className={styles.formLabel}>Guest Name</label>
              <input id="name" type="text" name="name" value={formData.name} onChange={handleChange} className={`${styles.formInput} ${errors.name ? styles.inputError : ''}`} placeholder="Enter guest name"/>
              {errors.name && <p className={styles.errorMessage}>{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="room" className={styles.formLabel}>Room</label>
              <select
                id="room"
                name="room"
                value={formData.room}
                onChange={handleChange}
                className={`${styles.formSelect} ${errors.room ? styles.inputError : ''}`}
                disabled={availableRoomsForForm.length === 0}
              >
                <option value="">{availableRoomsForForm.length === 0 ? "No rooms available" : "Select a room"}</option>
                {availableRoomsForForm.map(roomOption => (
                  <option key={roomOption.id} value={roomOption.id}>
                    {roomOption.name} {roomOption.price ? `($${roomOption.price.toFixed(2)}/night)` : ''}
                  </option>
                ))}
              </select>
              {errors.room && <p className={styles.errorMessage}>{errors.room}</p>}
              {availableRoomsForForm.length === 0 && !errors.room && <p className={styles.warningMessage}>No rooms currently available.</p>}
            </div>
          </div>

          {/* Check-in and Check-out dates */}
          <div className={`${styles.formGrid} ${styles.formGrid2}`}>
            <div>
              <label htmlFor="checkIn" className={styles.formLabel}>Check-in Date</label>
              <DatePicker id="checkIn" selected={formData.checkIn} onChange={(date) => handleDateChange(date, 'checkIn')} className={styles.formInput} dateFormat="MMMM d, yyyy" minDate={new Date()} autoComplete="off"/>
            </div>
            <div>
              <label htmlFor="checkOut" className={styles.formLabel}>Check-out Date{checkoutDisabled && (<span className={styles.disabledFieldNote}> (Update check-in)</span>)}</label>
              <DatePicker id="checkOut" selected={formData.checkOut} onChange={(date) => handleDateChange(date, 'checkOut')} className={`${styles.formInput} ${checkoutDisabled ? styles.inputDisabled : ''} ${errors.checkOut ? styles.inputError : ''}`} dateFormat="MMMM d, yyyy" minDate={new Date(new Date(formData.checkIn).setDate(formData.checkIn.getDate() + 1))} disabled={checkoutDisabled} autoComplete="off"/>
              {errors.checkOut && <p className={styles.errorMessage}>{errors.checkOut}</p>}
              {checkoutDisabled && !errors.checkOut && (<p className={styles.warningMessage}>Checkout must be after check-in.</p>)}
            </div>
          </div>
          
          {/* Display Number of Nights and Estimated Price */}
          <div className={`${styles.formGrid} ${styles.formGrid2}`}>
            <div>
              <label htmlFor="displayNumberOfNights" className={styles.formLabel}>Number of Nights</label>
              <input id="displayNumberOfNights" type="number" value={displayNumberOfNights} readOnly className={`${styles.formInput} ${styles.formInputReadonly}`}/>
            </div>
            <div>
              <label htmlFor="displayEstimatedPrice" className={styles.formLabel}>Estimated Total Price</label>
              <input id="displayEstimatedPrice" type="text" value={displayEstimatedPrice > 0 ? `$${displayEstimatedPrice.toFixed(2)}` : (displayNumberOfNights > 0 && formData.room ? 'Calculating...' : 'N/A')} readOnly className={`${styles.formInput} ${styles.formInputReadonly}`}/>
            </div>
          </div>

          {/* Phone Number */}
          <div className={styles.formGroup}>
            <label htmlFor="phone" className={styles.formLabel}>Phone Number</label>
            <input id="phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} className={`${styles.formInput} ${errors.phone ? styles.inputError : ''}`} placeholder="Enter phone number"/>
            {errors.phone && <p className={styles.errorMessage}>{errors.phone}</p>}
          </div>

          {/* Guest Count */}
          <div className={`${styles.formGrid} ${styles.formGrid3}`}>
            <div>
              <label htmlFor="adults" className={styles.formLabel}>Adults</label>
              <input id="adults" type="number" name="adults" min="1" value={formData.adults} onChange={handleChange} className={`${styles.formInput} ${errors.adults ? styles.inputError : ''}`}/>
              {errors.adults && <p className={styles.errorMessage}>{errors.adults}</p>}
            </div>
            <div>
              <label htmlFor="children" className={styles.formLabel}>Children</label>
              <input id="children" type="number" name="children" min="0" value={formData.children} onChange={handleChange} className={styles.formInput}/>
            </div>
            <div>
              <label htmlFor="seniors" className={styles.formLabel}>Senior Citizens</label>
              <input id="seniors" type="number" name="seniors" min="0" value={formData.seniors} onChange={handleChange} className={styles.formInput}/>
            </div>
          </div>

          {/* Total People (Read-only) */}
          <div className={styles.formGroup}>
            <label htmlFor="totalPeople" className={styles.formLabel}>Total People</label>
            <input id="totalPeople" type="number" value={formData.totalPeople} readOnly className={`${styles.formInput} ${styles.formInputReadonly}`}/>
          </div>

          {/* Reservation Type (Fixed as direct, Read-only) */}
          <div className={styles.formGroup}>
            <label htmlFor="type" className={styles.formLabel}>Reservation Type</label>
            <input id="type" type="text" name="type" value={formData.type} readOnly className={`${styles.formInput} ${styles.formInputReadonly}`}/>
          </div>

          {/* Notes with character limit */}
          <div className={styles.formGroup}>
            <label htmlFor="notes" className={styles.formLabel}>Notes (Optional)<span className={styles.characterCount}>{formData.notes.length}/150</span></label>
            <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} maxLength={150} className={`${styles.formInput} ${styles.textArea}`} placeholder="Additional information or special requests" rows={3}/>
          </div>

          {/* Buttons */}
          <div className={styles.buttonContainer}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>Cancel</button>
            <button type="submit" className={styles.submitButton}>Create Reservation</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewReservationOverlay;