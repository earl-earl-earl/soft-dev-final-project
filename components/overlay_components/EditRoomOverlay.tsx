import React, { useState, useEffect, useRef } from 'react';
import styles from '../component_styles/FilterOverlay.module.css';

export interface RoomFormData {
  name: string;
  roomNumber: string;
  capacity: number;
  price: number;
  amenities: string[];
  isActive: boolean;
}

interface EditRoomOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RoomFormData) => void;
  existingRooms: { id: string; name: string; roomNumber: string; amenities?: string[] }[];
  formErrors?: Record<string, string>;
  room: {
    id: string;
    name: string;
    roomNumber: string;
    capacity: number;
    price: number;
    amenities: string[];
    isActive: boolean;
    [key: string]: unknown;
  };
}

const EditRoomOverlay: React.FC<EditRoomOverlayProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingRooms,
  formErrors = {}, // Set default to empty object if not provided
  room
}) => {
  const [formData, setFormData] = useState<RoomFormData>({
    name: room.name,
    roomNumber: room.roomNumber,
    capacity: room.capacity,
    price: room.price,
    amenities: [...room.amenities],
    isActive: room.isActive
  });
  
  // Create local state for form errors initialized with props
  const [formErrorsState, setFormErrors] = useState<Record<string, string>>(formErrors);
  const [amenityInput, setAmenityInput] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update form data when room prop changes
  useEffect(() => {
    setFormData({
      name: room.name,
      roomNumber: room.roomNumber,
      capacity: room.capacity,
      price: room.price,
      amenities: [...room.amenities],
      isActive: room.isActive
    });
  }, [room]);

  // Extract unique amenities from existing rooms
  const allExistingAmenities = [...new Set(existingRooms.flatMap(room => room.amenities || []))];
  
  // Filter amenities based on input
  const filteredAmenities = allExistingAmenities
    .filter(amenity => 
      amenity && amenity.toLowerCase().includes(amenityInput.toLowerCase()) && 
      !formData.amenities.includes(amenity)
    );

  // Handle clicks outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field-specific errors when the user makes changes
    if (formErrorsState[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAmenityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmenityInput(e.target.value);
    if (e.target.value) {
      setDropdownOpen(true);
    } else {
      setDropdownOpen(false);
    }
    setError(null);
  };

  const addAmenity = (amenity: string = amenityInput.trim()) => {
    const trimmedAmenity = amenity.trim();
    
    if (!trimmedAmenity) return;
    
    if (formData.amenities.length >= 3) {
      setError('Maximum 3 amenities allowed');
      return;
    }
    
    if (formData.amenities.includes(trimmedAmenity)) {
      setError('This amenity is already added');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      amenities: [...prev.amenities, trimmedAmenity]
    }));
    
    setAmenityInput('');
    setDropdownOpen(false);
  };

  const removeAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity)
    }));
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addAmenity();
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Validate room name
    if (!formData.name.trim()) {
      errors.name = 'Room name is required';
    }
    
    // Validate room number
    if (!formData.roomNumber.trim()) {
      errors.roomNumber = 'Room number is required';
    }
    
    // Validate capacity
    if (formData.capacity < 1) {
      errors.capacity = 'Capacity must be at least 1';
    }
    
    // Validate price
    if (formData.price <= 0) {
      errors.price = 'Price must be greater than 0';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    
    // First, validate client-side
    if (!validateForm()) {
      console.log('Form validation failed', formErrorsState);
      setError('Please fix the errors in the form');
      return;
    }
    
    // If validation passes, submit the form data
    console.log('Form is valid, calling onSubmit');
    onSubmit(formData);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.filterOverlayContent}>
        <div className={styles.overlayHeader}>
          <h2>Edit Room</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fa-regular fa-xmark"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.filterForm} noValidate>
          <div className={styles.filterSection}>
            <h3>Room Details</h3>
            
            <div className={styles.filterField}>
              <label className={styles.requiredField}>Room Name</label>
              <input 
                type="text" 
                name="name" 
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter room name"
                className={formErrorsState.name ? styles.inputError : ''}
                required
              />
              {formErrorsState.name && <p className={styles.errorText}>{formErrorsState.name}</p>}
            </div>
            
            <div className={styles.filterField}>
              <label className={styles.requiredField}>Room Number</label>
              <input 
                type="text" 
                name="roomNumber" 
                value={formData.roomNumber}
                onChange={handleChange}
                placeholder="e.g., #001"
                className={formErrorsState.roomNumber ? styles.inputError : ''}
                required
              />
              {formErrorsState.roomNumber && <p className={styles.errorText}>{formErrorsState.roomNumber}</p>}
            </div>
            
            <div className={styles.filterField}>
              <label className={styles.requiredField}>Capacity (persons)</label>
              <input 
                type="number" 
                name="capacity" 
                value={formData.capacity}
                onChange={e => {
                  const numericValue = e.target.value ? parseInt(e.target.value) : 1;
                  setFormData(prev => ({ ...prev, capacity: numericValue }));
                  // Also call handleChange with string value for error handling
                  handleChange({...e, target: {...e.target, value: String(numericValue)}});
                }}
                min="1"
                className={formErrorsState.capacity ? styles.inputError : ''}
                required
              />
              {formErrorsState.capacity && <p className={styles.errorText}>{formErrorsState.capacity}</p>}
            </div>
            
            <div className={styles.filterField}>
              <label className={styles.requiredField}>Price (PHP)</label>
              <input 
                type="number" 
                name="price" 
                value={formData.price}
                min="1"
                step="100"
                placeholder="Enter price in PHP"
                className={formErrorsState.price ? styles.inputError : ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const numericValue = e.target.value ? parseInt(e.target.value) : 0;
                  setFormData(prev => ({ ...prev, price: numericValue }));
                  // Also call handleChange with string value for error handling
                  handleChange({...e, target: {...e.target, value: String(numericValue)}});
                }}
              />
              {formErrorsState.price && <p className={styles.errorText}>{formErrorsState.price}</p>}
            </div>
            
            <div className={styles.filterField}>
              <label>Amenities (max 3)</label>
              <div className={styles.amenityInputContainer} ref={dropdownRef}>
                <input 
                  type="text"
                  value={amenityInput}
                  onChange={handleAmenityInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => amenityInput && setDropdownOpen(true)}
                  placeholder="Type or select amenity"
                  disabled={formData.amenities.length >= 3}
                  className={error ? styles.inputError : ''}
                />
                <button 
                  type="button" 
                  className={styles.addButton}
                  onClick={() => addAmenity()}
                  disabled={formData.amenities.length >= 3 || !amenityInput.trim()}
                >
                  Add
                </button>
                
                {dropdownOpen && filteredAmenities.length > 0 && (
                  <div className={styles.amenityDropdown}>
                    {filteredAmenities.map(amenity => (
                      <div 
                        key={amenity} 
                        className={styles.amenityOption}
                        onClick={() => addAmenity(amenity)}
                      >
                        {amenity}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {error && <p className={styles.errorText}>{error}</p>}
              
              {formData.amenities.length > 0 && (
                <div className={styles.amenityTags}>
                  {formData.amenities.map(amenity => (
                    <div key={amenity} className={styles.amenityTag}>
                      <span>{amenity}</span>
                      <button 
                        type="button" 
                        onClick={() => removeAmenity(amenity)}
                        className={styles.removeTag}
                      >
                        <i className="fa-regular fa-xmark"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className={styles.filterField}>
              <label>Status</label>
              <div className={styles.toggleContainer}>
                <span className={!formData.isActive ? styles.activeLabel : ''}>Inactive</span>
                <div className={styles.toggleSwitch}>
                  <input 
                    type="checkbox" 
                    id={`status-toggle-${room.id}`}
                    checked={formData.isActive}
                    onChange={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                  />
                  <label htmlFor={`status-toggle-${room.id}`}></label>
                </div>
                <span className={formData.isActive ? styles.activeLabel : ''}>Active</span>
              </div>
            </div>
          </div>

          <div className={styles.filterActions}>
            <button 
              type="submit" 
              className={styles.applyButton}
            >
              Update Room
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRoomOverlay;