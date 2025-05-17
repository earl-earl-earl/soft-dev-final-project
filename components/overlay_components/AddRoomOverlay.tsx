import React, { useState, useEffect, useRef } from 'react';
import styles from '../component_styles/FilterOverlay.module.css';
import Image from 'next/image';

export interface RoomFormData {
  name: string;
  roomNumber: string;
  capacity: number;
  price: number;
  amenities: string[];
  isActive: boolean;
  images: File[]; // Add this new field
}

interface AddRoomOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RoomFormData) => void;
  existingRooms: { id: string; name: string; roomNumber: string; amenities?: string[] }[];
  formErrors?: Record<string, string>;
}

const AddRoomOverlay: React.FC<AddRoomOverlayProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingRooms,
  formErrors = {} // Set default to empty object if not provided
}) => {
  const [formData, setFormData] = useState<RoomFormData>({
    name: '',
    roomNumber: '',
    capacity: 1,
    price: 0,
    amenities: [],
    isActive: true,
    images: [] // Initialize empty images array
  });
  
  // Create local state for form errors initialized with props
  const [formErrorsState, setFormErrors] = useState<Record<string, string>>(formErrors);
  const [amenityInput, setAmenityInput] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    
    if (formData.amenities.length >= 10) {  // Changed from 3 to 10
      setError('Maximum 10 amenities allowed');  // Changed from 3 to 10
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file types
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      setImageError('Only image files are allowed');
      return;
    }
    
    // Check total number of images (existing + new)
    const totalImages = formData.images.length + files.length;
    if (totalImages > 3) {
      setImageError('Maximum 3 images allowed');
      return;
    }
    
    // Add new images
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files].slice(0, 3)
    }));
    
    setImageError(null);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setImageError(null);
  };

  // Modify validateForm to include image validation
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
    
    // Validate images
    if (formData.images.length !== 3) {
      setImageError('Exactly 3 images are required');
      errors.images = 'Exactly 3 images are required';
    } else {
      setImageError(null);
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // First, validate client-side
    if (!validateForm()) {
      setError('Please fix the errors in the form');
      return;
    }
    
    // If validation passes, submit the form data
    onSubmit(formData);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.filterOverlayContent}>
        <div className={styles.overlayHeader}>
          <h2>Add New Room</h2>
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
                onChange={handleChange}
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
                onChange={handleChange}
                min="1"
                step="100"
                placeholder="Enter price in PHP"
                className={formErrorsState.price ? styles.inputError : ''}
                required
              />
              {formErrorsState.price && <p className={styles.errorText}>{formErrorsState.price}</p>}
            </div>
            
            <div className={styles.filterField}>
              <label>Amenities (max 10)</label>  {/* Changed from 3 to 10 */}
              <div className={styles.amenityInputContainer} ref={dropdownRef}>
                <input 
                  type="text"
                  value={amenityInput}
                  onChange={handleAmenityInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => amenityInput && setDropdownOpen(true)}
                  placeholder="Type or select amenity"
                  disabled={formData.amenities.length >= 10/* Changed from 3 to 10 */}
                  className={error ? styles.inputError : ''}
                />
                <button 
                  type="button" 
                  className={styles.addButton}
                  onClick={() => addAmenity()}
                  disabled={formData.amenities.length >= 10 || !amenityInput.trim()/* Changed from 3 to 10 */}
                >
                  Add
                </button>
                
                {dropdownOpen && filteredAmenities.length > 0 && (
                  <div className={styles.amenityDropdown}>
                    {filteredAmenities.map(amenity => (
                      <div 
                        key={amenity} 
                        className={styles.amenityOption}
                        onClick={() => {
                          addAmenity(amenity);
                        }}
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
          </div>

          <div className={styles.filterSection}>
            <h3>Room Images</h3>
            <div className={styles.filterField}>
              <label className={styles.requiredField}>Upload Images (exactly 3)</label>
              
              <div className={styles.imageUploadContainer}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  multiple
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={styles.uploadButton}
                  disabled={formData.images.length >= 3}
                >
                  <i className="fa-regular fa-image"></i> Select Images
                </button>
                
                <span className={styles.uploadInfo}>
                  {formData.images.length}/3 images selected
                </span>
              </div>
              
              {imageError && <p className={styles.errorText}>{imageError}</p>}
              
              {formData.images.length > 0 && (
                <div className={styles.imagePreviewContainer}>
                  {formData.images.map((image, index) => (
                    <div key={index} className={styles.imagePreview}>
                      <Image
                        src={URL.createObjectURL(image)}
                        alt={`Room preview ${index + 1}`}
                        width={100}
                        height={100}
                        style={{ objectFit: 'cover' }}
                        unoptimized
                      />
                      <button 
                        type="button" 
                        onClick={() => removeImage(index)}
                        className={styles.removeImageButton}
                      >
                        <i className="fa-regular fa-xmark"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className={styles.filterActions}>
            <button 
              type="submit" 
              className={styles.applyButton}
            >
              Add Room
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRoomOverlay;