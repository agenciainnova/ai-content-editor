"use client";

import { useState } from "react";

const compressImage = (file, maxDim = 1024) => {
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
      }, "image/jpeg", 0.85);
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
  const [hordeStatus, setHordeStatus] = useState("");

  const handleImageChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setLoading(true);
      try {
        const compressedFile = await compressImage(selectedFile, 1024);
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
    setHordeStatus("Preparando imagen...");

    try {
      // 1. Encojemos la foto localmente primero para AI Horde
      const compressedFile = await compressImage(file, 512); 
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64Data = reader.result.split(',')[1];
        setHordeStatus("Conectando con La Horda...");

        try {
          // 2. Enviar petición a AI Horde
          const submitResponse = await fetch("https://aihorde.net/api/v2/generate/async", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": "0000000000",
              "Client-Agent": "InnovaEditor:1.0:unknown"
            },
            body: JSON.stringify({
              prompt: prompt || "professional photorealistic, high quality, 8k",
              nsfw: true,
              censor_nsfw: false,
              source_image: base64Data,
              source_processing: "img2img",
              params: {
                sampler_name: "k_euler_a",
                steps: 25,
                width: 512,
                height: 512,
                denoising_strength: 0.75
              }
            })
          });

          const submitData = await submitResponse.json();

          if (!submitResponse.ok || !submitData.id) {
            alert("Error conectando a la Horda: " + (submitData.message || "Desconocido"));
            setLoading(false);
            setHordeStatus("");
            return;
          }

          const jobId = submitData.id;

          // 3. Crear el ciclo de consulta (Polling) cada 5 segundos
          const checkStatus = async () => {
            try {
              const checkRes = await fetch(`https://aihorde.net/api/v2/generate/check/${jobId}`);
              const checkData = await checkRes.json();

              if (checkData.done) {
                setHordeStatus("¡Imagen renderizada! Descargando...");
                const resultRes = await fetch(`https://aihorde.net/api/v2/generate/status/${jobId}`);
                const resultData = await resultRes.json();

                if (resultData.generations && resultData.generations.length > 0) {
                  setResultImage(resultData.generations[0].img);
                } else {
                  alert("Error: La Horda no devolvió ninguna imagen.");
                }
                setLoading(false);
                setHordeStatus("");
              } else {
                if (checkData.waiting > 0) {
                  setHordeStatus(`Fila de espera de La Horda... Estás de número: ${checkData.waiting || 1}`);
                } else if (checkData.processing > 0) {
                  setHordeStatus("¡Computadora encontrada! Renderizando píxeles (esto toma ~30segs)...");
                } else {
                  setHordeStatus("Buscando computadora voluntaria disponible...");
                }
                setTimeout(checkStatus, 5000);
              }
            } catch (err) {
              console.error("Error validando estado", err);
              setTimeout(checkStatus, 5000);
            }
          };

          checkStatus();

        } catch (serverErr) {
          console.error(serverErr);
          alert("Error crítico conectando a la Horda.");
          setLoading(false);
          setHordeStatus("");
        }
      };
      reader.readAsDataURL(compressedFile);

    } catch (e) {
      console.error(e);
      alert("Error comprimiendo imagen.");
      setLoading(false);
      setHordeStatus("");
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
          <div style={{ display: 'flex', gap: '1rem' }}>
            {["original", "4:3", "16:9"].map(ratio => (
              <label key={ratio} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="ratio" 
                  value={ratio} 
                  checked={aspectRatio === ratio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                />
                {ratio.toUpperCase()}
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
              <div className="animate-fade-in" style={{ color: 'var(--primary-color)', fontWeight: 600 }}>{hordeStatus || "Consultando con la Horda..."}</div>
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
