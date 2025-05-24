import React, { useState, useEffect, useRef } from 'react';
import styles from '../component_styles/FilterOverlay.module.css'; // Ensure this path is correct
import Image from 'next/image';
import { RoomFormData } from '../../src/types/room'; 
import { Room as RoomType } from '../../src/types/room'; 

interface EditRoomOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RoomFormData) => void;
  existingRooms: { id: string; name: string; amenities?: string[] }[]; // For amenity suggestions
  formErrors?: Record<string, string>;
  room: RoomType; // The room object being edited
}

const EditRoomOverlay: React.FC<EditRoomOverlayProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingRooms,
  formErrors = {},
  room
}) => {
  // Helper to initialize price, preferring room_price from DB, then price, then 0
  const getInitialPrice = (currentRoom: RoomType): number => {
    if (typeof currentRoom.room_price === 'number') return currentRoom.room_price;
    if (typeof (currentRoom as any).price === 'number') return (currentRoom as any).price; // Fallback if 'price' exists
    return 0;
  };

  const [formData, setFormData] = useState<RoomFormData>({
    name: room.name || '',
    capacity: room.capacity || 1,
    price: getInitialPrice(room),
    amenities: room.amenities ? [...room.amenities] : [],
    is_active: typeof room.is_active === 'boolean' ? room.is_active : true, // Default to true if undefined
    images: room.image_paths ? [...room.image_paths] : [], 
    panoramicImage: room.panoramic_image_path || undefined, 
  });
  
  const [formErrorsState, setFormErrorsState] = useState<Record<string, string>>(formErrors);
  const [amenityInput, setAmenityInput] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [generalFormError, setGeneralFormError] = useState<string | null>(null); // For general form/amenity errors
  const [imageError, setImageError] = useState<string | null>(null); // For regular image specific errors
  const [panoramicImageError, setPanoramicImageError] = useState<string | null>(null); // For panoramic image specific errors

  const fileInputRef = useRef<HTMLInputElement>(null);
  const panoramicFileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Store ObjectURLs for File objects to manage their lifecycle
  const objectUrlMapRef = useRef<Map<File, string>>(new Map());

  // Function to get/create ObjectURL for a File and store it
  const getOrCreateObjectURL = (file: File): string => {
    if (!objectUrlMapRef.current.has(file)) {
      const url = URL.createObjectURL(file);
      objectUrlMapRef.current.set(file, url);
    }
    return objectUrlMapRef.current.get(file)!;
  };

  // Function to revoke and remove ObjectURL for a File
  const revokeAndRemoveObjectURL = (file: File) => {
    if (objectUrlMapRef.current.has(file)) {
      URL.revokeObjectURL(objectUrlMapRef.current.get(file)!);
      objectUrlMapRef.current.delete(file);
    }
  };
  
  // Effect to reset form when 'room' prop changes or 'formErrors' are passed
  useEffect(() => {
    // console.log("EditRoomOverlay: useEffect for room/formErrors triggered. Room:", room);
    // 1. Revoke all existing ObjectURLs from the map before processing new/old room data
    objectUrlMapRef.current.forEach(url => URL.revokeObjectURL(url));
    objectUrlMapRef.current.clear();

    // 2. Initialize formData from the current 'room' prop
    const initialImages = room.image_paths ? [...room.image_paths] : [];
    const initialPanoramicImage = room.panoramic_image_path || undefined;

    setFormData({
      name: room.name || '',
      capacity: room.capacity || 1,
      price: getInitialPrice(room),
      amenities: room.amenities ? [...room.amenities] : [],
      is_active: typeof room.is_active === 'boolean' ? room.is_active : true,
      images: initialImages,
      panoramicImage: initialPanoramicImage,
    });

    // 3. If initial images/panoramicImage are File objects (unlikely for data from DB, but for robustness),
    // create their ObjectURLs. This step is mostly defensive.
    initialImages.forEach(img => {
        if (img instanceof File) getOrCreateObjectURL(img);
    });
    if (initialPanoramicImage instanceof File) {
        getOrCreateObjectURL(initialPanoramicImage);
    }

    // 4. Reset error states
    setFormErrorsState(formErrors); // Update local form errors with those from props
    setImageError(null);
    setPanoramicImageError(null);
    setGeneralFormError(null);
    setAmenityInput('');
  }, [room, formErrors]); // Dependencies: room and formErrors

  // Effect for cleaning up ALL ObjectURLs when the component unmounts
  useEffect(() => {
    return () => {
      // console.log("EditRoomOverlay: Unmounting, cleaning up ObjectURLs.");
      objectUrlMapRef.current.forEach(url => URL.revokeObjectURL(url));
      objectUrlMapRef.current.clear();
    };
  }, []); // Empty dependency array means this runs only on mount and unmount

  // Helper function to get image preview URL (either existing URL or ObjectURL for new File)
  const getImagePreviewUrl = (image: File | string): string => {
    if (typeof image === 'string') {
      return image; // It's an existing URL from Supabase/storage
    }
    // It's a File object, get or create its ObjectURL from our map
    return getOrCreateObjectURL(image);
  };
  
  // Effect for handling clicks outside the amenity dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen || !room) return null; // Guard against rendering if not open or no room data

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    let processedValue: string | number | boolean = value;

    if (type === 'checkbox') {
      processedValue = checked;
    } else if (type === 'number') {
      // Allow empty string for temporary clearing, otherwise parse or default to 0
      processedValue = value === '' ? '' : (parseFloat(value) || 0);
      if (name === 'capacity' && typeof processedValue === 'number' && processedValue < 1 && value !== '') {
        processedValue = 1; // Min capacity 1
      }
      // For price, allow 0 but not negative.
      if (name === 'price' && typeof processedValue === 'number' && processedValue < 0) {
        processedValue = 0;
      }
    }

    setFormData(prev => ({
      ...prev,
      // If number field was cleared (processedValue is ''), store 0, else store processedValue
      [name]: (type === 'number' && processedValue === '') ? 0 : processedValue 
    }));

    if (formErrorsState[name]) {
      setFormErrorsState(prev => ({ ...prev, [name]: '' }));
    }
    setGeneralFormError(null); // Clear general form error on any change
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
    setGeneralFormError(null);
  };

  const addAmenity = (amenity: string = amenityInput.trim()) => {
    const trimmedAmenity = amenity.trim();
    if (!trimmedAmenity) return;
    if (formData.amenities.length >= 10) {
      setGeneralFormError('Maximum 10 amenities allowed'); return;
    }
    if (formData.amenities.includes(trimmedAmenity)) {
      setGeneralFormError('This amenity is already added'); return;
    }
    setFormData(prev => ({ ...prev, amenities: [...prev.amenities, trimmedAmenity] }));
    setAmenityInput('');
    setDropdownOpen(false);
  };

  const removeAmenity = (amenity: string) => {
    setFormData(prev => ({ ...prev, amenities: prev.amenities.filter(a => a !== amenity) }));
    setGeneralFormError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); addAmenity(); }
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      setImageError('Only image files are allowed.'); return;
    }
    const totalImages = formData.images.length + files.length;
    if (totalImages > 3) {
      setImageError('Maximum 3 images allowed.');
      const remainingSlots = 3 - formData.images.length;
      if (remainingSlots > 0) {
          const filesToAdd = files.slice(0, remainingSlots);
          filesToAdd.forEach(file => getOrCreateObjectURL(file)); // Manage ObjectURL
          setFormData(prev => ({ ...prev, images: [...prev.images, ...filesToAdd] }));
      }
      return;
    }
    files.forEach(file => getOrCreateObjectURL(file)); // Manage ObjectURL
    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = ''; // Reset file input
  };

  const removeImage = (index: number) => {
    const imageToRemove = formData.images[index];
    if (imageToRemove instanceof File) { // If it's a File, revoke its ObjectURL
      revokeAndRemoveObjectURL(imageToRemove);
    }
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    setImageError(null); 
  };

  const handlePanoramicImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setPanoramicImageError('Only image files are allowed.');
        if (panoramicFileInputRef.current) panoramicFileInputRef.current.value = '';
        return;
      }
      // If there was a previous panoramic image that was a File, revoke its ObjectURL
      if (formData.panoramicImage instanceof File) {
        revokeAndRemoveObjectURL(formData.panoramicImage);
      }
      getOrCreateObjectURL(file); // Create and store ObjectURL for the new file
      setFormData(prev => ({ ...prev, panoramicImage: file }));
      setPanoramicImageError(null);
    }
     // Don't reset panoramicFileInputRef.current.value here if you want the browser to show the selected file name
  };

  const removePanoramicImage = () => {
    // If the current panoramic image is a File, revoke its ObjectURL
    if (formData.panoramicImage instanceof File) {
      revokeAndRemoveObjectURL(formData.panoramicImage);
    }
    setFormData(prev => ({ ...prev, panoramicImage: null })); // Set to null to indicate removal to backend
    setPanoramicImageError(null);
    if (panoramicFileInputRef.current) panoramicFileInputRef.current.value = ''; // Clear file input
  };

  const validateForm = (): boolean => {
    const localFormErrors: Record<string, string> = {}; 
    let hasErrors = false;

    if (!formData.name.trim()) { localFormErrors.name = 'Room name is required'; hasErrors = true; }
    if (typeof formData.capacity !== 'number' || formData.capacity < 1) { localFormErrors.capacity = 'Capacity must be at least 1'; hasErrors = true; }
    // Price can be 0, but not negative. API expects price > 0.
    if (typeof formData.price !== 'number' || formData.price <= 0) { localFormErrors.price = 'Price must be greater than 0'; hasErrors = true; }
    
    if (formData.images.length !== 3) {
      setImageError('Exactly 3 regular images are required.');
      localFormErrors.images = 'Exactly 3 regular images are required.';
      hasErrors = true;
    } else { setImageError(null); }

    // Make panoramic image required for edit too, or adjust if it can be optional
    if (!formData.panoramicImage) { 
      setPanoramicImageError('A panoramic image is required.');
      localFormErrors.panoramicImage = 'A panoramic image is required.';
      hasErrors = true;
    } else { setPanoramicImageError(null); }
    
    setFormErrorsState(localFormErrors);
    return !hasErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralFormError(null); // Clear general error on new submit attempt
    if (!validateForm()) {
      setGeneralFormError('Please fix the errors highlighted in the form.');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.filterOverlayContent}>
        <div className={styles.overlayHeader}>
          <h2>Edit Room: {room.name}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fa-regular fa-xmark"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.filterForm} noValidate>
          {generalFormError && <p className={`${styles.errorText} ${styles.generalFormError}`}>{generalFormError}</p>}

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
              <input type="number" name="price" value={formData.price} onChange={handleChange} min="0.01" step="any" placeholder="Enter price" className={formErrorsState.price ? styles.inputError : ''} required />
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
              {formErrorsState.amenities && <p className={styles.errorText}>{formErrorsState.amenities}</p>} {/* If amenities had a specific error field */}
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

          <div className={styles.filterSection}>
            <h3>Room Images</h3>
            <div className={styles.filterField}>
              <label className={styles.requiredField}>Regular Images (exactly 3)</label>
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
                    <div key={typeof image === 'string' ? image : `${image.name}-${index}-${image.size}`} className={styles.imagePreviewItem}>
                      <Image
                        src={getImagePreviewUrl(image)}
                        alt={`Room preview ${index + 1}`}
                        width={100}
                        height={100}
                        style={{ objectFit: 'cover' }}
                        unoptimized
                      />
                      <button type="button" onClick={() => removeImage(index)} className={styles.removeImageButton}><i className="fa-regular fa-xmark"></i></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

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
                {formData.panoramicImage && (
                    <button type="button" onClick={removePanoramicImage} className={styles.removePanoramicButton} style={{marginLeft: '10px'}}>
                        <i className="fa-regular fa-trash-can"></i> Remove
                    </button>
                )}
              </div>
              {panoramicImageError && <p className={styles.errorText}>{panoramicImageError}</p>}
              {formErrorsState.panoramicImage && !panoramicImageError && <p className={styles.errorText}>{formErrorsState.panoramicImage}</p>}
              
              {formData.panoramicImage && (
                <div className={styles.imagePreviewContainer} style={{ marginTop: '10px' }}>
                  <div className={styles.imagePreview} style={{ width: '200px', height: '100px' }}>
                    <Image
                      src={getImagePreviewUrl(formData.panoramicImage as File | string)}
                      alt="Panoramic preview"
                      width={200} height={100}
                      style={{ objectFit: 'contain' }}
                      unoptimized
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