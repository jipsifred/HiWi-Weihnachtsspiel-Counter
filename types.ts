export type BarColor = 'red' | 'blue' | 'green' | 'yellow';

export interface BarPosition {
  id: number;
  x: number; // Percentage (0-100)
  y: number; // Percentage (0-100)
  color: BarColor;
}

export interface BarDimensions {
  width: number; // Percentage (0-100)
  height: number; // Percentage (0-100)
}

export interface ScoreState {
  [key: number]: number;
}

export interface ElementTransform {
  x: number; // pixels relative to bar center
  y: number; // pixels relative to bar top
  rotate: number; // degrees
  scale: number;
}

export interface WinnerConfig {
  text: string;
  imageSrc: string | null;
  textTransform: ElementTransform;
  imageTransform: ElementTransform;
}