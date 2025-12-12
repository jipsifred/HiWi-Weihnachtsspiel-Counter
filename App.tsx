import React, { useState, useEffect, useCallback } from 'react';
import { Upload, RotateCcw, X, Play, Keyboard, Info, TrendingUp } from 'lucide-react';
import { DEFAULT_POSITIONS, DEFAULT_DIMENSIONS, DEFAULT_WINNER_CONFIG, DEFAULT_BG_IMAGE } from './constants';
import { BarPosition, BarDimensions, ScoreState, WinnerConfig } from './types';
import { NeonBar } from './components/NeonBar';
import { Confetti } from './components/Confetti';

// Helper for safe storage access (prevents crashes in private mode/iframes)
const getSafeStorage = (key: string, defaultValue: any) => {
  try {
    if (typeof window === 'undefined') return defaultValue;
    const item = localStorage.getItem(key);
    return item !== null ? item : defaultValue;
  } catch (e) {
    console.warn(`Error reading ${key} from localStorage`, e);
    return defaultValue;
  }
};

const setSafeStorage = (key: string, value: string) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch (e) {
    console.warn(`Error writing ${key} to localStorage`, e);
  }
};

const App: React.FC = () => {
  // --- STATE INITIALIZATION WITH PERSISTENCE ---

  // viewMode: Persist setup vs presentation mode
  const [viewMode, setViewMode] = useState<'setup' | 'presentation'>(() => {
    const saved = getSafeStorage('neon_scoreboard_viewMode', 'setup');
    return (saved === 'presentation' || saved === 'setup') ? saved : 'setup';
  });
  
  // bgImage: Persist background. Handle 'NONE' for gradient mode.
  const [bgImage, setBgImage] = useState<string | null>(() => {
    const saved = getSafeStorage('neon_scoreboard_bgImage', DEFAULT_BG_IMAGE);
    if (saved === 'NONE') return null;
    return saved;
  });

  // positions & dimensions are constants
  const positions: BarPosition[] = DEFAULT_POSITIONS;
  const dimensions: BarDimensions = DEFAULT_DIMENSIONS;
  const winnerConfig: WinnerConfig = DEFAULT_WINNER_CONFIG;

  // scores: Persist the score object
  const [scores, setScores] = useState<ScoreState>(() => {
    const saved = getSafeStorage('neon_scoreboard_scores', null);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved scores", e);
      }
    }
    return { 1: 0, 2: 0, 3: 0, 4: 0 };
  });

  // maxScore: Persist max score setting
  const [maxScore, setMaxScore] = useState<number>(() => {
    const saved = getSafeStorage('neon_scoreboard_maxScore', '20');
    const parsed = parseInt(saved, 10);
    return !isNaN(parsed) ? parsed : 20;
  });

  const [showWinnerAnimation, setShowWinnerAnimation] = useState<boolean>(false);

  // --- PERSISTENCE EFFECTS ---

  useEffect(() => {
    setSafeStorage('neon_scoreboard_viewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    setSafeStorage('neon_scoreboard_bgImage', bgImage === null ? 'NONE' : bgImage);
  }, [bgImage]);

  useEffect(() => {
    setSafeStorage('neon_scoreboard_scores', JSON.stringify(scores));
  }, [scores]);

  useEffect(() => {
    setSafeStorage('neon_scoreboard_maxScore', maxScore.toString());
  }, [maxScore]);


  // --- LOGIC ---

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

  // Key Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey) {
        // Winner Toggle
        if (e.code === 'KeyW') {
          setShowWinnerAnimation(prev => !prev);
        }

        // Add Points (Shift + 1, 2, 3, 4)
        if (e.code === 'Digit1') setScores(prev => ({ ...prev, 1: Math.min(maxScore, (prev[1] || 0) + 1) }));
        if (e.code === 'Digit2') setScores(prev => ({ ...prev, 2: Math.min(maxScore, (prev[2] || 0) + 1) }));
        if (e.code === 'Digit3') setScores(prev => ({ ...prev, 3: Math.min(maxScore, (prev[3] || 0) + 1) }));
        if (e.code === 'Digit4') setScores(prev => ({ ...prev, 4: Math.min(maxScore, (prev[4] || 0) + 1) }));

        // Remove Points (Shift + 5, 6, 7, 8)
        // 5 -> Remove from 1 (Red)
        if (e.code === 'Digit5') setScores(prev => ({ ...prev, 1: Math.max(0, (prev[1] || 0) - 1) }));
        // 6 -> Remove from 2 (Blue)
        if (e.code === 'Digit6') setScores(prev => ({ ...prev, 2: Math.max(0, (prev[2] || 0) - 1) }));
        // 7 -> Remove from 3 (Green)
        if (e.code === 'Digit7') setScores(prev => ({ ...prev, 3: Math.max(0, (prev[3] || 0) - 1) }));
        // 8 -> Remove from 4 (Yellow)
        if (e.code === 'Digit8') setScores(prev => ({ ...prev, 4: Math.max(0, (prev[4] || 0) - 1) }));
        
        // Adjust Max Score (Shift + +/-)
        if (e.key === '+' || e.code === 'Equal' || e.code === 'NumpadAdd' || e.code === 'BracketRight') {
           setMaxScore(prev => Math.min(1000, prev + 10));
        }
        if (e.key === '-' || e.key === '_' || e.code === 'Minus' || e.code === 'NumpadSubtract' || e.code === 'Slash') {
           setMaxScore(prev => Math.max(10, prev - 10));
        }

        // Escape to return to setup
        if (e.code === 'Escape') {
             setViewMode('setup');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [maxScore]);

  const handleScoreClick = (id: number) => {
    if (viewMode === 'setup') return;
    setScores(prev => ({
      ...prev,
      [id]: Math.min(maxScore, (prev[id] || 0) + 1)
    }));
  };
  
  const handleScoreContextMenu = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    if (viewMode === 'setup') return;
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

  return (
    // Main Container: Flex center allows the child to scale nicely.
    <div className="w-screen h-screen bg-neutral-900 flex items-center justify-center overflow-hidden relative">
      {showWinnerAnimation && <Confetti />}

      {/* --- SETUP UI / INSTRUCTIONS --- */}
      {viewMode === 'setup' && (
        <div className="fixed top-0 left-0 w-full z-50 p-4 pointer-events-none flex flex-col gap-4 bg-black/90 backdrop-blur-md border-b border-white/10 shadow-2xl transition-all h-auto min-h-[300px]">
          
          <div className="flex justify-between items-start w-full max-w-7xl mx-auto pointer-events-auto">
             <div className="flex flex-col space-y-2">
               <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-blue-500 font-['Black_Ops_One']">
                 CONTROLS & SETUP
               </h1>
               <p className="text-gray-400 text-sm max-w-xl">
                 Configure your stage background and learn the controls below. 
                 <br/>
                 Press <strong>START PRESENTATION</strong> to begin the show.
               </p>
             </div>

             <div className="flex flex-col items-end space-y-2">
               <button 
                 onClick={() => {
                    setViewMode('presentation');
                 }}
                 className="flex items-center space-x-3 px-8 py-3 bg-green-600 text-white rounded-md hover:bg-green-500 transition-all font-bold shadow-[0_0_20px_rgba(22,163,74,0.4)] hover:shadow-[0_0_30px_rgba(22,163,74,0.6)] hover:scale-105 active:scale-95"
               >
                 <Play size={24} fill="currentColor" />
                 <span className="text-lg">START PRESENTATION</span>
               </button>
               
               <div className="flex flex-wrap gap-2 justify-end">
                 
                 <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-800 border border-white/20 rounded text-gray-200">
                    <TrendingUp size={14} className="text-yellow-400"/>
                    <span className="text-xs font-bold uppercase text-gray-400">Max Score:</span>
                    <input 
                      type="number" 
                      min="1" 
                      max="1000"
                      value={maxScore}
                      onChange={(e) => setMaxScore(Math.max(1, parseInt(e.target.value) || 20))}
                      className="w-12 bg-transparent text-white font-mono font-bold text-center focus:outline-none border-b border-white/20"
                    />
                 </div>

                 <label className="flex items-center space-x-2 px-3 py-1.5 bg-blue-900/40 hover:bg-blue-800/60 border border-blue-500/30 text-blue-200 rounded cursor-pointer transition-colors text-xs font-bold">
                    <Upload size={14} />
                    <span>Change Background</span>
                    <input type="file" accept="image/*" onChange={handleBgUpload} className="hidden" />
                 </label>
                 
                 {bgImage && bgImage !== DEFAULT_BG_IMAGE && (
                    <button onClick={() => setBgImage(null)} className="p-1.5 bg-red-900/40 border border-red-500/30 text-red-200 rounded hover:bg-red-800/60 transition-colors" title="Remove Background">
                      <X size={14} />
                    </button>
                 )}
                 <button 
                    onClick={() => setScores({1:0, 2:0, 3:0, 4:0})}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-red-900/40 text-red-200 rounded hover:bg-red-800/60 transition-colors border border-red-500/30 text-xs font-bold"
                 >
                    <RotateCcw size={14} />
                    <span>Reset Scores</span>
                 </button>
               </div>
            </div>
          </div>

          <div className="w-full max-w-7xl mx-auto h-px bg-white/10 my-2"></div>

          {/* KEYBOARD SHORTCUTS GRID */}
          <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pointer-events-auto">
              {/* Adding Points */}
              <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                  <div className="flex items-center space-x-2 mb-3 text-green-400">
                      <Keyboard size={20} />
                      <h3 className="font-bold uppercase tracking-wider text-sm">Add Points</h3>
                  </div>
                  <div className="space-y-2 text-sm font-mono text-gray-300">
                      <div className="flex justify-between items-center border-b border-white/5 pb-1">
                          <span>Shift + 1</span>
                          <span className="text-red-500 font-bold">+1 Red</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/5 pb-1">
                          <span>Shift + 2</span>
                          <span className="text-cyan-400 font-bold">+1 Blue</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/5 pb-1">
                          <span>Shift + 3</span>
                          <span className="text-emerald-500 font-bold">+1 Green</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span>Shift + 4</span>
                          <span className="text-yellow-400 font-bold">+1 Yellow</span>
                      </div>
                  </div>
              </div>
              {/* Removing Points */}
              <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                  <div className="flex items-center space-x-2 mb-3 text-red-400">
                      <Keyboard size={20} />
                      <h3 className="font-bold uppercase tracking-wider text-sm">Remove Points</h3>
                  </div>
                  <div className="space-y-2 text-sm font-mono text-gray-300">
                      <div className="flex justify-between items-center border-b border-white/5 pb-1">
                          <span>Shift + 5</span>
                          <span className="text-red-500 font-bold">-1 Red</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/5 pb-1">
                          <span>Shift + 6</span>
                          <span className="text-cyan-400 font-bold">-1 Blue</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/5 pb-1">
                          <span>Shift + 7</span>
                          <span className="text-emerald-500 font-bold">-1 Green</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span>Shift + 8</span>
                          <span className="text-yellow-400 font-bold">-1 Yellow</span>
                      </div>
                  </div>
              </div>
              {/* Special Controls */}
              <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                  <div className="flex items-center space-x-2 mb-3 text-amber-400">
                      <Info size={20} />
                      <h3 className="font-bold uppercase tracking-wider text-sm">Other Controls</h3>
                  </div>
                  <div className="space-y-2 text-sm font-mono text-gray-300">
                      <div className="flex justify-between items-center border-b border-white/5 pb-1">
                          <span>Shift + W</span>
                          <span className="text-white font-bold animate-pulse">Toggle Winner</span>
                      </div>
                       <div className="flex justify-between items-center border-b border-white/5 pb-1">
                          <span>Shift + +/-</span>
                          <span className="text-blue-400 font-bold">Max Score ±10</span>
                      </div>
                       <div className="flex justify-between items-center border-b border-white/5 pb-1">
                          <span>Shift + ESC</span>
                          <span className="text-gray-400 font-bold">Back to Setup</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 opacity-60">
                          <span>Click Bar</span>
                          <span>+1 Score</span>
                      </div>
                       <div className="flex justify-between items-center opacity-60">
                          <span>Right Click</span>
                          <span>-1 Score</span>
                      </div>
                  </div>
              </div>
          </div>
        </div>
      )}

      {/* --- THE STAGE --- */}
      {/* 
         FIXED: Logic to ensure 16:9 ratio fits in viewport.
         max-w-[177.78vh] means width cannot exceed (100vh * 16/9), preventing vertical overflow.
         w-full ensures it stretches horizontally until it hits that limit.
      */}
      <div 
        className={`relative shadow-2xl overflow-hidden bg-black rounded-lg select-none transition-all duration-700 ease-in-out border border-white/10 aspect-video mx-auto
          ${viewMode === 'setup' 
            ? 'w-[80%] max-w-6xl mt-[30vh] opacity-90' // Setup: smaller, pushed down
            : 'w-full max-w-[177.78vh]' // Presentation: Fills width, but caps width based on height to maintain 16:9 inside 100vh
          }
        `}
        style={{
          boxShadow: viewMode === 'presentation' ? "0 0 100px rgba(0,0,0,1)" : "0 0 50px rgba(0,0,0,0.8)"
        }}
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

        {/* The Bars */}
        {positions.map((pos) => (
          <div
            key={pos.id}
            className={`absolute z-20 flex flex-col items-center group/bar cursor-pointer`}
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              width: `${dimensions.width}%`,
              height: `${dimensions.height}%`,
              transition: 'left 0.1s, top 0.1s' 
            }}
            onClick={() => handleScoreClick(pos.id)}
            onContextMenu={(e) => handleScoreContextMenu(e, pos.id)}
          >
             <NeonBar 
               score={scores[pos.id]} 
               relativeHeightPercent={relativeHeights[pos.id]} 
               color={pos.color}
               isWinner={winningIds.includes(pos.id)}
               winnerConfig={winnerConfig}
             />
             
             {/* Hitbox Extension */}
             <div className="absolute inset-0 z-0"></div>
          </div>
        ))}
        
      </div>
    </div>
  );
};

export default App;