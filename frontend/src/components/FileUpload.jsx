import { useState, useRef, useCallback } from 'react';
import { API_URL, getToken } from '../lib/api';
import './FileUpload.css';

const MAX_BYTES = 4 * 1024 * 1024; // 4MB — matches the backend's multer limit

// A self-contained drag-and-drop image uploader. It validates the file
// client-side (type + size) before ever touching the network, shows an
// instant local preview + progress bar while the real upload happens in
// the background, and hands the final hosted URL up to the parent once
// the backend confirms it's stored. The parent never has to think about
// files at all — only the resulting URL string.
export default function FileUpload({ value, onUploaded, disabled }) {
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [localPreview, setLocalPreview] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const openPicker = () => {
    if (!disabled && !uploading) inputRef.current?.click();
  };

  const validateFile = (file) => {
    if (!file.type.startsWith('image/')) {
      return 'Please upload an image file.';
    }
    if (file.size > MAX_BYTES) {
      return `File must be smaller than ${MAX_BYTES / (1024 * 1024)}MB.`;
    }
    return null;
  };

  const startUpload = useCallback((file) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');

    // Instant feedback: show the picked file immediately, before the
    // network request even starts.
    const reader = new FileReader();
    reader.onload = () => setLocalPreview(reader.result);
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/api/uploads`);
    const token = getToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      setUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          onUploaded(data.url);
        } catch {
          setError('Upload succeeded but the response was unreadable.');
        }
      } else {
        let message = 'Upload failed. Please try again.';
        try {
          const body = JSON.parse(xhr.responseText);
          if (body.errors?.length) message = body.errors.join(' ');
        } catch {
          // no JSON body — keep generic message
        }
        setError(message);
        setLocalPreview(null);
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setError('Network error during upload. Please try again.');
      setLocalPreview(null);
    };

    setUploading(true);
    setProgress(0);
    xhr.send(formData);
  }, [onUploaded]);

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    e.target.value = ''; // allow picking the same file again later
    if (file) startUpload(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (disabled || uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) startUpload(file);
  };

  const removeFile = () => {
    setLocalPreview(null);
    setError('');
    setProgress(0);
    onUploaded(null);
  };

  const displayImage = value || localPreview;

  return (
    <div className="file-upload">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        disabled={disabled || uploading}
        className="file-upload__input"
      />

      {displayImage ? (
        <div className="file-upload__preview">
          <img src={displayImage} alt="Upload preview" />

          {uploading && (
            <div className="file-upload__progress-overlay">
              <div className="file-upload__progress-track">
                <div
                  className="file-upload__progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="file-upload__progress-label">{progress}%</span>
            </div>
          )}

          {!uploading && (
            <div className="file-upload__preview-actions">
              {value && (
                <a
                  className="file-upload__preview-link"
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View full size
                </a>
              )}
              <button type="button" onClick={removeFile} disabled={disabled}>
                Remove
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          className={`file-upload__dropzone ${dragActive ? 'file-upload__dropzone--active' : ''}`}
          onClick={openPicker}
          onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openPicker(); }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 16V4M12 4l-4 4M12 4l4 4" />
            <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
          </svg>
          <p className="file-upload__dropzone-text">
            <strong>Drag & drop</strong> an image, or click to browse
          </p>
          <p className="file-upload__dropzone-hint">JPG, PNG, or WEBP — up to 4MB</p>
        </div>
      )}

      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
