import { useState, useRef, useEffect } from 'react'
import './App.css'

function App() {
  const [selectedImage, setSelectedImage] = useState(null)
  const [processedImage, setProcessedImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sliderPosition, setSliderPosition] = useState(50)
  const sliderRef = useRef(null)
  const containerRef = useRef(null)
  const fileInputRef = useRef(null)

  console.log("Slected IMage",selectedImage)

  const resizeImage = (file, maxWidth, maxHeight, callback) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        let width = img.width;
        let height = img.height;
  
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          } else {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
  
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL("image/jpeg", 0.7)); // Adjust quality (0.7 for 70%)
      };
    };
  };
  

  const handleImageUpload = async (event) => {
    const file = event.target.files[0]
    if (file) {
      resizeImage(file, 800, 800, (resizedDataURL) => {
        setSelectedImage({ file, preview: resizedDataURL });
      });
      setProcessedImage(null)
      setError(null)
      // Automatically process image for preview
      await processImageForPreview(file)
    }
  }

  const handleDrop = async (event) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) {
      resizeImage(file, 800, 800, (resizedDataURL) => {
        setSelectedImage({ file, preview: resizedDataURL });
      });
      setProcessedImage(null)
      setError(null)
      // Automatically process image for preview
      await processImageForPreview(file)
    }
  }

  const handleDragOver = (event) => {
    event.preventDefault()
  }

  const processImageForPreview = async (image) => {
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('image_file', image)

    try {
      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': import.meta.env.VITE_API,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to remove background')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setProcessedImage(url)
    } catch (err) {
      setError('Failed to process image. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSliderChange = (e) => {
    setSliderPosition(e.target.value)
  }

  const handleMouseDown = () => {
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grabbing'
    }
  }

  const handleMouseUp = () => {
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab'
    }
  }

  const handleDownload = () => {
    if (processedImage) {
      // Safely access the file name within selectedImage
      const originalName = selectedImage?.file?.name
        ? selectedImage.file.name.split('.').slice(0, -1).join('.')
        : 'processed-image'; // Fallback name if no file is selected
  
      const downloadName = `${originalName}-removedbg.png`;
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
      fileInputRef.current.click()
    } else {
      console.error("File input reference is not initialized")
    }
  }

  useEffect(() => {
    if (sliderRef.current) {
      const percent = sliderPosition
      sliderRef.current.style.left = `${percent}%`
    }
  }, [sliderPosition])

  return (
    <div className="container">
      <h1>Background Remover</h1>
      <div className="main">
        {!selectedImage ? (
          <div
            className="upload-area"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
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
                        onMouseDown={handleMouseDown}
                        onMouseUp={handleMouseUp}
                        onTouchStart={handleMouseDown}
                        onTouchEnd={handleMouseUp}
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
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default App
