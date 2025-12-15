import React, { useEffect, useMemo, useRef, useState } from 'react';
import CanvasEditor from './components/CanvasEditor.jsx';
import Snowfield from './components/Snowfield.jsx';

const defaultPrompt =
  'santa meme mascot, cute chibi, glowing candy cane staff, neon winter background, 3d toon render, crisp, social pfp, symmetrical, cinematic lighting';

const defaultContract = '0xSANTA000000000000000000000000000000000000';

function App() {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const baseUrl = import.meta.env.BASE_URL || '/';

  const [prompt, setPrompt] = useState(defaultPrompt);
  const [displayName, setDisplayName] = useState('Santa PFP');
  const [accentColor, setAccentColor] = useState('#ff365d');
  const [scale, setScale] = useState(1.05);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(-6);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(115);
  const [badgeSubtitle, setBadgeSubtitle] = useState('Santa');

  const [accessoryList, setAccessoryList] = useState({ hat: [], beard: [], moustache: [] });
  const [hatAsset, setHatAsset] = useState('');
  const [beardAsset, setBeardAsset] = useState('');
  const [moustacheAsset, setMoustacheAsset] = useState('');

  const [activeDragLayer, setActiveDragLayer] = useState('base');
  const [layerOrder, setLayerOrder] = useState(['hat', 'moustache', 'beard']);
  const [flipXByKind, setFlipXByKind] = useState({ hat: false, moustache: false, beard: false });
  const [hatX, setHatX] = useState(0);
  const [hatY, setHatY] = useState(-205);
  const [hatScale, setHatScale] = useState(1);
  const [beardX, setBeardX] = useState(0);
  const [beardY, setBeardY] = useState(165);
  const [beardScale, setBeardScale] = useState(1);
  const [moustacheX, setMoustacheX] = useState(0);
  const [moustacheY, setMoustacheY] = useState(40);
  const [moustacheScale, setMoustacheScale] = useState(1);

  const [uploadedImage, setUploadedImage] = useState(null);
  const [aiImage, setAiImage] = useState(null);
  const [status, setStatus] = useState('Idle');
  const [loading, setLoading] = useState(false);

  const activeImage = useMemo(() => uploadedImage || aiImage, [uploadedImage, aiImage]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${baseUrl}accessories.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load accessories.json'))))
      .then((json) => {
        if (cancelled) return;
        setAccessoryList({
          hat: Array.isArray(json?.hat) ? json.hat : [],
          beard: Array.isArray(json?.beard) ? json.beard : [],
          moustache: Array.isArray(json?.moustache) ? json.moustache : []
        });
      })
      .catch(() => {
        // If the manifest is missing, keep empty lists.
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  const handleTweetCanvas = async () => {
    const dataUrl = canvasRef.current?.exportImage();
    if (!dataUrl) {
      setStatus('No canvas image');
      return;
    }

    const tweetText = 'Check my Santa PFP!';
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'santa-pfp.png', { type: 'image/png' });

      // Best case (mobile / supported browsers): share the image directly.
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ text: tweetText, files: [file] });
        setStatus('Shared');
        return;
      }

      // Desktop fallback: copy image to clipboard so user can paste into tweet.
      const ClipboardItemCtor = window.ClipboardItem;
      if (ClipboardItemCtor && navigator.clipboard?.write) {
        await navigator.clipboard.write([new ClipboardItemCtor({ 'image/png': blob })]);
        setStatus('Image copied — paste into tweet');
        openLink(twitterUrl);
        return;
      }

      // Last fallback: download the PNG and open compose.
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = 'santa-pfp.png';
      link.click();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      setStatus('Downloaded — attach it to tweet');
      openLink(twitterUrl);
    } catch (error) {
      console.error(error);
      setStatus('Tweet failed');
      openLink(twitterUrl);
    }
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
    setHatX(0);
    setHatY(-205);
    setHatScale(1);
    setBeardX(0);
    setBeardY(165);
    setBeardScale(1);
    setMoustacheX(0);
    setMoustacheY(40);
    setMoustacheScale(1);
    setActiveDragLayer('base');
    setLayerOrder(['hat', 'moustache', 'beard']);
    setFlipXByKind({ hat: false, moustache: false, beard: false });
    setStatus('Reset');
  };

  const isAccessorySelected = activeDragLayer === 'hat' || activeDragLayer === 'beard' || activeDragLayer === 'moustache';
  const selectedKind = isAccessorySelected ? activeDragLayer : null;

  const removeSelected = () => {
    if (!selectedKind) return;
    if (selectedKind === 'hat') setHatAsset('');
    if (selectedKind === 'beard') setBeardAsset('');
    if (selectedKind === 'moustache') setMoustacheAsset('');
    setActiveDragLayer('base');
  };

  const flipSelected = () => {
    if (!selectedKind) return;
    setFlipXByKind((prev) => ({ ...prev, [selectedKind]: !prev[selectedKind] }));
  };

  const sendBackward = () => {
    if (!selectedKind) return;
    setLayerOrder((prev) => {
      const idx = prev.indexOf(selectedKind);
      if (idx <= 0) return prev;
      const next = [...prev];
      const tmp = next[idx - 1];
      next[idx - 1] = next[idx];
      next[idx] = tmp;
      return next;
    });
  };

  const bringForward = () => {
    if (!selectedKind) return;
    setLayerOrder((prev) => {
      const idx = prev.indexOf(selectedKind);
      if (idx === -1 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      const tmp = next[idx + 1];
      next[idx + 1] = next[idx];
      next[idx] = tmp;
      return next;
    });
  };

  const canSendBackward = Boolean(selectedKind) && layerOrder.indexOf(selectedKind) > 0;
  const canBringForward =
    Boolean(selectedKind) && layerOrder.indexOf(selectedKind) !== -1 && layerOrder.indexOf(selectedKind) < layerOrder.length - 1;

  const Icon = ({ children }) => (
    <span className="btn-icon" aria-hidden="true">
      {children}
    </span>
  );

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
            <div className="hint">wait 1-2 minutes to load AI generated image.</div>
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
            <select className="input accessory-select accessory-select-hat" value={hatAsset} onChange={(e) => setHatAsset(e.target.value)}>
              <option value="">Hat: none</option>
              {accessoryList.hat.map((p) => (
                <option key={p} value={p}>
                  {p.replace(/^hat\//, 'Hat: ')}
                </option>
              ))}
            </select>
            <select className="input accessory-select accessory-select-beard" value={beardAsset} onChange={(e) => setBeardAsset(e.target.value)}>
              <option value="">Beard: none</option>
              {accessoryList.beard.map((p) => (
                <option key={p} value={p}>
                  {p.replace(/^beard\//, 'Beard: ')}
                </option>
              ))}
            </select>
            <select
              className="input accessory-select accessory-select-moustache"
              value={moustacheAsset}
              onChange={(e) => setMoustacheAsset(e.target.value)}
            >
              <option value="">Moustache: none</option>
              {accessoryList.moustache.map((p) => (
                <option key={p} value={p}>
                  {p.replace(/^moustache\//, 'Moustache: ')}
                </option>
              ))}
            </select>
          </div>

          <div className="hint" style={{ marginTop: 10 }}>
            Resize
          </div>

          <div className="actions-row" style={{ marginTop: 14 }}>
            <button className="btn" onClick={handleDownload}>
              <Icon>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <path d="M7 10l5 5 5-5" />
                  <path d="M12 15V3" />
                </svg>
              </Icon>
              Download PFP
            </button>
            <button className="btn secondary" onClick={handleCopyContract}>
              <Icon>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </Icon>
              Copy contract
            </button>
            <button
              className="btn secondary inline"
              onClick={() => openLink('https://twitter.com/intent/tweet?text=Minting%20my%20Santa%20PFP%20%23santapfp')}
            >
              <Icon>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53A4.48 4.48 0 0 0 12 8.09V9a10.66 10.66 0 0 1-9-5s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                </svg>
              </Icon>
              Twitter share
            </button>
            <button
              className="btn secondary inline"
              onClick={() => openLink('https://dexscreener.com/')}
            >
              <Icon>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6" />
                  <path d="M6 13v6" />
                  <path d="M10 9v10" />
                  <path d="M14 5v14" />
                </svg>
              </Icon>
              Dexscreener
            </button>
          </div>
          <div className="hint">Contract: {defaultContract}</div>
        </div>

        <div className="panel">
          <div className="label">Canvas</div>
          <div className="editor-menu">
            <button className="btn secondary inline" onClick={removeSelected} disabled={!selectedKind}>
              Remove
            </button>
            <button className="btn secondary inline" onClick={flipSelected} disabled={!selectedKind}>
              Flip
            </button>
            <button className="btn secondary inline" onClick={bringForward} disabled={!canBringForward}>
              Bring Forward
            </button>
            <button className="btn secondary inline" onClick={sendBackward} disabled={!canSendBackward}>
              Send Backward
            </button>
          </div>
          <div className="canvas-wrapper">
            <CanvasEditor
              ref={canvasRef}
              width={640}
              height={640}
              baseImage={activeImage}
              overlayText={displayName}
              accentColor={accentColor}
              scale={scale}
              offsetX={offsetX}
              offsetY={offsetY}
              layerOrder={layerOrder}
              onOffsetChange={(nextX, nextY) => {
                setOffsetX(Math.round(nextX));
                setOffsetY(Math.round(nextY));
              }}
              accessories={{
                hat: hatAsset
                  ? { src: `${baseUrl}${hatAsset}`, x: hatX, y: hatY, scale: hatScale, flipX: flipXByKind.hat }
                  : { src: null, x: hatX, y: hatY, scale: hatScale, flipX: flipXByKind.hat },
                beard: beardAsset
                  ? { src: `${baseUrl}${beardAsset}`, x: beardX, y: beardY, scale: beardScale, flipX: flipXByKind.beard }
                  : { src: null, x: beardX, y: beardY, scale: beardScale, flipX: flipXByKind.beard },
                moustache: moustacheAsset
                  ? {
                      src: `${baseUrl}${moustacheAsset}`,
                      x: moustacheX,
                      y: moustacheY,
                      scale: moustacheScale,
                      flipX: flipXByKind.moustache
                    }
                  : {
                      src: null,
                      x: moustacheX,
                      y: moustacheY,
                      scale: moustacheScale,
                      flipX: flipXByKind.moustache
                    }
              }}
              activeLayer={activeDragLayer}
              onActiveLayerChange={(layer) => setActiveDragLayer(layer)}
              onAccessoryChange={(kind, next) => {
                if (kind === 'hat') {
                  if (Number.isFinite(next.x)) setHatX(Math.round(next.x));
                  if (Number.isFinite(next.y)) setHatY(Math.round(next.y));
                  if (Number.isFinite(next.scale)) setHatScale(next.scale);
                }
                if (kind === 'beard') {
                  if (Number.isFinite(next.x)) setBeardX(Math.round(next.x));
                  if (Number.isFinite(next.y)) setBeardY(Math.round(next.y));
                  if (Number.isFinite(next.scale)) setBeardScale(next.scale);
                }
                if (kind === 'moustache') {
                  if (Number.isFinite(next.x)) setMoustacheX(Math.round(next.x));
                  if (Number.isFinite(next.y)) setMoustacheY(Math.round(next.y));
                  if (Number.isFinite(next.scale)) setMoustacheScale(next.scale);
                }
              }}
              hue={hue}
              saturation={saturation}
              badge={{ subtitle: badgeSubtitle }}
            />
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
