import React, { useMemo, useRef, useState } from 'react';
import CanvasEditor from './components/CanvasEditor.jsx';
import Snowfield from './components/Snowfield.jsx';

const defaultPrompt =
  'santa meme mascot, cute chibi, glowing candy cane staff, neon winter background, 3d toon render, crisp, social pfp, symmetrical, cinematic lighting';

const defaultContract = '0xSANTA000000000000000000000000000000000000';

function App() {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [prompt, setPrompt] = useState(defaultPrompt);
  const [displayName, setDisplayName] = useState('Santa PFP');
  const [accentColor, setAccentColor] = useState('#ff365d');
  const [hatEnabled, setHatEnabled] = useState(true);
  const [frostEdge, setFrostEdge] = useState(true);
  const [glow, setGlow] = useState(true);
  const [ring, setRing] = useState(true);
  const [scale, setScale] = useState(1.05);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(-6);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(115);
  const [badgeSubtitle, setBadgeSubtitle] = useState('North Pole drop');

  const [uploadedImage, setUploadedImage] = useState(null);
  const [aiImage, setAiImage] = useState(null);
  const [status, setStatus] = useState('Idle');
  const [loading, setLoading] = useState(false);

  const activeImage = useMemo(() => uploadedImage || aiImage, [uploadedImage, aiImage]);

  const handleUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target.result);
      setStatus('Loaded file');
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setStatus('Calling workshop elves...');
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to generate image');
      }

      const data = await response.json();
      if (!data?.image) throw new Error('No image returned');
      setAiImage(`data:image/png;base64,${data.image}`);
      setStatus('AI render ready');
    } catch (error) {
      console.error(error);
      setStatus(error.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const dataUrl = canvasRef.current?.exportImage();
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'santa-pfp.png';
    link.click();
  };

  const handleCopyContract = async () => {
    try {
      await navigator.clipboard.writeText(defaultContract);
      setStatus('Contract copied');
    } catch (error) {
      setStatus('Copy failed');
    }
  };

  const openLink = (url) => {
    window.open(url, '_blank', 'noopener');
  };

  const resetCanvas = () => {
    setUploadedImage(null);
    setAiImage(null);
    setHue(0);
    setSaturation(115);
    setScale(1.05);
    setOffsetX(0);
    setOffsetY(-6);
    setStatus('Reset');
  };

  return (
    <div className="app-shell">
      <Snowfield density={90} />
      <header className="header">
        <div>
          <div className="badge">🎅 Santa PFP Forge</div>
          <h1 className="hero-title">Mint a crisp Santa-themed PFP with AI + canvas polish.</h1>
          <p className="subtitle">
            Upload or generate, tweak like a pro, drop a Santa hat and frosted rim, then blast it to Twitter or your Dexscreener drop.
          </p>
        </div>
        <div className="status-chip">{status}</div>
      </header>

      <div className="grid">
        <div className="panel">
          <div className="control-group">
            <div className="label">AI Prompt</div>
            <textarea
              className="textarea"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your Santa hero..."
            />
            <div className="actions-row">
              <button className="btn" onClick={handleGenerate} disabled={loading}>
                {loading ? 'Summoning elves...' : 'AI generate'}
              </button>
              <button
                className="btn secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                Upload image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => handleUpload(e.target.files?.[0])}
              />
              <button className="btn secondary" onClick={resetCanvas}>Reset</button>
            </div>
            <div className="hint">AI happens server-side, keep your API key in .env on the backend.</div>
          </div>

          <div className="control-group">
            <div className="label">Overlay text</div>
            <input
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Name on your PFP"
            />
          </div>

          <div className="control-row">
            <div className="control-group">
              <div className="label">Accent color</div>
              <input
                type="color"
                className="input"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
              />
            </div>
            <div className="control-group">
              <div className="label">Badge subtitle</div>
              <input
                className="input"
                value={badgeSubtitle}
                onChange={(e) => setBadgeSubtitle(e.target.value)}
              />
            </div>
          </div>

          <div className="control-row">
            <div className="control-group">
              <div className="label">Scale {scale.toFixed(2)}x</div>
              <input
                type="range"
                min="0.7"
                max="1.6"
                step="0.01"
                value={scale}
                className="slider"
                onChange={(e) => setScale(Number(e.target.value))}
              />
            </div>
            <div className="control-group">
              <div className="label">Offset X: {offsetX}px</div>
              <input
                type="range"
                min="-120"
                max="120"
                step="1"
                value={offsetX}
                className="slider"
                onChange={(e) => setOffsetX(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="control-row">
            <div className="control-group">
              <div className="label">Offset Y: {offsetY}px</div>
              <input
                type="range"
                min="-120"
                max="120"
                step="1"
                value={offsetY}
                className="slider"
                onChange={(e) => setOffsetY(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="control-row">
            <div className="control-group">
              <div className="label">Hue: {hue}°</div>
              <input
                type="range"
                min="-180"
                max="180"
                step="1"
                value={hue}
                className="slider"
                onChange={(e) => setHue(Number(e.target.value))}
              />
            </div>
            <div className="control-group">
              <div className="label">Saturation: {saturation}%</div>
              <input
                type="range"
                min="50"
                max="200"
                step="1"
                value={saturation}
                className="slider"
                onChange={(e) => setSaturation(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="pill-row">
            <button className={`pill ${hatEnabled ? 'active' : ''}`} onClick={() => setHatEnabled(!hatEnabled)}>
              🎩 Santa hat
            </button>
            <button className={`pill ${glow ? 'active' : ''}`} onClick={() => setGlow(!glow)}>
              ✨ Glow
            </button>
            <button className={`pill ${frostEdge ? 'active' : ''}`} onClick={() => setFrostEdge(!frostEdge)}>
              ❄️ Frost rim
            </button>
            <button className={`pill ${ring ? 'active' : ''}`} onClick={() => setRing(!ring)}>
              🪩 Halo ring
            </button>
          </div>

          <div className="actions-row" style={{ marginTop: 14 }}>
            <button className="btn" onClick={handleDownload}>Download PFP</button>
            <button className="btn secondary" onClick={handleCopyContract}>Copy contract</button>
            <button
              className="btn secondary inline"
              onClick={() => openLink('https://twitter.com/intent/tweet?text=Minting%20my%20Santa%20PFP%20%23santapfp')}
            >
              Twitter share
            </button>
            <button
              className="btn secondary inline"
              onClick={() => openLink('https://dexscreener.com/')}
            >
              Dexscreener
            </button>
          </div>
          <div className="hint">Contract: {defaultContract}</div>
        </div>

        <div className="panel">
          <div className="label">Canvas</div>
          <div className="canvas-wrapper">
            <CanvasEditor
              ref={canvasRef}
              width={640}
              height={640}
              baseImage={activeImage}
              overlayText={displayName}
              accentColor={accentColor}
              hatEnabled={hatEnabled}
              glow={glow}
              frostEdge={frostEdge}
              scale={scale}
              offsetX={offsetX}
              offsetY={offsetY}
              hue={hue}
              saturation={saturation}
              ring={ring}
              badge={{ subtitle: badgeSubtitle }}
            />
          </div>
          <div className="canvas-toolbar">
            <div className="status-chip">{activeImage ? 'Custom art loaded' : 'Waiting for art'}</div>
            <button className="btn secondary inline" onClick={handleDownload}>Export PNG</button>
            <button className="btn secondary inline" onClick={() => openLink('https://twitter.com/intent/tweet?text=Check%20my%20Santa%20PFP!')}>
              Tweet it
            </button>
          </div>
        </div>
      </div>

      <footer className="footer">
        <span>Built for the Santa drop. Keep the backend .env with your AI key; never ship it client-side.</span>
        <span>Need contract changed? Swap the defaultContract string.</span>
      </footer>
    </div>
  );
}

export default App;
