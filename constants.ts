import { BarPosition, BarDimensions, WinnerConfig } from './types';

export const DEFAULT_DIMENSIONS: BarDimensions = {
  width: 12.5,
  height: 55
};

export const DEFAULT_POSITIONS: BarPosition[] = [
  { id: 1, x: 17, y: 27, color: 'red' },
  { id: 2, x: 35, y: 27, color: 'blue' },
  { id: 3, x: 53, y: 27, color: 'green' },
  { id: 4, x: 71, y: 27, color: 'yellow' },
];

export const DEFAULT_BG_IMAGE = "https://i.imgur.com/bYPd6FD.jpeg";

export const DEFAULT_WINNER_CONFIG: WinnerConfig = {
  text: "", // Unused now
  imageSrc: "https://i.imgur.com/og3yRAe.png",
  textTransform: { x: 0, y: 0, rotate: 0, scale: 1 }, 
  imageTransform: { x: -1, y: -1, rotate: 0, scale: 0.7 }
};

export const COLORS = {
  red: {
    border: 'border-red-500',
    bg: 'bg-red-600',
    shadow: 'shadow-red-500',
    glow: 'rgba(239, 68, 68, 0.6)',
  },
  blue: {
    border: 'border-cyan-400',
    bg: 'bg-cyan-500',
    shadow: 'shadow-cyan-400',
    glow: 'rgba(34, 211, 238, 0.6)',
  },
  green: {
    border: 'border-emerald-500',
    bg: 'bg-emerald-600',
    shadow: 'shadow-emerald-500',
    glow: 'rgba(16, 185, 129, 0.6)',
  },
  yellow: {
    border: 'border-yellow-400',
    bg: 'bg-yellow-500',
    shadow: 'shadow-yellow-400',
    glow: 'rgba(250, 204, 21, 0.6)',
  },
};