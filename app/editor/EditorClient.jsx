"use client";

import { useState } from "react";

const compressImage = (file, maxDim = 2048) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > height && width > maxDim) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else if (height > maxDim) {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error("Compression failed"));
        resolve(new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() }));
      }, "image/jpeg", 0.95);
    };
    img.onerror = error => reject(error);
  });
};

export default function EditorClient() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [aspectRatio, setAspectRatio] = useState("original");
  const [prompt, setPrompt] = useState("");
  const [resultImage, setResultImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setLoading(true);
      try {
        const compressedFile = await compressImage(selectedFile, 2048);
        setFile(compressedFile);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
          setLoading(false);
        };
        reader.readAsDataURL(compressedFile);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }
  };

  const processImage = async () => {
    if (!file) return;
    setLoading(true);
    setResultImage(null);

    const formData = new FormData();
    // file is already compressed by handleImageChange
    formData.append("image", file);
    formData.append("prompt", prompt);
    formData.append("aspectRatio", aspectRatio);

    try {
      const response = await fetch("/api/process-image", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      
      if (response.ok && data.resultUrl) {
        setResultImage(data.resultUrl);
      } else {
        alert(data.error || "Failed to process image on server.");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      alert("Error procesando imagen: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ width: '100%', maxWidth: '900px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', padding: '2rem' }}>
      
      {/* Settings Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Upload Photo</h3>
          <input type="file" accept="image/*" onChange={handleImageChange} className="input-field" style={{ padding: '8px' }} />
        </div>

        <div>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Aspect Ratio</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { id: "original", label: "Original" },
              { id: "1600:1200", label: "Landscape (16x12)" },
              { id: "1:1", label: "Square (1:1)" },
              { id: "4:3", label: "Classic (4:3)" }
            ].map(ratio => (
              <label key={ratio.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '8px', background: aspectRatio === ratio.id ? 'rgba(255, 42, 95, 0.1)' : 'transparent' }}>
                <input 
                  type="radio" 
                  name="ratio" 
                  value={ratio.id} 
                  checked={aspectRatio === ratio.id}
                  onChange={(e) => setAspectRatio(e.target.value)}
                />
                <span style={{ fontSize: '0.9rem' }}>{ratio.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>New Background Prompt</h3>
          <textarea 
            className="input-field" 
            rows="4" 
            placeholder="e.g. A luxurious romantic bedroom with red roses, cinematic lighting"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <button 
          className="btn-primary" 
          onClick={processImage} 
          disabled={!file || loading}
          style={{ width: '100%', marginTop: 'auto', padding: '16px' }}
        >
          {loading ? "Processing AI Magic..." : "Generate Enhancements"}
        </button>
      </div>

      {/* Preview Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Original</h3>
          <div className="glass-panel" style={{ width: '100%', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {preview ? (
              <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No image uploaded</p>
            )}
          </div>
        </div>

        <div>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Result</h3>
          <div className="glass-panel" style={{ width: '100%', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: loading ? 'rgba(255, 42, 95, 0.1)' : 'var(--surface-color)' }}>
            {loading ? (
              <div className="animate-fade-in" style={{ color: 'var(--primary-color)', fontWeight: 600 }}>Processing AI Magic...</div>
            ) : resultImage ? (
              <img src={resultImage} alt="Result" className="animate-fade-in" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>Awaiting generation</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
