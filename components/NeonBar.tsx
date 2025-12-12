import React from 'react';
import { Crown } from 'lucide-react';
import { COLORS } from '../constants';
import { BarColor, WinnerConfig } from '../types';

interface NeonBarProps {
  score: number;
  relativeHeightPercent: number; // 0 to 100
  color: BarColor;
  isDragging?: boolean;
  isWinner?: boolean;
  winnerConfig: WinnerConfig;
}

export const NeonBar: React.FC<NeonBarProps> = ({ 
  score, 
  relativeHeightPercent, 
  color, 
  isDragging, 
  isWinner,
  winnerConfig
}) => {
  const styles = COLORS[color];

  return (
    <div className={`relative w-full h-full flex flex-col justify-end group cursor-pointer select-none ${isWinner ? 'z-40' : ''}`}>
      
      {/* Invisible Container defining the max height area */}
      <div className="relative w-full h-full">
        
        {/* 
            CROWN / WINNER IMAGE 
            Positioned absolutely based on relativeHeightPercent so it rides the bar 
        */}
        <div 
          className="absolute left-0 w-full z-50 pointer-events-none"
          style={{ 
            bottom: `${relativeHeightPercent}%`, // Stick to top of bar
            height: 0, // Zero height container to not affect layout
            display: isWinner ? 'flex' : 'none',
            justifyContent: 'center',
            transition: 'bottom 0.7s cubic-bezier(0.34,1.56,0.64,1)' // Match bar animation
          }}
        >
             <div 
               className={`absolute bottom-0 flex items-center justify-center`}
               style={{
                 // The Y transform is inverted logic here because we are anchoring from bottom. 
                 transform: `translate(${winnerConfig.imageTransform.x}px, ${-winnerConfig.imageTransform.y}px) rotate(${winnerConfig.imageTransform.rotate}deg) scale(${winnerConfig.imageTransform.scale})`,
               }}
             >
               <div className={isWinner ? 'animate-bounce-slow' : ''}>
                 {winnerConfig.imageSrc ? (
                    <img 
                      src={winnerConfig.imageSrc} 
                      alt="Winner" 
                      className="max-w-[150px] drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]" 
                      draggable={false}
                    />
                 ) : (
                    /* Default Crown if no image */
                    <div className="relative">
                      <Crown size={80} className="text-yellow-400 fill-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" strokeWidth={1.5} />
                      <div className="absolute inset-0 bg-yellow-400 blur-xl opacity-30 rounded-full"></div>
                    </div>
                 )}
               </div>
             </div>
        </div>

        {/* Score Display */}
        <div className="absolute bottom-2 left-0 w-full flex justify-center items-center z-20 pointer-events-none">
            <div 
              className={`text-5xl font-black font-['Black_Ops_One'] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${isWinner ? 'animate-pulse scale-110' : ''}`}
              style={{ textShadow: `0 0 15px ${styles.glow}` }}
            >
                {score}
            </div>
        </div>

        {/* The Bar Itself - Grows from bottom */}
        <div 
          className={`absolute bottom-0 left-0 w-full rounded-xl border-[4px] ${styles.border} ${styles.bg} transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isWinner ? 'brightness-125' : 'opacity-95'}`}
          style={{ 
            height: `${relativeHeightPercent}%`,
            boxShadow: isWinner 
              ? `0 0 60px ${styles.glow}, inset 0 0 30px ${styles.glow}, 0 0 10px #fff` 
              : `0 0 40px ${styles.glow}, inset 0 0 20px ${styles.glow}`,
            animation: isWinner ? 'pulse-fast 1s infinite' : 'none'
          }}
        >
            {/* Glossy highlight */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[90%] h-[6px] bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-full blur-[2px]"></div>
            
            {/* Texture overlay */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none mix-blend-overlay rounded-xl"></div>
        </div>

      </div>

      {/* Hover/Touch Feedback */}
      {!isDragging && (
        <div className="absolute inset-0 bg-white/5 opacity-0 active:opacity-10 transition-opacity rounded-xl pointer-events-none"></div>
      )}
      
      <style>{`
        @keyframes pulse-fast {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.02); opacity: 0.9; }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};