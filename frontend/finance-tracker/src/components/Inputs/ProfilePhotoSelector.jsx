import React, { useRef, useState } from 'react';
import { LuUser, LuUpload, LuTrash } from 'react-icons/lu';

const ProfilePhotoSelector = ({ image, setImage }) => {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Update the image state
      setImage(file);
      // Generate a preview URL from the file
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
    }
  };

  // If 'image' prop is a URL string (existing image), use it as initial preview
  React.useEffect(() => {
    if (typeof image === 'string') {
      setPreviewUrl(image);
    } else if (!image) {
      setPreviewUrl(null);
    }
    // If image is a File object, we already set previewUrl in handleImageChange
  }, [image]);

  const handleRemoveImage = () => {
    setImage(null);
    setPreviewUrl(null);
  };

  const onChooseFile = () => {
    inputRef.current.click();
  };

  return (
    <div className="flex flex-col items-center mb-6">
      <label className="text-[13px] text-white mb-2">Profile Photo</label>

      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        ref={inputRef}
        className="hidden"
      />

      {!image ? (
        <div className="w-24 h-24 flex items-center justify-center bg-[var(--color-input)] rounded-full relative border border-[var(--color-border)] shadow-sm">
          <LuUser className="text-4xl text-[var(--color-text)] opacity-40" />
          <button
            type="button"
            onClick={onChooseFile}
            aria-label="upload"
            className="w-8 h-8 flex items-center justify-center bg-primary hover:bg-primary/90 text-white rounded-full absolute -bottom-1 -right-1 shadow-md transition-colors duration-200 cursor-pointer"
          >
            <LuUpload size={14} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <img
            src={previewUrl}
            alt="Profile Preview"
            className="w-24 h-24 rounded-full object-cover border border-[var(--color-border)] shadow-sm"
          />
          <div className="absolute -bottom-2 -right-2 flex gap-2">
            <button
              type="button"
              onClick={onChooseFile}
              className="w-8 h-8 flex items-center justify-center bg-primary hover:bg-primary/90 text-white rounded-full shadow-md transition-colors duration-200 cursor-pointer"
              aria-label="change"
            >
              <LuUpload size={14} />
            </button>
            <button
              type="button"
              onClick={handleRemoveImage}
              className="w-8 h-8 flex items-center justify-center bg-expense hover:bg-expense/90 text-white rounded-full shadow-md transition-colors duration-200 cursor-pointer"
              aria-label="remove"
            >
              <LuTrash size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePhotoSelector;