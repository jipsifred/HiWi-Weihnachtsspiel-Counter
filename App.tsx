import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Copy, RotateCcw, Monitor, Edit3, X, Maximize2, Image as ImageIcon, RotateCw, Scaling } from 'lucide-react';
import { DEFAULT_POSITIONS, DEFAULT_DIMENSIONS, DEFAULT_WINNER_CONFIG, DEFAULT_BG_IMAGE } from './constants';
import { BarPosition, BarDimensions, ScoreState, WinnerConfig } from './types';
import { NeonBar } from './components/NeonBar';
import { Confetti } from './components/Confetti';

// Helper to check what we are dragging
type DragTarget = { type: 'bar', id: number } | { type: 'element', elementType: 'text' | 'image' } | null;

const App: React.FC = () => {
  const [mode, setMode] = useState<'play' | 'plan'>('play');
  const [bgImage, setBgImage] = useState<string | null>(DEFAULT_BG_IMAGE);
  const [positions, setPositions] = useState<BarPosition[]>(DEFAULT_POSITIONS);
  const [dimensions, setDimensions] = useState<BarDimensions>(DEFAULT_DIMENSIONS);
  
  // Winner Configuration State
  const [winnerConfig, setWinnerConfig] = useState<WinnerConfig>(DEFAULT_WINNER_CONFIG);
  
  // Selected Element for editing (rotation/scale)
  const [selectedElement, setSelectedElement] = useState<'text' | 'image' | null>(null);

  const [scores, setScores] = useState<ScoreState>({ 1: 0, 2: 0, 3: 0, 4: 0 });
  const [maxScore, setMaxScore] = useState<number>(20);
  const [showWinnerAnimation, setShowWinnerAnimation] = useState<boolean>(false);
  
  // Dragging state
  const [dragTarget, setDragTarget] = useState<DragTarget>(null);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef<{ x: number, y: number }>({ x: 0, y: 0 });

  // Winner logic
  const getWinningIds = useCallback(() => {
    const vals = Object.values(scores) as number[];
    if (vals.length === 0) return [];
    const maxVal = Math.max(...vals);
    if (maxVal === 0) return []; // No winner if all 0
    return Object.keys(scores)
      .filter(key => scores[Number(key)] === maxVal)
      .map(Number);
  }, [scores]);

  const winningIds = showWinnerAnimation ? getWinningIds() : [];

  // Key Listener for Winner Animation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle winner animation on Shift + W
      if (e.shiftKey && (e.key === 'W' || e.key === 'w')) {
        setShowWinnerAnimation(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleScoreClick = (id: number) => {
    if (mode === 'plan') return;
    setScores(prev => ({
      ...prev,
      [id]: Math.min(maxScore, (prev[id] || 0) + 1)
    }));
  };
  
  // Right click to decrease score
  const handleScoreContextMenu = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    if (mode === 'plan') return;
    setScores(prev => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) - 1)
    }));
  };

  const calculateRelativeHeights = useCallback(() => {
    const heightMap: Record<number, number> = {};
    Object.keys(scores).forEach(keyStr => {
      const key = Number(keyStr);
      const score = scores[key];
      let percentage = (score / maxScore) * 100;
      percentage = Math.max(0, Math.min(100, percentage));
      heightMap[key] = percentage;
    });
    return heightMap;
  }, [scores, maxScore]);

  const relativeHeights = calculateRelativeHeights();

  // --- Drag & Drop Logic for Plan Mode ---
  
  const handleBarMouseDown = (e: React.MouseEvent, id: number) => {
    if (mode !== 'plan') return;
    e.stopPropagation();
    setDragTarget({ type: 'bar', id });
  };

  const handleElementMouseDown = (e: React.MouseEvent, elementType: 'text' | 'image') => {
    if (mode !== 'plan') return;
    e.stopPropagation();
    setSelectedElement(elementType);
    setDragTarget({ type: 'element', elementType });
    dragStartPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if(mode !== 'plan') return;
    setIsResizing(true);
    resizingRef.current = {
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startWidth: dimensions.width,
      startHeight: dimensions.height
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (mode !== 'plan' || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    // 1. Bar Dragging
    if (dragTarget?.type === 'bar') {
       let newX = ((e.clientX - containerRect.left) / containerRect.width) * 100;
       let newY = ((e.clientY - containerRect.top) / containerRect.height) * 100;
       
       newX = Math.max(0, Math.min(100 - dimensions.width, newX)); 
       newY = Math.max(0, Math.min(100 - dimensions.height, newY));

       setPositions(prev => prev.map(p => 
         p.id === dragTarget.id ? { ...p, x: newX, y: newY } : p
       ));
    }
    
    // 2. Element Dragging (Winner Image/Text)
    if (dragTarget?.type === 'element') {
        const deltaX = e.clientX - dragStartPos.current.x;
        // Inverted Y because we anchor from bottom now for the Crown
        const deltaY = e.clientY - dragStartPos.current.y; 
        
        // Reset drag start to current to simulate delta movement
        dragStartPos.current = { x: e.clientX, y: e.clientY };

        setWinnerConfig(prev => {
           const targetKey = dragTarget.elementType === 'text' ? 'textTransform' : 'imageTransform';
           return {
             ...prev,
             [targetKey]: {
               ...prev[targetKey],
               x: prev[targetKey].x + deltaX,
               y: prev[targetKey].y - deltaY // Invert drag Y for bottom-anchored element
             }
           };
        });
    }
  };
  
  // Handling resize globally
  const resizingRef = useRef<{startMouseX: number, startMouseY: number, startWidth: number, startHeight: number} | null>(null);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      // Resize Logic
      if (isResizing && resizingRef.current && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const deltaX = e.clientX - resizingRef.current.startMouseX;
        const deltaY = e.clientY - resizingRef.current.startMouseY;
        
        const deltaWPercent = (deltaX / containerRect.width) * 100;
        const deltaHPercent = (deltaY / containerRect.height) * 100;

        setDimensions({
          width: Math.max(5, Math.min(40, resizingRef.current.startWidth + deltaWPercent)),
          height: Math.max(10, Math.min(95, resizingRef.current.startHeight + deltaHPercent))
        });
      }
    };

    const handleGlobalMouseUp = () => {
      setDragTarget(null);
      setIsResizing(false);
      resizingRef.current = null;
    };

    if (dragTarget || isResizing) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [dragTarget, isResizing, dimensions, mode]);


  // --- Asset Uploads ---
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') setBgImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWinnerImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          setWinnerConfig(prev => ({...prev, imageSrc: event.target!.result as string}));
          setSelectedElement('image');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Export Config ---
  const handleCopyConfig = () => {
    const config = JSON.stringify({ positions, dimensions, winnerConfig }, null, 2);
    navigator.clipboard.writeText(config);
    alert("Full Configuration copied to clipboard!");
  };

  // --- Property Updates ---
  const updateElementTransform = (type: 'text' | 'image', field: 'rotate' | 'scale', value: number) => {
    setWinnerConfig(prev => {
      const key = type === 'text' ? 'textTransform' : 'imageTransform';
      return {
        ...prev,
        [key]: {
          ...prev[key],
          [field]: value
        }
      };
    });
  };

  return (
    <div className="w-screen h-screen bg-neutral-900 flex flex-col items-center justify-center p-4">
      {showWinnerAnimation && <Confetti />}

      {/* Top Bar Controls */}
      <div className="fixed top-0 left-0 w-full z-50 p-2 pointer-events-none flex flex-col gap-2">
        
        {/* Row 1: Main Modes & Global Actions */}
        <div className="flex justify-between items-center w-full px-2">
           <div className="flex space-x-2 pointer-events-auto bg-black/50 backdrop-blur-md p-2 rounded-lg border border-white/10 shadow-lg">
             <button 
               onClick={() => {
                 setMode(mode === 'play' ? 'plan' : 'play');
                 setSelectedElement(null);
               }}
               className={`flex items-center space-x-2 px-4 py-2 rounded-md font-bold transition-colors ${mode === 'plan' ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
             >
               {mode === 'plan' ? <Monitor size={18} /> : <Edit3 size={18} />}
               <span>{mode === 'plan' ? 'Play' : 'Edit'}</span>
             </button>
             
             <button 
               onClick={() => setScores({1:0, 2:0, 3:0, 4:0})}
               className="flex items-center space-x-2 px-3 py-2 bg-red-900/50 text-red-200 rounded-md hover:bg-red-800/50 transition-colors"
             >
               <RotateCcw size={18} />
               <span className="hidden sm:inline">Reset</span>
             </button>
          </div>

          {mode === 'plan' && (
            <div className="flex space-x-2 pointer-events-auto bg-black/50 backdrop-blur-md p-2 rounded-lg border border-white/10 shadow-lg items-center">
              <label className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-md cursor-pointer transition-colors text-xs font-bold">
                <Upload size={14} />
                <span>BG</span>
                <input type="file" accept="image/*" onChange={handleBgUpload} className="hidden" />
              </label>

              {bgImage && (
                <button onClick={() => setBgImage(null)} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-md text-red-400">
                  <X size={14} />
                </button>
              )}
              
              <div className="w-px h-6 bg-white/10 mx-1"></div>

              <button 
                 onClick={handleCopyConfig}
                 className="flex items-center space-x-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-md transition-colors text-xs font-bold"
              >
                <Copy size={14} />
                <span>Config</span>
              </button>
            </div>
          )}
        </div>

        {/* Row 2: Winner Configuration (Only Plan Mode) */}
        {mode === 'plan' && (
          <div className="flex justify-center w-full">
            <div className="pointer-events-auto bg-black/80 backdrop-blur-md p-2 rounded-lg border border-amber-500/30 shadow-lg flex flex-wrap gap-3 items-center justify-center">
                
                {/* Winner Image/Crown Upload */}
                <div className="flex items-center space-x-1">
                   <label className="flex items-center space-x-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded cursor-pointer transition-colors text-xs text-gray-200">
                    <ImageIcon size={14} />
                    <span>Crown/Icon</span>
                    <input type="file" accept="image/png,image/gif" onChange={handleWinnerImageUpload} className="hidden" />
                   </label>
                   {winnerConfig.imageSrc && (
                     <button 
                        onClick={() => setWinnerConfig(prev => ({...prev, imageSrc: null}))}
                        className="p-1 text-red-400 hover:bg-white/10 rounded"
                     >
                       <X size={14} />
                     </button>
                   )}
                </div>

                {/* Transforms for selected element */}
                <div className="w-px h-6 bg-white/20 mx-1"></div>
                
                {/* Always show controls for Image/Crown in plan mode even if not explicitly clicked, or when 'image' is selected */}
                <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 bg-gray-800 px-2 py-1 rounded">
                        <RotateCw size={12} className="text-gray-400"/>
                        <input 
                        type="range" min="-180" max="180" 
                        value={winnerConfig.imageTransform.rotate}
                        onChange={(e) => updateElementTransform('image', 'rotate', Number(e.target.value))}
                        className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <div className="flex items-center space-x-1 bg-gray-800 px-2 py-1 rounded">
                        <Scaling size={12} className="text-gray-400"/>
                        <input 
                        type="range" min="0.1" max="3" step="0.1"
                        value={winnerConfig.imageTransform.scale}
                        onChange={(e) => updateElementTransform('image', 'scale', Number(e.target.value))}
                        className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>

            </div>
          </div>
        )}
      </div>

      {/* The Stage */}
      <div 
        ref={containerRef}
        className="relative w-full aspect-video max-h-screen border border-white/10 shadow-2xl overflow-hidden bg-black rounded-lg select-none"
        style={{
          boxShadow: "0 0 50px rgba(0,0,0,0.8)"
        }}
        onMouseMove={handleMouseMove}
        onClick={() => setSelectedElement(null)}
      >
        {/* Background Layer */}
        {bgImage ? (
          <img 
            src={bgImage} 
            alt="Stage Background" 
            className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black z-0 pointer-events-none flex items-center justify-center opacity-50">
             <span className="text-white/10 font-mono text-xl">16:9 STAGE AREA</span>
          </div>
        )}

        {/* Overlay Grid in Plan Mode */}
        {mode === 'plan' && (
          <div className="absolute inset-0 pointer-events-none z-10 opacity-20" 
               style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          </div>
        )}

        {/* The Bars */}
        {positions.map((pos) => (
          <div
            key={pos.id}
            className={`absolute z-20 flex flex-col items-center group/bar ${mode === 'plan' && dragTarget?.type !== 'element' ? 'cursor-move' : 'cursor-pointer'}`}
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              width: `${dimensions.width}%`,
              height: `${dimensions.height}%`,
              outline: mode === 'plan' && dragTarget?.type === 'bar' && dragTarget.id === pos.id ? '2px dashed white' : 'none',
              transition: (mode === 'play' || isResizing || dragTarget) ? 'none' : 'left 0.1s, top 0.1s' 
            }}
            onMouseDown={(e) => handleBarMouseDown(e, pos.id)}
            onClick={() => handleScoreClick(pos.id)}
            onContextMenu={(e) => handleScoreContextMenu(e, pos.id)}
          >
             {mode === 'plan' && (
               <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/80 text-xs px-2 py-1 rounded text-white whitespace-nowrap pointer-events-none z-50">
                 X:{Math.round(pos.x)} Y:{Math.round(pos.y)}
               </div>
             )}

             <NeonBar 
               score={scores[pos.id]} 
               // In Plan Mode, pass 100% height so the crown sits at the top for editing
               relativeHeightPercent={mode === 'plan' ? 100 : relativeHeights[pos.id]} 
               color={pos.color}
               isDragging={dragTarget?.type === 'bar' && dragTarget.id === pos.id}
               isWinner={winningIds.includes(pos.id)}
               winnerConfig={winnerConfig}
               isPlanMode={mode === 'plan'}
               onElementMouseDown={handleElementMouseDown}
             />

             {/* Resize Handle - Only in Plan Mode */}
             {mode === 'plan' && (
                <div 
                  className="absolute bottom-0 right-0 w-8 h-8 bg-white/10 hover:bg-white/40 cursor-se-resize rounded-tl-xl z-50 flex items-center justify-center backdrop-blur-sm border-t border-l border-white/20"
                  onMouseDown={handleResizeStart}
                  title="Resize All Bars"
                >
                  <Maximize2 size={16} className="text-white rotate-90" />
                </div>
             )}
             
             {/* Hitbox Extension for Play Mode */}
             {mode === 'play' && (
                 <div className="absolute inset-0 z-0"></div>
             )}
          </div>
        ))}
        
      </div>

      {/* Mobile/Info footer */}
      <div className="fixed bottom-4 text-xs text-gray-500 font-mono pointer-events-none z-50 mix-blend-difference">
         {mode === 'plan' ? 'ARRANGE BARS & CROWN • CLICK ELEMENT TO EDIT' : 'CLICK: SCORE • SHIFT+W: TOGGLE WINNER'}
      </div>

    </div>
  );
};

export default App;