import React, { useState, useEffect, useRef } from 'react';
import styles from '../component_styles/FilterOverlay.module.css';
import Image from 'next/image';
import { RoomFormData } from '../../src/types/room'; // Assuming RoomFormData is correctly defined
import { Room as RoomType } from '../../src/types/room'; // Import Room type for the 'room' prop

interface EditRoomOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RoomFormData) => void;
  existingRooms: { id: string; name: string; amenities?: string[] }[];
  formErrors?: Record<string, string>;
  room: RoomType; // Use the imported RoomType
}

const EditRoomOverlay: React.FC<EditRoomOverlayProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingRooms,
  formErrors = {},
  room // This 'room' object should contain image_paths and panoramic_image_path
}) => {
  const [formData, setFormData] = useState<RoomFormData>({
    name: room.name,
    capacity: room.capacity,
    // Use room.room_price if that's the actual field name in your RoomType
    price: typeof room.room_price === 'number'
      ? room.room_price
      : typeof room.price === 'number'
        ? room.price
        : 0, // Handle potential naming diff and ensure number type
    amenities: room.amenities ? [...room.amenities] : [],
    is_active: room.is_active,
    // Initialize with existing image URLs from room.image_paths
    images: room.image_paths ? [...room.image_paths] : [], 
    // Initialize with existing panoramic image URL from room.panoramic_image_path
    panoramicImage: room.panoramic_image_path || undefined, 
  });
  
  // ... (other states: formErrorsState, amenityInput, errors, imageError, panoramicImageError, refs)
  const [formErrorsState, setFormErrorsState] = useState<Record<string, string>>(formErrors);
  const [amenityInput, setAmenityInput] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [panoramicImageError, setPanoramicImageError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const panoramicFileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    // When the room prop changes (e.g., opening overlay for a different room)
    // or when external formErrors are passed, reset the form.
    setFormData({
      name: room.name,
      capacity: room.capacity,
      price: typeof room.room_price === 'number'
        ? room.room_price
        : typeof room.price === 'number'
          ? room.price
          : 0,
      amenities: room.amenities ? [...room.amenities] : [],
      is_active: room.is_active,
      images: room.image_paths ? [...room.image_paths] : [],
      panoramicImage: room.panoramic_image_path || undefined,
    });
    setFormErrorsState(formErrors);
    setImageError(null);
    setPanoramicImageError(null);
    setError(null);
    setAmenityInput('');
  }, [room, formErrors]);

  // Helper function to get image preview URL
  const getImagePreviewUrl = (image: File | string): string => {
    if (typeof image === 'string') {
      return image; // It's already a URL from Supabase
    }
    return URL.createObjectURL(image); // It's a new File object
  };
  
  // ... (useEffect for handleClickOutside, other handlers: handleChange, amenities, image uploads, remove panoramic, validateForm, handleSubmit) ...
  // Ensure these handlers are correctly managing the (File | string) types for images.

  // (Make sure all your handlers like handleImageUpload, removeImage, handlePanoramicImageUpload,
  // removePanoramicImage, validateForm, and handleSubmit are the ones we worked on previously
  // that correctly handle the mixed array `(File | string)[]` for `images`
  // and `File | string | null` for `panoramicImage`)

  // ... (rest of the handlers from the version you confirmed was working for EditRoomOverlay)

    useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen || !room) return null; // Also ensure room is present

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    let processedValue: string | number | boolean = value;
    if (type === 'checkbox') {
      processedValue = checked;
    } else if (type === 'number') {
      processedValue = parseFloat(value) || 0; // Default to 0 if parsing fails or empty
      if (name === 'capacity' && processedValue < 1 && value !== '') processedValue = 1; // Min capacity 1
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    if (formErrorsState[name]) {
      setFormErrorsState(prev => ({ ...prev, [name]: '' }));
    }
    setError(null); 
  };

  const allExistingAmenities = [...new Set(existingRooms.flatMap(r => r.amenities || []))];
  
  const filteredAmenities = allExistingAmenities
    .filter(amenity => 
      amenity && amenity.toLowerCase().includes(amenityInput.toLowerCase()) && 
      !formData.amenities.includes(amenity)
    );


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
    if (e.key === 'Enter') { e.preventDefault(); addAmenity(); }
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      setImageError('Only image files are allowed.');
      return;
    }
    const totalImages = formData.images.length + files.length;
    if (totalImages > 3) {
      setImageError('Maximum 3 images allowed.');
      const remainingSlots = 3 - formData.images.length;
      if (remainingSlots > 0) {
          setFormData(prev => ({ ...prev, images: [...prev.images, ...files.slice(0, remainingSlots)] }));
      }
      return;
    }
    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    const imageToRemove = formData.images[index];
    // If it's an object URL, revoke it to prevent memory leaks, only if it's a File
    if (typeof imageToRemove !== 'string' && imageToRemove instanceof File) {
      const objectUrl = getImagePreviewUrl(imageToRemove); // This would have created it
      if (objectUrl.startsWith('blob:')) { // Check if it's actually a blob URL
        URL.revokeObjectURL(objectUrl);
      }
    }
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    setImageError(null); 
  };

  const handlePanoramicImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setPanoramicImageError('Only image files are allowed for panoramic view.');
        if (panoramicFileInputRef.current) panoramicFileInputRef.current.value = '';
        return;
      }
      // Revoke previous object URL if it was a File
      if (formData.panoramicImage instanceof File) {
        const objectUrl = getImagePreviewUrl(formData.panoramicImage);
        if (objectUrl.startsWith('blob:')) {
            URL.revokeObjectURL(objectUrl);
        }
      }
      setFormData(prev => ({ ...prev, panoramicImage: file }));
      setPanoramicImageError(null);
    }
  };

  const removePanoramicImage = () => {
     // Revoke previous object URL if it was a File
    if (formData.panoramicImage instanceof File) {
        const objectUrl = getImagePreviewUrl(formData.panoramicImage);
        if (objectUrl.startsWith('blob:')) {
            URL.revokeObjectURL(objectUrl);
        }
    }
    setFormData(prev => ({ ...prev, panoramicImage: null })); 
    setPanoramicImageError(null);
    if (panoramicFileInputRef.current) panoramicFileInputRef.current.value = '';
  };

  const validateForm = (): boolean => {
    const localFormErrors: Record<string, string> = {}; // Use a local var for this validation pass
    let hasErrors = false;

    if (!formData.name.trim()) { localFormErrors.name = 'Room name is required'; hasErrors = true; }
    if (formData.capacity < 1) { localFormErrors.capacity = 'Capacity must be at least 1'; hasErrors = true; }
    if (formData.price <= 0) { localFormErrors.price = 'Price must be greater than 0'; hasErrors = true; }
    
    if (formData.images.length !== 3) {
      setImageError('Exactly 3 regular images are required.');
      localFormErrors.images = 'Exactly 3 regular images are required.'; // For overall form error summary
      hasErrors = true;
    } else {
      setImageError(null);
    }

    if (!formData.panoramicImage) { 
      setPanoramicImageError('A panoramic image is required.');
      localFormErrors.panoramicImage = 'A panoramic image is required.';
      hasErrors = true;
    } else {
      setPanoramicImageError(null);
    }
    
    setFormErrorsState(localFormErrors); // Update the state with errors from this validation pass
    return !hasErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      // General error message for the form if specific field errors aren't enough.
      // This 'error' state is for general/amenity errors, consider a specific one for submit failure.
      // setError('Please fix the errors in the form.'); 
      alert('Please fix the errors highlighted in the form.'); // Simple alert
      return;
    }
    // setError(null); // Clear general form error
    onSubmit(formData);
  };


  return (
    <div className={styles.overlay}>
      <div className={styles.filterOverlayContent}>
        <div className={styles.overlayHeader}>
          <h2>Edit Room: {room.name}</h2> {/* Display current room name being edited */}
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fa-regular fa-xmark"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.filterForm} noValidate>
          {/* General form error display can go here if needed */}
          {/* {error && <p className={`${styles.errorText} ${styles.generalFormError}`}>{error}</p>} */}

          <div className={styles.filterSection}>
            <h3>Room Details</h3>
            <div className={styles.filterField}>
              <label className={styles.requiredField}>Room Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className={formErrorsState.name ? styles.inputError : ''} required />
              {formErrorsState.name && <p className={styles.errorText}>{formErrorsState.name}</p>}
            </div>
            
            <div className={styles.filterField}>
              <label className={styles.requiredField}>Capacity (persons)</label>
              <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} min="1" className={formErrorsState.capacity ? styles.inputError : ''} required />
              {formErrorsState.capacity && <p className={styles.errorText}>{formErrorsState.capacity}</p>}
            </div>
            
            <div className={styles.filterField}>
              <label className={styles.requiredField}>Price (PHP)</label>
              <input type="number" name="price" value={formData.price} onChange={handleChange} min="0.01" step="any" className={formErrorsState.price ? styles.inputError : ''} required />
              {formErrorsState.price && <p className={styles.errorText}>{formErrorsState.price}</p>}
            </div>
            
            <div className={styles.filterField}>
              <label>Amenities (max 10)</label>
              <div className={styles.amenityInputContainer} ref={dropdownRef}>
                <input type="text" value={amenityInput} onChange={handleAmenityInputChange} onKeyDown={handleKeyDown} onFocus={() => amenityInput && setDropdownOpen(true)} placeholder="Type or select amenity" disabled={formData.amenities.length >= 10} />
                <button type="button" className={styles.addButton} onClick={() => addAmenity()} disabled={formData.amenities.length >= 10 || !amenityInput.trim()}>Add</button>
                {dropdownOpen && filteredAmenities.length > 0 && (
                  <div className={styles.amenityDropdown}>
                    {filteredAmenities.map(amenity => (<div key={amenity} className={styles.amenityOption} onClick={() => addAmenity(amenity)}>{amenity}</div>))}
                  </div>
                )}
              </div>
              {error && <p className={styles.errorText}>{error}</p>} {/* Amenity specific error */}
              {formErrorsState.amenities && <p className={styles.errorText}>{formErrorsState.amenities}</p>}
              {formData.amenities.length > 0 && (
                <div className={styles.amenityTags}>
                  {formData.amenities.map(amenity => (<div key={amenity} className={styles.amenityTag}><span>{amenity}</span><button type="button" onClick={() => removeAmenity(amenity)} className={styles.removeTag}><i className="fa-regular fa-xmark"></i></button></div>))}
                </div>
              )}
            </div>
            
            <div className={styles.filterField}>
              <label>Status</label>
              <div className={styles.toggleContainer}>
                <span className={!formData.is_active ? styles.activeLabel : ''}>Inactive</span>
                <div className={styles.toggleSwitch}>
                  <input type="checkbox" id={`status-toggle-edit-${room.id}`} checked={formData.is_active} name="is_active" onChange={handleChange} />
                  <label htmlFor={`status-toggle-edit-${room.id}`}></label>
                </div>
                <span className={formData.is_active ? styles.activeLabel : ''}>Active</span>
              </div>
            </div>
          </div>

          {/* SECTION FOR REGULAR IMAGES */}
          <div className={styles.filterSection}>
            <h3>Room Images</h3>
            <div className={styles.filterField}>
              <label className={styles.requiredField}>Upload Regular Images (exactly 3)</label>
              <div className={styles.imageUploadContainer}>
                <input type="file" accept="image/*" onChange={handleImageUpload} ref={fileInputRef} style={{ display: 'none' }} multiple />
                <button type="button" onClick={() => fileInputRef.current?.click()} className={styles.uploadButton} disabled={formData.images.length >= 3}>
                  <i className="fa-regular fa-image"></i> Select Images
                </button>
                <span className={styles.uploadInfo}>{formData.images.length}/3 images selected</span>
              </div>
              {imageError && <p className={styles.errorText}>{imageError}</p>}
              {formErrorsState.images && !imageError && <p className={styles.errorText}>{formErrorsState.images}</p>}
              
              {formData.images.length > 0 && (
                <div className={styles.imagePreviewContainer}>
                  {formData.images.map((image, index) => (
                    <div key={typeof image === 'string' ? image : image.name + index + image.size} className={styles.imagePreviewItem}>
                      <Image
                        src={getImagePreviewUrl(image)} // This will display existing URLs or ObjectURLs for new files
                        alt={`Room preview ${index + 1}`}
                        width={100}
                        height={100}
                        style={{ objectFit: 'cover' }}
                        unoptimized // Important for ObjectURLs
                        // No need for onLoad revoke here if removeImage handles it for Files
                      />
                      <button type="button" onClick={() => removeImage(index)} className={styles.removeImageButton}><i className="fa-regular fa-xmark"></i></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SECTION FOR PANORAMIC IMAGE */}
          <div className={styles.filterSection}>
            <h3>Panoramic Image</h3>
            <div className={styles.filterField}>
              <label className={styles.requiredField}>Panoramic Image (1 required)</label>
              <div className={styles.imageUploadContainer}>
                <input type="file" accept="image/*" onChange={handlePanoramicImageUpload} ref={panoramicFileInputRef} style={{ display: 'none' }} />
                <button type="button" onClick={() => panoramicFileInputRef.current?.click()} className={styles.uploadButton}>
                  <i className="fa-regular fa-panorama"></i> 
                  {formData.panoramicImage ? 'Change' : 'Select'} Panoramic Image
                </button>
                {formData.panoramicImage && ( // Show remove button only if an image is selected/present
                    <button type="button" onClick={removePanoramicImage} className={styles.removePanoramicButton} style={{marginLeft: '10px'}}>
                        <i className="fa-regular fa-trash-can"></i> Remove
                    </button>
                )}
              </div>
              {panoramicImageError && <p className={styles.errorText}>{panoramicImageError}</p>}
              {formErrorsState.panoramicImage && !panoramicImageError && <p className={styles.errorText}>{formErrorsState.panoramicImage}</p>}
              
              {formData.panoramicImage && ( // Display preview if an image (File or URL string) is present
                <div className={styles.imagePreviewContainer} style={{ marginTop: '10px' }}>
                  <div className={styles.imagePreview} style={{ width: '200px', height: '100px' }}>
                    <Image
                      src={getImagePreviewUrl(formData.panoramicImage as File | string)} // Cast to satisfy, null checked by outer if
                      alt="Panoramic preview"
                      width={200} height={100}
                      style={{ objectFit: 'contain' }}
                      unoptimized // Important for ObjectURLs
                       // No need for onLoad revoke here if removePanoramicImage handles it for Files
                    />
                  </div>
                  {formData.panoramicImage instanceof File && (
                    <p className={styles.fileNamePreview}>{formData.panoramicImage.name}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className={styles.filterActions}>
            <button type="submit" className={styles.applyButton}>Update Room</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRoomOverlay;