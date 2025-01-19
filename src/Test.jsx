import { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [format, setFormat] = useState('auto');  // Default format to 'auto'
  const [resolution, setResolution] = useState('full');  // Set default resolution to 'full' for highest quality
  const sliderRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage({ file, preview: URL.createObjectURL(file) });
      setProcessedImage(null);
      setError(null);
      await processImageForPreview(file);
    }
  };

  const processImageForPreview = async (image) => {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image_file', image);

    try {
      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': import.meta.env.VITE_API,
        },
        body: formData,
        params: {
          resolution,  // Send selected resolution ('full' for highest quality)
          format,      // Send selected format ('auto' to decide best format)
        },
      });

      if (!response.ok) {
        throw new Error('Failed to remove background');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setProcessedImage(url);
    } catch (err) {
      setError('Failed to process image. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSliderChange = (e) => {
    setSliderPosition(e.target.value);
  };

  const handleDownload = () => {
    if (processedImage) {
      const originalName = selectedImage?.file?.name
        ? selectedImage.file.name.split('.').slice(0, -1).join('.')
        : 'processed-image';
      const downloadName = `${originalName}-removedbg.${format === 'auto' ? 'png' : format}`;
      const link = document.createElement('a');
      link.href = processedImage;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.error("No processed image available for download.");
    }
  };

  const handleNewImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      console.error("File input reference is not initialized");
    }
  };

  useEffect(() => {
    if (sliderRef.current) {
      const percent = sliderPosition;
      sliderRef.current.style.left = `${percent}%`;
    }
  }, [sliderPosition]);

  return (
    <div className="container">
      <h1>Background Remover</h1>
      <div className="main">
        {!selectedImage ? (
          <div className="upload-area">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              id="file-input"
              className="file-input"
              ref={fileInputRef}
            />
            <label htmlFor="file-input" className="upload-label">
              <div className="upload-prompt">
                <span>Drop your image here or click to upload</span>
                <small>Supports all image formats except GIF's</small>
              </div>
            </label>
          </div>
        ) : (
          <>
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Processing your image...</p>
              </div>
            ) : (
              <>
                {error ? (
                  <div className="error">{error}</div>
                ) : (
                  <>
                    <div className="comparison-slider" ref={containerRef}>
                      <div className="image-container">
                        {processedImage && (
                          <img
                            src={processedImage}
                            alt="Processed"
                            className="processed-image"
                          />
                        )}
                        <img
                          src={selectedImage?.preview}
                          alt="Original"
                          className="original-image"
                          style={{
                            clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)`,
                          }}
                        />
                        <div
                          className="slider-line"
                          ref={sliderRef}
                          style={{ left: `${sliderPosition}%` }}
                        >
                          <div className="slider-handle"></div>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={sliderPosition}
                        onChange={handleSliderChange}
                        className="slider-input"
                      />
                    </div>
                    <div className="button-container">
                      <button
                        onClick={handleNewImage}
                        className="new-image-button"
                      >
                        Upload New Image
                      </button>
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        className="file-input"
                        onChange={handleImageUpload}
                      />
                      <button
                        onClick={handleDownload}
                        className="download-button"
                      >
                        Download Image
                      </button>
                    </div>
                    <div className="additional-options">
                    {/* Dropdown for format selection */}
                    <div className="format-selection">
                      <label>Format:</label>
                      <select
                        value={format}
                        onChange={(e) => setFormat(e.target.value)}
                      >
                        <option value="auto">Auto</option>
                        <option value="png">PNG</option>
                        <option value="jpg">JPG</option>
                        <option value="zip">ZIP</option>
                      </select>
                    </div>

                    {/* Dropdown for resolution selection */}
                    <div className="resolution-selection">
                      <label>Resolution:</label>
                      <select
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                      >
                        <option value="preview">Preview</option>
                        <option value="full">Full</option>
                        <option value="50MP">50MP</option>
                      </select>
                    </div>
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
