import React from "react";
import { Activity, ShieldAlert, Cpu } from "lucide-react";

interface ScanningAnimationProps {
  imageUrl: string;
  statusText: string;
}

export function ScanningAnimation({ imageUrl, statusText }: ScanningAnimationProps) {
  return (
    <div className="w-full max-w-md mx-auto rounded-xl overflow-hidden relative shadow-2xl bg-black aspect-[4/5] border border-primary-900/50">
      
      {/* Base Image */}
      <img
        src={imageUrl}
        alt="Scanning"
        className="w-full h-full object-cover opacity-60 mix-blend-screen filter contrast-125 saturate-50"
      />
      
      {/* Grid Overlay */}
      <div 
        className="absolute inset-0 z-10 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #0ea5e9 1px, transparent 1px),
            linear-gradient(to bottom, #0ea5e9 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Futuristic Scan Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-primary-400 z-20 shadow-[0_0_20px_5px_rgba(56,189,248,0.7)] animate-scan-line pointer-events-none" />

      {/* Cyberpunk Vignette & Edge Glow */}
      <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.9)] z-20 pointer-events-none" />
      <div className="absolute inset-0 border-2 border-primary-500/20 z-20 rounded-xl pointer-events-none" />

      {/* HUD - Corner Brackets */}
      <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary-400 z-30 opacity-70" />
      <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary-400 z-30 opacity-70" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary-400 z-30 opacity-70" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-primary-400 z-30 opacity-70" />

      {/* Data Overlays */}
      <div className="absolute top-6 right-8 z-30 flex flex-col items-end gap-1">
        <div className="flex items-center text-primary-400 text-[10px] font-mono tracking-widest">
          <Cpu className="w-3 h-3 mr-1 animate-pulse" />
          GEMINI VISION-FLASH
        </div>
        <div className="text-primary-500/80 text-[10px] font-mono tracking-widest">
          SEQ: {Math.random().toString(36).substring(2, 8).toUpperCase()}
        </div>
      </div>

      <div className="absolute bottom-12 inset-x-8 z-30">
        <div className="bg-slate-950/80 backdrop-blur-md border border-primary-500/30 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Activity className="w-4 h-4 text-primary-400 mr-2 animate-bounce" />
            <span className="text-primary-300 text-xs font-mono font-semibold tracking-wider uppercase">
              Neural Processing
            </span>
          </div>
          <p className="text-white text-sm font-medium animate-pulse">
            {statusText}
          </p>
          
          <div className="w-full bg-slate-800 h-1 mt-3 rounded-full overflow-hidden">
            <div className="bg-primary-500 h-full w-2/3 animate-[shimmer_2s_infinite] origin-left" />
          </div>
        </div>
      </div>

      {/* Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-primary-500/20 rounded-full z-20 flex items-center justify-center animate-[spin_10s_linear_infinite]">
        <div className="w-2 h-2 bg-primary-400 rounded-full opacity-50 absolute -top-1" />
        <div className="w-2 h-2 bg-primary-400 rounded-full opacity-50 absolute -bottom-1" />
        <div className="w-2 h-2 bg-primary-400 rounded-full opacity-50 absolute -left-1" />
        <div className="w-2 h-2 bg-primary-400 rounded-full opacity-50 absolute -right-1" />
      </div>

    </div>
  );
}
