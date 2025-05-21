// components/overlay_components/NewReservationOverlay.tsx

import React, { useState, useEffect, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styles from '@components/component_styles/NewReservationOverlay.module.css'; // Ensure this path is correct

export interface RoomOption {
  id: string;
  name: string;
  price: number;
  capacity: number;
}

interface NewReservationOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reservationData: ReservationData) => void; // Parent handles actual submission and closing
  availableRooms?: RoomOption[] | null;
  submissionError?: string | null; // For displaying errors from the parent after submission attempt
}

export interface ReservationData {
  name: string;
  room: string; 
  checkIn: Date;
  checkOut: Date;
  phone: string;
  adults: number;
  children: number;
  seniors: number;
  totalPeople: number;
  type: string;
  notes: string;
  numberOfNights: number;
  calculatedPrice: number;
}

const CAPACITY_ALLOWANCE = 2; // Allow up to 2 extra guests over stated capacity (with notes)

const NewReservationOverlay: React.FC<NewReservationOverlayProps> = ({
  isOpen,
  onClose,
  onSubmit,
  availableRooms: passedAvailableRooms,
  submissionError 
}) => {
  const availableRoomsForForm = passedAvailableRooms || [];

  const getInitialFormData = useCallback((): ReservationData => ({
    name: '',
    room: (passedAvailableRooms && passedAvailableRooms.length > 0) ? passedAvailableRooms[0].id : '',
    checkIn: new Date(),
    checkOut: new Date(new Date().setDate(new Date().getDate() + 1)),
    phone: '',
    adults: 0,
    children: 0,
    seniors: 0,
    totalPeople: 0,
    type: 'Direct', 
    notes: '',
    numberOfNights: 0, 
    calculatedPrice: 0,
  }), [passedAvailableRooms]); 

  const [formData, setFormData] = useState<ReservationData>(getInitialFormData());
  const [errors, setErrors] = useState<Partial<Record<keyof ReservationData | 'capacity' | 'capacityInfo' | 'general', string>>>({});
  const [checkoutDisabled, setCheckoutDisabled] = useState(false);
  const [localSubmissionError, setLocalSubmissionError] = useState<string | null>(null);

  useEffect(() => {
    if (submissionError !== localSubmissionError) {
      setLocalSubmissionError(submissionError || null);
    }
    if (submissionError) { 
        setErrors(prev => ({
            ...prev, 
            capacity: undefined, 
            capacityInfo: undefined,
            notes: prev.notes === "Notes are required when guest count is over standard room capacity. Please specify needs." 
                   ? undefined 
                   : prev.notes 
        }));
    }
  }, [submissionError, localSubmissionError]);

  useEffect(() => { 
    if (!isOpen) {
      setFormData(getInitialFormData()); 
      setErrors({});
      setLocalSubmissionError(null); 
      return; 
    }
    const currentEffectiveRooms = passedAvailableRooms || [];
    const currentSelectedRoomIdInState = formData.room; 
    if (currentEffectiveRooms.length > 0) {
      const isSelectedRoomStillInList = currentEffectiveRooms.some(room => room.id === currentSelectedRoomIdInState);
      if (!currentSelectedRoomIdInState || !isSelectedRoomStillInList) {
        if (formData.room !== currentEffectiveRooms[0].id) {
            setFormData(prev => ({ ...prev, room: currentEffectiveRooms[0].id }));
        }
      }
    } else { 
      if (currentSelectedRoomIdInState && formData.room !== '') { 
        setFormData(prev => ({ ...prev, room: '' }));
      }
    }
  }, [isOpen, passedAvailableRooms, getInitialFormData, formData.room]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      totalPeople: (Number(prev.adults) || 0) + (Number(prev.children) || 0) + (Number(prev.seniors) || 0)
    }));
  }, [formData.adults, formData.children, formData.seniors]);

  useEffect(() => {
    if (!formData.checkIn || !formData.checkOut || isNaN(formData.checkIn.getTime()) || isNaN(formData.checkOut.getTime())) {
      setCheckoutDisabled(true); return;
    }
    const isCheckInInvalid = formData.checkIn.getTime() >= formData.checkOut.getTime();
    setCheckoutDisabled(isCheckInInvalid);
    if (!isCheckInInvalid && errors.checkOut) setErrors(prev => ({ ...prev, checkOut: undefined }));
  }, [formData.checkIn, formData.checkOut, errors.checkOut]);

  const calculateNights = useCallback((checkInDate: Date, checkOutDate: Date): number => {
    if (!checkInDate || !checkOutDate || isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime()) || checkOutDate.getTime() <= checkInDate.getTime()) return 0;
    return Math.max(0, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24)));
  }, []);

  useEffect(() => {
    const { checkIn, checkOut, room: selectedRoomId } = formData;
    const nights = calculateNights(checkIn, checkOut);
    let price = 0;
    if (nights > 0 && selectedRoomId && availableRoomsForForm.length > 0) {
      const selectedRoomDetails = availableRoomsForForm.find(r => r.id === selectedRoomId);
      if (selectedRoomDetails?.price) price = nights * selectedRoomDetails.price;
    }
    if (nights !== formData.numberOfNights || price !== formData.calculatedPrice) {
      setFormData(prev => ({ ...prev, numberOfNights: nights, calculatedPrice: price }));
    }
  }, [formData.checkIn, formData.checkOut, formData.room, availableRoomsForForm, formData.numberOfNights, formData.calculatedPrice, calculateNights]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (localSubmissionError) setLocalSubmissionError(null); 

    const numericFields = ['adults', 'children', 'seniors'];
    let parsedValue: string | number = value;
    if (numericFields.includes(name)) {
      parsedValue = value === '' ? 0 : parseInt(value, 10);
      if (isNaN(parsedValue as number)) parsedValue = 0;
    }
    
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
    
    if (errors[name as keyof ReservationData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    if (numericFields.includes(name) || name === 'notes') {
        setErrors(prev => ({
            ...prev, 
            capacity: undefined, 
            capacityInfo: undefined,
            notes: (name === 'notes' && prev.notes === "Notes are required when guest count is over standard room capacity. Please specify needs.") 
                   ? undefined 
                   : prev.notes 
        }));
    }
  };

  const handleDateChange = (date: Date | null, field: 'checkIn' | 'checkOut') => {
    if (localSubmissionError) setLocalSubmissionError(null);
    if (!date || isNaN(date.getTime())) { 
        setErrors(prev => ({...prev, [field]: "Please select a valid date."})); 
        return; 
    }
    
    const today = new Date(); today.setHours(0, 0, 0, 0);
    // eslint-disable-next-line prefer-const
    let currentValidCheckIn = formData.checkIn instanceof Date && !isNaN(formData.checkIn.getTime()) ? new Date(formData.checkIn) : new Date(today);
    // eslint-disable-next-line prefer-const
    let currentValidCheckOut = formData.checkOut instanceof Date && !isNaN(formData.checkOut.getTime()) ? new Date(formData.checkOut) : new Date(new Date(currentValidCheckIn).setDate(currentValidCheckIn.getDate() + 1));
    currentValidCheckOut.setHours(0,0,0,0);
    let newCheckIn = currentValidCheckIn;
    let newCheckOut = currentValidCheckOut;

    if (field === 'checkIn') {
      newCheckIn = new Date(date); newCheckIn.setHours(0,0,0,0); 
      if (newCheckIn.getTime() < today.getTime()) { setErrors(prev => ({...prev, checkIn: "Check-in date cannot be in the past."})); return; }
      if (newCheckIn.getTime() >= newCheckOut.getTime()) { 
        newCheckOut = new Date(newCheckIn); newCheckOut.setDate(newCheckOut.getDate() + 1); newCheckOut.setHours(0,0,0,0);
      }
      setErrors(prev => ({...prev, checkIn: undefined, checkOut: (prev.checkOut && (newCheckIn.getTime() >= newCheckOut.getTime() || newCheckOut.getTime() <= newCheckIn.getTime())) ? undefined : prev.checkOut }));
    } else { 
      newCheckOut = new Date(date); newCheckOut.setHours(0,0,0,0);
      if (newCheckOut.getTime() <= newCheckIn.getTime()) { setErrors(prev => ({...prev, checkOut: "Check-out must be after check-in."})); return; }
      setErrors(prev => ({...prev, checkOut: undefined}));
    }
    setFormData(prev => ({ ...prev, checkIn: newCheckIn, checkOut: newCheckOut }));
  };

  const validateForm = useCallback((): boolean => { // Wrapped in useCallback
    const newErrors: Partial<Record<keyof ReservationData | 'capacity' | 'capacityInfo' | 'general', string>> = {};
    let formIsValid = true; 

    if (!formData.name.trim()) { newErrors.name = 'Name is required.'; formIsValid = false; }
    if (availableRoomsForForm.length > 0 && !formData.room) { newErrors.room = 'Room selection is required.'; formIsValid = false; }
    if (!formData.phone.trim()) { newErrors.phone = 'Phone number is required.'; formIsValid = false; }
    else if (!/^\+?[0-9\s-()]{7,20}$/.test(formData.phone.trim())) { newErrors.phone = 'Please enter a valid phone number.'; formIsValid = false; }
    
    const today = new Date(); today.setHours(0,0,0,0);
    const checkInDateObj = formData.checkIn instanceof Date && !isNaN(formData.checkIn.getTime()) ? new Date(new Date(formData.checkIn).setHours(0,0,0,0)) : null;
    const checkOutDateObj = formData.checkOut instanceof Date && !isNaN(formData.checkOut.getTime()) ? new Date(new Date(formData.checkOut).setHours(0,0,0,0)) : null;

    if (!checkInDateObj) { newErrors.checkIn = "A valid check-in date is required."; formIsValid = false; }
    else if (checkInDateObj.getTime() < today.getTime()){ newErrors.checkIn = "Check-in date cannot be in the past."; formIsValid = false; }
    
    if (!checkOutDateObj) { newErrors.checkOut = "A valid check-out date is required."; formIsValid = false; }
    else if (checkInDateObj && checkOutDateObj.getTime() <= checkInDateObj.getTime()) {
      newErrors.checkOut = 'Check-out date must be after the check-in date.'; formIsValid = false;
    }

    const adultsValue = Number(formData.adults);
    const childrenValue = Number(formData.children);
    const seniorsValue = Number(formData.seniors);
    if (isNaN(adultsValue) || adultsValue < 1) { newErrors.adults = 'At least one adult is required.'; formIsValid = false; }
    if (isNaN(childrenValue) || childrenValue < 0) { newErrors.children = "Children count must be zero or more."; formIsValid = false; }
    if (isNaN(seniorsValue) || seniorsValue < 0) { newErrors.seniors = "Seniors count must be zero or more."; formIsValid = false; }

    let inAllowanceZone = false;
    if (formData.room && adultsValue >= 1) {
        const selectedRoomDetails = availableRoomsForForm.find(r => r.id === formData.room);
        if (selectedRoomDetails && typeof selectedRoomDetails.capacity === 'number' && selectedRoomDetails.capacity >= 0) {
            const totalGuests = adultsValue + childrenValue + seniorsValue;
            const baseCapacity = selectedRoomDetails.capacity;
            const maxAllowedWithAllowance = baseCapacity + CAPACITY_ALLOWANCE;

            if (totalGuests > maxAllowedWithAllowance) {
                newErrors.capacity = `Number of guests (${totalGuests}) exceeds maximum allowed (${maxAllowedWithAllowance}) for room "${selectedRoomDetails.name}".`;
                formIsValid = false; 
            } else if (totalGuests > baseCapacity) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                inAllowanceZone = true;
                newErrors.capacityInfo = `Guest count (${totalGuests}) is over standard capacity of ${baseCapacity}. ` +
                                         `Please use Notes for special requests (e.g., extra bedding for ${totalGuests - baseCapacity} extra guest(s)). Charges may apply.`;
                if (!formData.notes.trim()) { 
                    newErrors.notes = "Notes are required when guest count is over standard room capacity. Please specify needs.";
                    formIsValid = false; 
                }
            }
        } else if (selectedRoomDetails) {
             console.warn(`Room ${selectedRoomDetails.name} has invalid capacity data: ${selectedRoomDetails.capacity}`);
        }
    }
    
    setErrors(newErrors);
    return formIsValid;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, availableRoomsForForm]); // Add dependencies for validateForm

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalSubmissionError(null); 
    if (validateForm()) { // validateForm will set client-side errors if any
      const dataToSubmit: ReservationData = { 
        ...formData,
        adults: Number(formData.adults) || 0,
        children: Number(formData.children) || 0,
        seniors: Number(formData.seniors) || 0,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        notes: formData.notes.trim(),
      };
      onSubmit(dataToSubmit); 
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.reservationOverlay}>
      <div className={styles.reservationModal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>New Reservation</h2>
          <button onClick={onClose} className={styles.closeButton} aria-label="Close">×</button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          {localSubmissionError && (
            <div className={`${styles.formGroup} ${styles.submissionErrorContainer}`}>
              <p className={`${styles.errorMessage} ${styles.submissionError}`}>{localSubmissionError}</p>
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.formLabel}>Guest Name</label>
            <input id="name" type="text" name="name" value={formData.name} onChange={handleChange} className={`${styles.formInput} ${errors.name ? styles.inputError : ''}`} placeholder="Enter guest name"/>
            {errors.name && <p className={styles.errorMessage}>{errors.name}</p>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="room" className={styles.formLabel}>Room</label>
            <select id="room" name="room" value={formData.room} onChange={handleChange} className={`${styles.formSelect} ${errors.room ? styles.inputError : ''}`} disabled={availableRoomsForForm.length === 0}>
              <option value="">{availableRoomsForForm.length === 0 ? "No rooms available" : "Select a room"}</option>
              {availableRoomsForForm.map(roomOption => (
                <option key={roomOption.id} value={roomOption.id}>
                  {roomOption.name} 
                  {roomOption.price > 0 ? ` (\u20B1${roomOption.price.toFixed(2)}/night)` : ''}
                  {roomOption.capacity > 0 ? ` (Capacity: ${roomOption.capacity})` : ''}
                </option>
              ))}
            </select>
            {errors.room && <p className={styles.errorMessage}>{errors.room}</p>}
            {availableRoomsForForm.length === 0 && !errors.room && <p className={styles.warningMessage}>No rooms currently available.</p>}
          </div>

          <div className={`${styles.formGrid} ${styles.formGrid2}`}>
            <div>
              <label htmlFor="checkIn" className={styles.formLabel}>Check-in Date</label>
              <DatePicker id="checkIn" selected={formData.checkIn && !isNaN(formData.checkIn.getTime()) ? formData.checkIn : null} onChange={(date) => handleDateChange(date, 'checkIn')} className={`${styles.formInput} ${errors.checkIn ? styles.inputError : ''}`} dateFormat="MMMM d, yyyy" minDate={new Date()} autoComplete="off"/>
              {errors.checkIn && <p className={styles.errorMessage}>{errors.checkIn}</p>}
            </div>
            <div>
              <label htmlFor="checkOut" className={styles.formLabel}>Check-out Date{checkoutDisabled && (<span className={styles.disabledFieldNote}> (Auto-adjusts)</span>)}</label>
              <DatePicker id="checkOut" selected={formData.checkOut && !isNaN(formData.checkOut.getTime()) ? formData.checkOut : null} onChange={(date) => handleDateChange(date, 'checkOut')} className={`${styles.formInput} ${checkoutDisabled ? styles.inputDisabled : ''} ${errors.checkOut ? styles.inputError : ''}`} dateFormat="MMMM d, yyyy" minDate={formData.checkIn && !isNaN(formData.checkIn.getTime()) ? new Date(new Date(formData.checkIn).setDate(formData.checkIn.getDate() + 1)) : new Date(new Date().setDate(new Date().getDate() + 1))} disabled={checkoutDisabled} autoComplete="off"/>
              {errors.checkOut && <p className={styles.errorMessage}>{errors.checkOut}</p>}
            </div>
          </div>
          
          <div className={`${styles.formGrid} ${styles.formGrid2}`}>
            <div><label className={styles.formLabel}>Number of Nights</label><input type="text" value={formData.numberOfNights} readOnly className={`${styles.formInput} ${styles.formInputReadonly}`}/></div>
            <div><label className={styles.formLabel}>Estimated Price</label><input type="text" value={formData.calculatedPrice > 0 ? `\u20B1${formData.calculatedPrice.toFixed(2)}` : (formData.numberOfNights > 0 && formData.room ? 'Select room...' : 'N/A')} readOnly className={`${styles.formInput} ${styles.formInputReadonly}`}/></div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="phone" className={styles.formLabel}>Phone Number</label>
            <input id="phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} className={`${styles.formInput} ${errors.phone ? styles.inputError : ''}`} placeholder="Enter phone number"/>
            {errors.phone && <p className={styles.errorMessage}>{errors.phone}</p>}
          </div>

          <div className={`${styles.formGrid} ${styles.formGrid3}`}>
            <div><label htmlFor="adults" className={styles.formLabel}>Adults</label><input id="adults" type="number" name="adults" min="0" value={formData.adults} onChange={handleChange} className={`${styles.formInput} ${errors.adults ? styles.inputError : ''}`}/></div>
            <div><label htmlFor="children" className={styles.formLabel}>Children</label><input id="children" type="number" name="children" min="0" value={formData.children} onChange={handleChange} className={`${styles.formInput} ${errors.children ? styles.inputError : ''}`}/></div>
            <div><label htmlFor="seniors" className={styles.formLabel}>Seniors</label><input id="seniors" type="number" name="seniors" min="0" value={formData.seniors} onChange={handleChange} className={`${styles.formInput} ${errors.seniors ? styles.inputError : ''}`}/></div>
          </div>
          {errors.adults && <div className={styles.formGroup}><p className={styles.errorMessage}>{errors.adults}</p></div>}
          {errors.children && <div className={styles.formGroup}><p className={styles.errorMessage}>{errors.children}</p></div>}
          {errors.seniors && <div className={styles.formGroup}><p className={styles.errorMessage}>{errors.seniors}</p></div>}
          {errors.capacity && <div className={styles.formGroup}><p className={`${styles.errorMessage} ${styles.capacityError}`}>{errors.capacity}</p></div>}
          {!errors.capacity && errors.capacityInfo && (
            <div className={styles.formGroup}><p className={`${styles.infoMessage} ${styles.capacityInfoMessage}`}>{errors.capacityInfo}</p></div>
          )}

          <div className={styles.formGroup}><label className={styles.formLabel}>Total People</label><input type="text" value={formData.totalPeople} readOnly className={`${styles.formInput} ${styles.formInputReadonly}`}/></div>
          <div className={styles.formGroup}><label className={styles.formLabel}>Reservation Type</label><input type="text" value={formData.type} readOnly className={`${styles.formInput} ${styles.formInputReadonly}`}/></div>
          
          <div className={styles.formGroup}>
              <label htmlFor="notes" className={styles.formLabel}>
                Notes 
                {(!errors.capacity && errors.capacityInfo && errors.notes) && 
                  <span className={styles.requiredIfOverCapacity}> (Required for {formData.totalPeople} guests)</span>
                } 
                <span className={styles.characterCount}>{formData.notes.length}/150</span>
              </label>
              <textarea 
                id="notes" name="notes" value={formData.notes} onChange={handleChange} 
                maxLength={150} 
                className={`${styles.formInput} ${styles.textArea} ${errors.notes ? styles.inputError : ''}`}
                placeholder="Additional requests, e.g., extra bedding if over capacity..." rows={3}
              />
              {errors.notes && <p className={styles.errorMessage}>{errors.notes}</p>}
          </div>
          {errors.general && <div className={styles.formGroup}><p className={styles.errorMessage}>{errors.general}</p></div>}

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