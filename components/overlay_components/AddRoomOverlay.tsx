import React, { useState, useEffect, useRef } from 'react';
import styles from '../component_styles/FilterOverlay.module.css';
import Image from 'next/image';

// 1. Update RoomFormData interface
export interface RoomFormData {
  name: string;
  // roomNumber: string; // Removed
  capacity: number;
  price: number;
  amenities: string[];
  isActive: boolean;
  images: File[];
  panoramicImage?: File;
}

interface AddRoomOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RoomFormData) => void;
  existingRooms: { id: string; name: string; amenities?: string[] }[];
  formErrors?: Record<string, string>;
}

const AddRoomOverlay: React.FC<AddRoomOverlayProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingRooms,
  formErrors = {}
}) => {
  // 2. Update initial formData state
  const [formData, setFormData] = useState<RoomFormData>({
    name: '',
    // roomNumber: '', // Removed
    capacity: 1,
    price: 0,
    amenities: [],
    isActive: true,
    images: [],
    panoramicImage: undefined
  });
  
  const [formErrorsState, setFormErrors] = useState<Record<string, string>>(formErrors);
  const [amenityInput, setAmenityInput] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [panoramicImageError, setPanoramicImageError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const panoramicFileInputRef = useRef<HTMLInputElement>(null); // Ref for panoramic image input
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allExistingAmenities = [...new Set(existingRooms.flatMap(room => room.amenities || []))];
  
  const filteredAmenities = allExistingAmenities
    .filter(amenity =>
      amenity && amenity.toLowerCase().includes(amenityInput.toLowerCase()) &&
      !formData.amenities.includes(amenity)
    );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value 
    }));
    if (formErrorsState[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    setError(null);
  };

  const handleAmenityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmenityInput(e.target.value);
    setDropdownOpen(!!e.target.value);
    setError(null);
  };

  const addAmenity = (amenity: string = amenityInput.trim()) => {
    const trimmedAmenity = amenity.trim();
    if (!trimmedAmenity) return;
    if (formData.amenities.length >= 10) {
      setError('Maximum 10 amenities allowed');
      return;
    }
    if (formData.amenities.includes(trimmedAmenity)) {
      setError('This amenity is already added');
      return;
    }
    setFormData(prev => ({ ...prev, amenities: [...prev.amenities, trimmedAmenity] }));
    setAmenityInput('');
    setDropdownOpen(false);
  };

  const removeAmenity = (amenity: string) => {
    setFormData(prev => ({ ...prev, amenities: prev.amenities.filter(a => a !== amenity) }));
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
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      setImageError('Only image files are allowed');
      return;
    }
    const totalImages = formData.images.length + files.length;
    if (totalImages > 3) {
      setImageError('Maximum 3 images allowed');
      // Only add up to the limit
      const remainingSlots = 3 - formData.images.length;
      if (remainingSlots > 0) {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...files.slice(0, remainingSlots)]
        }));
      }
      return;
    }
    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    setImageError(null);
  };

  // 4. Handler for panoramic image upload
  const handlePanoramicImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setPanoramicImageError('Only image files are allowed for panoramic view.');
        setFormData(prev => ({ ...prev, panoramicImage: undefined }));
        if (panoramicFileInputRef.current) panoramicFileInputRef.current.value = '';
        return;
      }
      setFormData(prev => ({ ...prev, panoramicImage: file }));
      setPanoramicImageError(null);
    } else {
        // If no file is selected (e.g., user cancels dialog), clear existing
        setFormData(prev => ({ ...prev, panoramicImage: undefined }));
    }
    // Don't reset panoramicFileInputRef.current.value here if you want to show the selected file name
    // Resetting it makes it seem like nothing was selected if the user re-opens the dialog.
  };

  // Handler to remove selected panoramic image
  const removePanoramicImage = () => {
    setFormData(prev => ({ ...prev, panoramicImage: undefined }));
    setPanoramicImageError(null);
    if (panoramicFileInputRef.current) {
      panoramicFileInputRef.current.value = ''; // Clear the file input
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    let hasErrors = false;

    if (!formData.name.trim()) {
      errors.name = 'Room name is required';
      hasErrors = true;
    }
    // Room number validation removed
    if (formData.capacity < 1) {
      errors.capacity = 'Capacity must be at least 1';
      hasErrors = true;
    }
    if (formData.price <= 0) {
      errors.price = 'Price must be greater than 0';
      hasErrors = true;
    }
    if (formData.images.length !== 3) {
      setImageError('Exactly 3 regular images are required');
      errors.images = 'Exactly 3 regular images are required';
      hasErrors = true;
    } else {
      setImageError(null);
    }

    // Validate panoramic image (e.g., make it required)
    if (!formData.panoramicImage) {
      setPanoramicImageError('A panoramic image is required.');
      errors.panoramicImage = 'A panoramic image is required.';
      hasErrors = true;
    } else {
      setPanoramicImageError(null);
    }
    
    setFormErrors(errors);
    return !hasErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setError('Please fix the errors in the form.');
      const firstErrorField = document.querySelector(`.${styles.inputError}, .${styles.errorText}`);
      if (firstErrorField instanceof HTMLElement) {
          firstErrorField.focus();
      }
      return;
    }
    setError(null);
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
          {error && <p className={`${styles.errorText} ${styles.generalFormError}`}>{error}</p>}
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
            
            {/* Room Number field removed */}
            
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
              <label>Amenities (max 10)</label>
              <div className={styles.amenityInputContainer} ref={dropdownRef}>
                <input 
                  type="text"
                  value={amenityInput}
                  onChange={handleAmenityInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => amenityInput && setDropdownOpen(true)}
                  placeholder="Type or select amenity"
                  disabled={formData.amenities.length >= 10}
                  className={formErrorsState.amenities ? styles.inputError : ''}
                />
                <button 
                  type="button" 
                  className={styles.addButton}
                  onClick={() => addAmenity()}
                  disabled={formData.amenities.length >= 10 || !amenityInput.trim()}
                >
                  Add
                </button>
                {dropdownOpen && filteredAmenities.length > 0 && (
                  <div className={styles.amenityDropdown}>
                    {filteredAmenities.map(amenity => (
                      <div key={amenity} className={styles.amenityOption} onClick={() => addAmenity(amenity)}>
                        {amenity}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {formErrorsState.amenities && <p className={styles.errorText}>{formErrorsState.amenities}</p>}
              {formData.amenities.length > 0 && (
                <div className={styles.amenityTags}>
                  {formData.amenities.map(amenity => (
                    <div key={amenity} className={styles.amenityTag}>
                      <span>{amenity}</span>
                      <button type="button" onClick={() => removeAmenity(amenity)} className={styles.removeTag}>
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
              <label className={styles.requiredField}>Upload Regular Images (exactly 3)</label>
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
              {formErrorsState.images && !imageError && <p className={styles.errorText}>{formErrorsState.images}</p>}
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
                        onLoad={() => URL.revokeObjectURL(image as any)}
                      />
                      <button type="button" onClick={() => removeImage(index)} className={styles.removeImageButton}>
                        <i className="fa-regular fa-xmark"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 3. UI for Panoramic Image Upload */}
          <div className={styles.filterSection}>
            <h3>Panoramic Image</h3>
            <div className={styles.filterField}>
              <label className={styles.requiredField}>Upload Panoramic Image (1 required)</label>
              <div className={styles.imageUploadContainer}>
                <input
                  type="file"
                  accept="image/*" // Consider more specific types if needed, e.g., image/jpeg, image/png
                  onChange={handlePanoramicImageUpload}
                  ref={panoramicFileInputRef}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => panoramicFileInputRef.current?.click()}
                  className={styles.uploadButton}
                  disabled={!!formData.panoramicImage} // Disable if one is already selected
                >
                  <i className="fa-regular fa-panorama"></i> Select Panoramic Image
                </button>
                {formData.panoramicImage && (
                  <span className={styles.uploadInfo} style={{ marginLeft: '10px' }}>
                    1 panoramic image selected.
                  </span>
                )}
              </div>
              {panoramicImageError && <p className={styles.errorText}>{panoramicImageError}</p>}
              {formErrorsState.panoramicImage && !panoramicImageError && <p className={styles.errorText}>{formErrorsState.panoramicImage}</p>}

              {formData.panoramicImage && (
                <div className={styles.imagePreviewContainer} style={{ marginTop: '10px' }}>
                  <div className={styles.imagePreview} style={{ width: '200px', height: '100px' /* Adjust for panoramic aspect */}}>
                    <Image
                      src={URL.createObjectURL(formData.panoramicImage)}
                      alt="Panoramic preview"
                      width={200} // Adjust as needed
                      height={100}
                      style={{ objectFit: 'contain' }} // 'contain' might be better for panoramic
                      unoptimized
                      onLoad={() => URL.revokeObjectURL(formData.panoramicImage as any)}
                    />
                    <button 
                      type="button" 
                      onClick={removePanoramicImage}
                      className={styles.removeImageButton}
                      title="Remove panoramic image"
                    >
                      <i className="fa-regular fa-xmark"></i>
                    </button>
                  </div>
                  <p className={styles.fileNamePreview}>{formData.panoramicImage.name}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className={styles.filterActions}>
            <button type="submit" className={styles.applyButton}>Add Room</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRoomOverlay;