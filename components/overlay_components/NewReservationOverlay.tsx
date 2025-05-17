import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styles from '@components/component_styles/NewReservationOverlay.module.css';

interface NewReservationOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reservationData: ReservationData) => void;
  availableRooms?: string[];
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
  notes: string; // Add notes field
}

const NewReservationOverlay: React.FC<NewReservationOverlayProps> = ({
  isOpen,
  onClose,
  onSubmit,
  availableRooms = []
}) => {
  const [formData, setFormData] = useState<ReservationData>({
    name: '',
    room: availableRooms.length > 0 ? availableRooms[0] : '',
    checkIn: new Date(),
    checkOut: new Date(new Date().setDate(new Date().getDate() + 1)), // Default to tomorrow
    phone: '',
    adults: 1,
    children: 0,
    seniors: 0,
    totalPeople: 1,
    type: 'direct', // Fixed as required
    notes: '' // Initialize notes as empty string
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ReservationData, string>>>({});
  const [checkoutDisabled, setCheckoutDisabled] = useState(false);

  // Calculate total people whenever adults, children or seniors change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      totalPeople: prev.adults + prev.children + prev.seniors
    }));
  }, [formData.adults, formData.children, formData.seniors]);

  // Check date validity whenever check-in or check-out changes
  useEffect(() => {
    const isCheckInAfterCheckOut = formData.checkIn >= formData.checkOut;
    setCheckoutDisabled(isCheckInAfterCheckOut);
    
    // If dates are invalid and we have a checkout error, keep it
    // If dates become valid, clear the error
    if (!isCheckInAfterCheckOut && errors.checkOut) {
      setErrors(prev => ({ ...prev, checkOut: '' }));
    }
  }, [errors.checkOut, formData.checkIn, formData.checkOut]);

  // Update the selected room whenever availableRooms changes
  useEffect(() => {
    console.log("Available rooms in overlay:", availableRooms);
    if (availableRooms.length > 0 && !formData.room) {
      setFormData(prev => ({
        ...prev,
        room: availableRooms[0]
      }));
    }
  }, [availableRooms, formData.room]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Convert numeric fields to numbers
    const numericFields = ['adults', 'children', 'seniors'];
    const parsedValue = numericFields.includes(name) ? parseInt(value, 10) : value;
    
    setFormData({
      ...formData,
      [name]: parsedValue
    });

    // Clear error for this field
    if (errors[name as keyof ReservationData]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleDateChange = (date: Date | null, field: 'checkIn' | 'checkOut') => {
    if (date) {
      if (field === 'checkIn') {
        // When changing check-in date
        const newCheckIn = new Date(date);
        
        // If new check-in date is after or equal to checkout, adjust checkout date
        if (newCheckIn >= formData.checkOut) {
          // Set checkout to check-in + 1 day
          const newCheckOut = new Date(newCheckIn);
          newCheckOut.setDate(newCheckOut.getDate() + 1);
          
          setFormData({
            ...formData,
            checkIn: newCheckIn,
            checkOut: newCheckOut
          });
        } else {
          // Just update check-in date
          setFormData({
            ...formData,
            checkIn: newCheckIn
          });
        }
      } else {
        // When changing check-out date
        const newCheckOut = new Date(date);
        
        // Only update if it's a valid date (after check-in)
        if (newCheckOut > formData.checkIn) {
          setFormData({
            ...formData,
            checkOut: newCheckOut
          });
          
          // Clear any existing error
          if (errors.checkOut) {
            setErrors(prev => ({ ...prev, checkOut: '' }));
          }
        }
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ReservationData, string>> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    // Only validate room if there are available rooms
    if (availableRooms.length > 0 && (!formData.room || formData.room === '')) {
      newErrors.room = 'Room selection is required';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    
    if (formData.adults < 1) {
      newErrors.adults = 'At least one adult is required';
    }
    
    if (formData.checkOut <= formData.checkIn) {
      newErrors.checkOut = 'Checkout date must be after checkin date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.reservationOverlay}>
      <div className={styles.reservationModal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>New Reservation</h2>
          <button 
            onClick={onClose}
            className={styles.closeButton}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Guest Name and Room Selection on same line */}
          <div className={`${styles.formGrid} ${styles.formGrid2}`}>
            <div>
              <label className={styles.formLabel}>Guest Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`${styles.formInput} ${errors.name ? styles.inputError : ''}`}
                placeholder="Enter guest name"
              />
              {errors.name && <p className={styles.errorMessage}>{errors.name}</p>}
            </div>
            <div>
              <label className={styles.formLabel}>Room</label>
              <select
                name="room"
                value={formData.room}
                onChange={handleChange}
                className={`${styles.formSelect} ${errors.room ? styles.inputError : ''}`}
              >
                {availableRooms.length === 0 ? (
                  <option value="">No rooms available</option>
                ) : (
                  availableRooms.map(room => (
                    <option key={room} value={room}>{room}</option>
                  ))
                )}
              </select>
              {errors.room && <p className={styles.errorMessage}>{errors.room}</p>}
            </div>
          </div>

          {/* Check-in and Check-out dates */}
          <div className={`${styles.formGrid} ${styles.formGrid2}`}>
            <div>
              <label className={styles.formLabel}>Check-in Date</label>
              <DatePicker
                selected={formData.checkIn}
                onChange={(date) => handleDateChange(date, 'checkIn')}
                className={styles.formInput}
                dateFormat="MMMM d, yyyy"
                minDate={new Date()}
              />
            </div>
            <div>
              <label className={styles.formLabel}>
                Check-out Date
                {checkoutDisabled && (
                  <span className={styles.disabledFieldNote}>
                    Update check-in first
                  </span>
                )}
              </label>
              <DatePicker
                selected={formData.checkOut}
                onChange={(date) => handleDateChange(date, 'checkOut')}
                className={`${styles.formInput} ${checkoutDisabled ? styles.inputDisabled : ''} ${errors.checkOut ? styles.inputError : ''}`}
                dateFormat="MMMM d, yyyy"
                minDate={new Date(formData.checkIn.getTime() + 86400000)} // +1 day from check-in
                disabled={checkoutDisabled}
              />
              {errors.checkOut && <p className={styles.errorMessage}>{errors.checkOut}</p>}
              {checkoutDisabled && !errors.checkOut && (
                <p className={styles.warningMessage}>Please select an earlier check-in date</p>
              )}
            </div>
          </div>

          {/* Phone Number */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`${styles.formInput} ${errors.phone ? styles.inputError : ''}`}
              placeholder="Enter phone number"
            />
            {errors.phone && <p className={styles.errorMessage}>{errors.phone}</p>}
          </div>

          {/* Guest Count */}
          <div className={`${styles.formGrid} ${styles.formGrid3}`}>
            <div>
              <label className={styles.formLabel}>Adults</label>
              <input
                type="number"
                name="adults"
                min="1"
                value={formData.adults}
                onChange={handleChange}
                className={`${styles.formInput} ${errors.adults ? styles.inputError : ''}`}
              />
              {errors.adults && <p className={styles.errorMessage}>{errors.adults}</p>}
            </div>
            <div>
              <label className={styles.formLabel}>Children</label>
              <input
                type="number"
                name="children"
                min="0"
                value={formData.children}
                onChange={handleChange}
                className={styles.formInput}
              />
            </div>
            <div>
              <label className={styles.formLabel}>Senior Citizens</label>
              <input
                type="number"
                name="seniors"
                min="0"
                value={formData.seniors}
                onChange={handleChange}
                className={styles.formInput}
              />
            </div>
          </div>

          {/* Total People (Read-only) */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Total People</label>
            <input
              type="number"
              value={formData.totalPeople}
              readOnly
              className={`${styles.formInput} ${styles.formInputReadonly}`}
            />
          </div>

          {/* Reservation Type (Fixed as direct) */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Reservation Type</label>
            <input
              type="text"
              value={formData.type}
              readOnly
              className={`${styles.formInput} ${styles.formInputReadonly}`}
            />
          </div>

          {/* Notes with character limit */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Notes (Optional)
              <span className={styles.characterCount}>
                {formData.notes.length}/150
              </span>
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              maxLength={150}
              className={`${styles.formInput} ${styles.textArea}`}
              placeholder="Additional information or special requests"
              rows={1}
            />
          </div>

          {/* Buttons */}
          <div className={styles.buttonContainer}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
            >
              Create Reservation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewReservationOverlay;