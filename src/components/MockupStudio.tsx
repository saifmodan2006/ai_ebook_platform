import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Camera,
  Play,
  Pause,
  BookOpen,
  FileDown,
  Sliders,
} from 'lucide-react';
import { Book } from '../types/book';

interface MockupStudioProps {
  book: Book;
  onBack: () => void;
  onOpenReader: () => void;
  onOpenExport: () => void;
}

export const MockupStudio: React.FC<MockupStudioProps> = ({
  book,
  onBack,
  onOpenReader,
  onOpenExport,
}) => {
  const [rotY, setRotY] = useState<number>(-22);
  const [rotX, setRotX] = useState<number>(8);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);
  const [stageBg, setStageBg] = useState<'travertine' | 'studio' | 'graphite'>('travertine');
  const [mockupType, setMockupType] = useState<'hardcover' | 'paperback' | 'tablet'>('hardcover');
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const stageRef = useRef<HTMLDivElement>(null);

  // Auto-rotation loop
  React.useEffect(() => {
    if (!isAutoRotating) return;
    const interval = setInterval(() => {
      setRotY((prev) => (prev + 0.35) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, [isAutoRotating]);

  // High-res Snapshot Generator
  const handleCaptureSnapshot = () => {
    setIsCapturing(true);

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setIsCapturing(false);
      return;
    }

    // Render Stage Backdrop
    if (stageBg === 'travertine') {
      const grad = ctx.createLinearGradient(0, 0, 1200, 800);
      grad.addColorStop(0, '#fbf9f5');
      grad.addColorStop(1, '#eee9de');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 800);
    } else if (stageBg === 'studio') {
      const grad = ctx.createLinearGradient(0, 0, 1200, 800);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(1, '#e5e5e5');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 800);
    } else {
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, 1200, 800);
    }

    // Soft Ambient Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.beginPath();
    ctx.ellipse(600, 680, 240, 26, 0, 0, Math.PI * 2);
    ctx.fill();

    // Book Cover Dimensions
    const bW = 380;
    const bH = 540;
    const bX = 600 - bW / 2;
    const bY = 400 - bH / 2;

    // Fill Cover Base
    ctx.fillStyle = book.theme.primaryColor || '#0f172a';
    ctx.roundRect(bX, bY, bW, bH, 8);
    ctx.fill();

    // Spine Hinge Crease
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(bX, bY, 14, bH);

    // Inner Hairline Frame
    ctx.strokeStyle = book.theme.accentColor || '#d97706';
    ctx.lineWidth = 1.5;
    ctx.roundRect(bX + 18, bY + 18, bW - 36, bH - 36, 4);
    ctx.stroke();

    // Category
    ctx.fillStyle = book.theme.accentColor || '#d97706';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText((book.category || 'MONOGRAPH').toUpperCase(), bX + 34, bY + 54);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px serif';
    const words = book.title.split(' ');
    let line = '';
    let curY = bY + 100;
    for (const w of words) {
      const test = line + w + ' ';
      if (ctx.measureText(test).width > bW - 68) {
        ctx.fillText(line, bX + 34, curY);
        line = w + ' ';
        curY += 34;
      } else {
        line = test;
      }
    }
    ctx.fillText(line, bX + 34, curY);

    // Subtitle
    ctx.fillStyle = '#d4d4d8';
    ctx.font = '14px sans-serif';
    ctx.fillText(book.subtitle.slice(0, 40), bX + 34, curY + 28);

    // Author
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px serif';
    ctx.fillText(`By ${book.author}`, bX + 34, bY + bH - 42);

    // Download PNG
    const link = document.createElement('a');
    link.download = `${book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_mockup.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    setTimeout(() => setIsCapturing(false), 400);
  };

  return (
    <div className="min-h-screen bg-[#18181b] text-stone-100 flex flex-col font-sans">
      {/* Top Studio Masthead */}
      <header className="h-14 border-b border-stone-800 bg-stone-900/90 backdrop-blur-md px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Library</span>
          </button>
          <span aria-hidden="true" className="text-stone-700">/</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-stone-400">3D Presentation Staging</span>
            <span aria-hidden="true" className="text-stone-700">·</span>
            <span className="text-xs font-serif font-medium text-stone-200 truncate max-w-sm">
              {book.title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenReader}
            className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-stone-400" />
            <span>Reader</span>
          </button>
          <button
            onClick={onOpenExport}
            className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-white text-stone-900 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export Center</span>
          </button>
        </div>
      </header>

      {/* Main Studio Viewport */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* 3D Canvas Viewport */}
        <div
          ref={stageRef}
          className={`flex-1 flex items-center justify-center p-8 select-none transition-colors duration-300 relative overflow-hidden ${
            stageBg === 'travertine'
              ? 'bg-[#f5f1e8] text-stone-900'
              : stageBg === 'studio'
              ? 'bg-[#eae8e3] text-stone-900'
              : 'bg-[#121214] text-white'
          }`}
          style={{ perspective: '1400px' }}
        >
          {/* Subtle Studio Lighting Vignette */}
          <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.4)_0,transparent_75%)]" />

          {/* Interactive 3D Book Container */}
          <div
            className="relative transition-transform duration-75 cursor-grab active:cursor-grabbing"
            style={{
              transformStyle: 'preserve-3d',
              transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
              width: '270px',
              height: '390px',
            }}
            onMouseDown={(e) => {
              setIsAutoRotating(false);
              const startX = e.clientX;
              const startY = e.clientY;
              const initialRotY = rotY;
              const initialRotX = rotX;

              const onMouseMove = (moveEvent: MouseEvent) => {
                const deltaX = moveEvent.clientX - startX;
                const deltaY = moveEvent.clientY - startY;
                setRotY(initialRotY + deltaX * 0.45);
                setRotX(Math.max(-40, Math.min(40, initialRotX - deltaY * 0.45)));
              };

              const onMouseUp = () => {
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
              };

              window.addEventListener('mousemove', onMouseMove);
              window.addEventListener('mouseup', onMouseUp);
            }}
          >
            {/* Soft Contact Ground Shadow */}
            <div
              className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-80 h-16 rounded-full blur-2xl pointer-events-none"
              style={{
                background: 'rgba(0, 0, 0, 0.45)',
                transform: 'rotateX(90deg) translateZ(-60px)',
              }}
            />

            {/* Front Cover */}
            <div
              className={`absolute inset-0 rounded-r-lg rounded-l-xs overflow-hidden p-7 flex flex-col justify-between text-white backface-hidden shadow-2xl ${
                mockupType === 'tablet' ? 'border-4 border-stone-800 rounded-2xl' : ''
              }`}
              style={{
                background: book.theme.coverBg,
                transform: 'translateZ(18px)',
              }}
            >
              {/* Spine Gutter Shadow */}
              <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/45 via-black/15 to-transparent pointer-events-none" />
              {/* Hairline Inset Border */}
              <div
                className="absolute inset-3 border pointer-events-none rounded-sm"
                style={{ borderColor: `${book.theme.accentColor}50` }}
              />

              <div className="relative z-10 space-y-3">
                <span
                  className="text-[10px] uppercase font-mono tracking-widest block font-medium"
                  style={{ color: book.theme.accentColor }}
                >
                  {book.category}
                </span>

                <div className="pt-2">
                  <h2 className="text-xl font-serif font-bold leading-tight tracking-tight text-white drop-shadow-xs">
                    {book.title}
                  </h2>
                  <p className="text-xs text-stone-200 mt-2 line-clamp-2 font-light leading-relaxed">
                    {book.subtitle}
                  </p>
                </div>
              </div>

              {/* Transformation Snippet */}
              <div className="relative z-10 p-2.5 rounded-lg bg-black/30 border border-white/10">
                <p className="text-[10px] font-serif italic text-stone-200 line-clamp-2">
                  "{book.persona.coreTransformation}"
                </p>
              </div>

              {/* Author & Chapter Metadata */}
              <div className="relative z-10 pt-3 border-t border-white/15 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[8px] uppercase font-mono tracking-widest text-stone-400 block">
                    Author
                  </span>
                  <span className="font-serif font-medium text-white truncate max-w-[140px] block">
                    {book.author}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-stone-300">
                  {book.chapters.length} Ch.
                </span>
              </div>
            </div>

            {/* Spine */}
            {mockupType !== 'tablet' && (
              <div
                className="absolute top-0 bottom-0 w-[36px] rounded-l-xs flex items-center justify-between p-3 text-white overflow-hidden shadow-inner"
                style={{
                  background: book.theme.primaryColor,
                  left: '-18px',
                  transform: 'rotateY(-90deg) translateZ(0px)',
                  backgroundImage:
                    'linear-gradient(90deg, rgba(0,0,0,0.5) 0%, rgba(255,255,255,0.08) 50%, rgba(0,0,0,0.6) 100%)',
                }}
              >
                <span className="text-[9px] font-mono tracking-widest uppercase rotate-90 transform origin-center whitespace-nowrap text-stone-300">
                  {book.title.slice(0, 24)}
                </span>
              </div>
            )}

            {/* Page Edges Block */}
            {mockupType !== 'tablet' && (
              <div
                className="absolute top-2 bottom-2 w-[34px] bg-[#fbf9f5] rounded-r-xs"
                style={{
                  right: '-17px',
                  transform: 'rotateY(90deg) translateZ(0px)',
                  backgroundImage:
                    'repeating-linear-gradient(0deg, #fbf9f5 0px, #fbf9f5 1px, #e7e5e4 2px)',
                  boxShadow: 'inset 0 0 6px rgba(0,0,0,0.15)',
                }}
              />
            )}

            {/* Back Cover */}
            <div
              className="absolute inset-0 rounded-l-lg rounded-r-xs p-6 flex flex-col justify-between text-white backface-hidden"
              style={{
                background: book.theme.primaryColor,
                transform: 'rotateY(180deg) translateZ(18px)',
              }}
            >
              <div className="space-y-3">
                <span className="text-[9px] font-mono uppercase tracking-widest text-stone-400">
                  Publication Colophon
                </span>
                <p className="text-xs text-stone-300 font-light leading-relaxed">
                  {book.persona.idealAudienceDescription}
                </p>
              </div>
              <div className="text-[9px] font-mono text-stone-400 border-t border-white/15 pt-3">
                PageCraft Publishing Studio
              </div>
            </div>
          </div>
        </div>

        {/* Studio Controls Sidebar */}
        <aside className="w-full lg:w-76 border-t lg:border-t-0 lg:border-l border-stone-800 bg-stone-900 p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-stone-400">
                Staging Parameters
              </span>
              <button
                onClick={() => {
                  setRotY(-22);
                  setRotX(8);
                }}
                className="text-[11px] text-stone-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Orbit Sliders */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs text-stone-300 mb-1.5 font-mono">
                  <span>Horizontal Angle</span>
                  <span className="text-stone-400">{Math.round(rotY)}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={rotY}
                  onChange={(e) => {
                    setIsAutoRotating(false);
                    setRotY(Number(e.target.value));
                  }}
                  className="w-full accent-stone-300 h-1 bg-stone-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-stone-300 mb-1.5 font-mono">
                  <span>Pitch Tilt</span>
                  <span className="text-stone-400">{Math.round(rotX)}°</span>
                </div>
                <input
                  type="range"
                  min="-35"
                  max="35"
                  value={rotX}
                  onChange={(e) => {
                    setIsAutoRotating(false);
                    setRotX(Number(e.target.value));
                  }}
                  className="w-full accent-stone-300 h-1 bg-stone-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Angle Presets */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  onClick={() => {
                    setIsAutoRotating(false);
                    setRotY(-22);
                    setRotX(8);
                  }}
                  className="py-1 px-2 rounded bg-stone-800 hover:bg-stone-750 text-stone-300 text-[10px] font-mono text-center"
                >
                  3/4 Angle
                </button>
                <button
                  onClick={() => {
                    setIsAutoRotating(false);
                    setRotY(0);
                    setRotX(0);
                  }}
                  className="py-1 px-2 rounded bg-stone-800 hover:bg-stone-750 text-stone-300 text-[10px] font-mono text-center"
                >
                  Frontal
                </button>
                <button
                  onClick={() => {
                    setIsAutoRotating(false);
                    setRotY(-90);
                    setRotX(0);
                  }}
                  className="py-1 px-2 rounded bg-stone-800 hover:bg-stone-750 text-stone-300 text-[10px] font-mono text-center"
                >
                  Spine
                </button>
              </div>

              <button
                onClick={() => setIsAutoRotating(!isAutoRotating)}
                className="w-full py-2 px-3 rounded-lg border border-stone-700 bg-stone-800/80 text-stone-300 text-xs font-medium flex items-center justify-center gap-2 hover:bg-stone-750 transition-colors"
              >
                {isAutoRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isAutoRotating ? 'Pause Turntable' : 'Spin Turntable'}</span>
              </button>
            </div>

            {/* Form Factor */}
            <div className="space-y-2">
              <span className="text-xs text-stone-400 font-mono block">Format Variant</span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'hardcover', label: 'Hardcover' },
                  { id: 'paperback', label: 'Journal' },
                  { id: 'tablet', label: 'Digital' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setMockupType(item.id as any)}
                    className={`py-1.5 text-xs rounded-lg border text-center transition-colors ${
                      mockupType === item.id
                        ? 'bg-stone-100 text-stone-900 border-stone-100 font-medium'
                        : 'bg-stone-800/60 border-stone-700 text-stone-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Stage Backdrop */}
            <div className="space-y-2">
              <span className="text-xs text-stone-400 font-mono block">Studio Environment</span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'travertine', label: 'Travertine' },
                  { id: 'studio', label: 'Pure White' },
                  { id: 'graphite', label: 'Graphite' },
                ].map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => setStageBg(bg.id as any)}
                    className={`py-1.5 text-xs rounded-lg border text-center transition-colors ${
                      stageBg === bg.id
                        ? 'bg-stone-100 text-stone-900 border-stone-100 font-medium'
                        : 'bg-stone-800/60 border-stone-700 text-stone-400 hover:text-white'
                    }`}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Snapshot Action */}
          <div className="pt-4 border-t border-stone-800 space-y-2">
            <button
              onClick={handleCaptureSnapshot}
              disabled={isCapturing}
              className="w-full py-2.5 rounded-lg bg-stone-100 hover:bg-white text-stone-900 font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{isCapturing ? 'Rendering PNG...' : 'Export High-Res Mockup (PNG)'}</span>
            </button>
            <p className="text-[10px] text-stone-400 text-center font-mono">
              Generates 1200x800 camera snapshot for marketing materials.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};
