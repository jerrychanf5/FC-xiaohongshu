

import React, { useRef, useEffect, useMemo } from 'react';
import { EditorState, LayoutMode, StylePreset } from '../types';

interface CanvasAreaProps {
  state: EditorState;
  setPreviewData: (dataUrl: string) => void;
  onExportRef: (ref: React.RefObject<HTMLDivElement>) => void;
}

export const CanvasArea: React.FC<CanvasAreaProps> = ({ state, setPreviewData, onExportRef }) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  // Pass the ref back to parent for export functionality
  useEffect(() => {
    onExportRef(canvasRef);
  }, [onExportRef]);

  // Determine styles based on presets
  const getPresetStyles = () => {
    switch (state.style) {
      case StylePreset.URGENT:
        return {
          shadow: 'drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]',
          badgeBg: 'bg-red-600 text-white',
          textStroke: '1px black',
        };
      case StylePreset.LUXURY:
        return {
          shadow: 'drop-shadow-lg',
          badgeBg: 'bg-black/80 text-yellow-100 backdrop-blur-md',
          textStroke: '0px',
        };
      case StylePreset.COZY:
        return {
          shadow: 'drop-shadow-sm',
          badgeBg: 'bg-white/90 text-amber-800 shadow-sm',
          textStroke: '0px',
        };
      case StylePreset.MORANDI:
        return {
          shadow: 'drop-shadow-md',
          badgeBg: 'bg-[#94A3B8] text-white',
          textStroke: '0px',
        };
      case StylePreset.VIBRANT:
        return {
          shadow: 'drop-shadow-[3px_3px_0px_#000000]',
          badgeBg: 'bg-[#FF00FF] text-white border border-black shadow-[2px_2px_0px_#000]',
          textStroke: '1px black',
        };
      case StylePreset.NEW_CHINESE:
        return {
          shadow: 'drop-shadow-[2px_2px_4px_rgba(0,0,0,0.4)]',
          badgeBg: 'bg-[#8B0000] text-[#F4D03F] border border-[#F4D03F]',
          textStroke: '0px',
        };
      case StylePreset.ACID:
        return {
          shadow: 'drop-shadow-[0px_0px_0px_transparent]',
          badgeBg: 'bg-[#CCFF00] text-black rounded-none border-2 border-black',
          textStroke: '0px',
        };
      default:
        return {
          shadow: 'drop-shadow-md',
          badgeBg: 'bg-black/50 text-white',
          textStroke: '0px',
        };
    }
  };

  const styles = getPresetStyles();
  const titleColor = state.textColor;
  const highlightColor = state.highlightColor;

  // Title Parser: Handles \n for newlines and [ ] for highlights
  // className now only used for positioning/layout (e.g., text-center, mb-6), NOT for text size
  const renderRichTitle = (className: string, extraStyles?: React.CSSProperties) => {
    const textToRender = state.customTitle || state.generated?.title || "输入[标题]生成封面";
    
    // Split by newlines first
    const lines = textToRender.split('\n');

    return (
      <div 
        className={`${className} ${styles.shadow}`}
        style={{ 
          fontFamily: state.customFont, 
          color: titleColor,
          WebkitTextStroke: styles.textStroke ? `1px ${styles.textStroke}` : undefined,
          fontSize: `${state.titleSize}px`, // Apply user font size
          lineHeight: 1.2,
          ...extraStyles 
        }}
      >
        {lines.map((line, lineIdx) => {
          // Parse brackets [ ] inside each line
          const parts = line.split(/(\[.*?\])/);
          return (
            <div key={lineIdx}>
              {parts.map((part, partIdx) => {
                if (part.startsWith('[') && part.endsWith(']')) {
                  // Highlighted part
                  const content = part.slice(1, -1);
                  return (
                    <span key={partIdx} style={{ color: highlightColor }}>
                      {content}
                    </span>
                  );
                }
                return <span key={partIdx}>{part}</span>;
              })}
            </div>
          );
        })}
      </div>
    );
  };

  // Allow empty tags by directly using state.tags without fallback
  const points = state.tags;
  
  // Helper to render a tag with dynamic size
  const renderTag = (text: string, baseClasses: string, extraStyle?: React.CSSProperties) => (
    <span 
      className={baseClasses}
      style={{ 
        fontSize: `${state.tagSize}px`, 
        fontFamily: state.tagFont, // Apply user selected tag font
        ...extraStyle 
      }}
    >
      {text}
    </span>
  );

  // Render Layout Variants
  const renderLayout = () => {
    switch (state.layout) {
      // --- Phase 4 Layouts (New) ---

      case LayoutMode.FOCUS_CENTER:
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-md z-0"></div>
            
            <div className="relative z-10 w-64 h-64 rounded-full border-4 border-white shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden mb-8">
               <img src={state.imageUrl!} alt="Focus" className="w-full h-full object-cover transform scale-125" />
            </div>

            <div className="relative z-20 text-center">
               {renderRichTitle("font-black mb-6", { color: '#FFF', textShadow: '0 4px 10px rgba(0,0,0,0.5)' })}
               <div className="flex justify-center gap-3">
                 {points.map((point, i) => (
                   renderTag(point, "px-4 py-1 rounded-full border border-white/50 text-white bg-white/10 backdrop-blur tracking-widest uppercase")
                 ))}
               </div>
            </div>
          </div>
        );

      case LayoutMode.CREATIVE_COLLAGE:
        return (
          <div className="absolute inset-0 p-6 pointer-events-none overflow-hidden bg-[#f0f0f0]">
             <div className="absolute top-[-10%] right-[-20%] w-[80%] h-[50%] bg-yellow-300 rounded-full blur-3xl opacity-50 z-0"></div>
             <div className="absolute bottom-[-10%] left-[-20%] w-[80%] h-[50%] bg-blue-300 rounded-full blur-3xl opacity-50 z-0"></div>

             <div className="absolute top-16 left-8 w-[70%] aspect-[3/4] bg-white p-2 shadow-xl transform -rotate-3 z-10">
               <div className="w-full h-full overflow-hidden">
                 <img src={state.imageUrl!} alt="Collage Main" className="w-full h-full object-cover" />
               </div>
               <div className="absolute -top-3 left-1/2 w-24 h-6 bg-white/80 transform -translate-x-1/2 rotate-2 shadow-sm"></div>
             </div>

             <div className="absolute bottom-24 right-6 w-[50%] aspect-square bg-white p-2 shadow-lg transform rotate-6 z-20 border border-gray-200">
                <div className="w-full h-full overflow-hidden filter grayscale contrast-125">
                   <img src={state.imageUrl!} alt="Collage Detail" className="w-full h-full object-cover scale-150" />
                </div>
                <div className="absolute -top-3 right-1/2 w-16 h-6 bg-red-500/80 transform translate-x-1/2 -rotate-3 shadow-sm"></div>
             </div>

             <div className="absolute bottom-8 left-6 z-30">
                {renderRichTitle("font-black text-slate-900 leading-[0.9]", { color: '#1e293b' })}
             </div>
             
             <div className="absolute top-8 right-4 z-30 flex flex-col gap-2 items-end">
               {points.map((point, i) => (
                 renderTag(`#${point}`, "bg-black text-white px-3 py-1 font-bold rotate-1 shadow-md")
               ))}
             </div>
          </div>
        );

      case LayoutMode.LAYERED_DEPTH:
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col">
             <div className="absolute inset-0 bg-white/30 backdrop-blur-xl z-0"></div>
             
             <div className="absolute top-12 left-6 right-6 bottom-32 bg-white shadow-2xl rounded-2xl overflow-hidden z-10 transform rotate-1">
                <img src={state.imageUrl!} alt="Card" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60"></div>
             </div>

             <div className="absolute bottom-12 left-4 z-20 transform -rotate-1">
                 {renderRichTitle("font-black drop-shadow-2xl leading-none", { 
                   color: titleColor === '#000000' ? '#FFF' : titleColor,
                   textShadow: '0 10px 30px rgba(0,0,0,0.5)'
                 })}
             </div>
             
             <div className="absolute top-8 right-4 z-20 flex flex-col gap-2">
                {points.map((point, i) => (
                  renderTag(point, "bg-white/90 text-slate-900 px-4 py-2 rounded-lg font-bold shadow-lg backdrop-blur")
                ))}
             </div>
          </div>
        );

      case LayoutMode.SYMMETRICAL_BALANCE:
        return (
          <div className="absolute inset-0 p-4 pointer-events-none flex flex-col justify-between items-center">
             <div className="absolute inset-4 border border-white/40 z-20 pointer-events-none"></div>
             <div className="absolute inset-6 border border-white/20 z-20 pointer-events-none"></div>
             
             <div className="z-30 mt-8 text-center bg-black/60 backdrop-blur-sm p-4 w-full">
                {renderRichTitle("font-serif tracking-widest uppercase", { color: '#FFF' })}
             </div>

             <div className="z-30 w-4 h-4 bg-white rotate-45 shadow-[0_0_10px_white]"></div>

             <div className="z-30 mb-8 flex justify-center gap-8 w-full">
                {points.map((point, i) => (
                   <div key={i} className="flex flex-col items-center gap-1">
                      <span className="w-1 h-8 bg-white/50"></span>
                      {renderTag(point, "text-white font-bold tracking-widest bg-black/40 px-2 py-1")}
                   </div>
                ))}
             </div>
          </div>
        );

      case LayoutMode.FULL_BLEED_TYPO:
        return (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
             
             {/* Huge Overlay Text - Note: Full Bleed Typo often needs VERY large text, so we might scale state.titleSize or just use it */}
             <div className="absolute inset-0 flex items-center justify-center mix-blend-overlay z-10 px-2">
                {renderRichTitle("leading-[0.9] font-black text-center text-white/90 break-words w-full", {
                   mixBlendMode: 'overlay',
                   opacity: 0.9,
                   fontSize: `${state.titleSize * 1.5}px` // Boost size for full bleed
                })}
             </div>
             
             <div className="absolute inset-0 flex items-center justify-center z-0 px-2 opacity-30">
                {renderRichTitle("leading-[0.9] font-black text-center text-black w-full", {
                   fontSize: `${state.titleSize * 1.5}px`
                })}
             </div>

             <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent pt-12 pb-6 px-6 z-20 flex justify-between items-end">
                <div className="flex gap-2">
                  {points.map((point, i) => (
                    renderTag(point, "text-white/90 border border-white/40 px-3 py-1 rounded font-light")
                  ))}
                </div>
             </div>
          </div>
        );

      case LayoutMode.FILM_STRIP:
        return (
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
             <div className="absolute top-0 bottom-0 left-0 w-8 bg-black z-20 flex flex-col justify-between py-2">
                {[...Array(12)].map((_,i) => <div key={i} className="w-4 h-6 bg-white mx-auto rounded-sm"></div>)}
             </div>
             <div className="absolute top-0 bottom-0 right-0 w-8 bg-black z-20 flex flex-col justify-between py-2">
                {[...Array(12)].map((_,i) => <div key={i} className="w-4 h-6 bg-white mx-auto rounded-sm"></div>)}
             </div>

             <div className="mt-12 mx-12 p-4 bg-black/50 backdrop-blur-sm rounded-xl border border-white/20">
               {renderRichTitle("font-bold text-center", { color: '#FFF' })}
             </div>

             <div className="mb-12 mx-12 flex flex-wrap gap-2 justify-center">
                {points.map((point, i) => (
                   renderTag(point, "bg-yellow-400 text-black px-3 py-1 font-mono font-bold uppercase tracking-widest border-2 border-black rotate-1")
                ))}
             </div>
          </div>
        );

      case LayoutMode.MAGAZINE_ELEGANT:
        return (
           <div className="absolute inset-0 p-8 flex flex-col items-center justify-center text-center pointer-events-none">
              <div className="border-y-2 border-white/80 w-full py-8 mb-4">
                 {renderRichTitle("font-serif italic tracking-wide")}
              </div>
              <div className="flex gap-4 items-center justify-center text-xs tracking-[0.3em] uppercase text-white font-light">
                 {points.map((point, i) => (
                    <span key={i} style={{ 
                      fontSize: `${Math.max(10, state.tagSize - 4)}px`,
                      fontFamily: state.tagFont 
                    }}>{point}</span>
                 ))}
              </div>
           </div>
        );

      case LayoutMode.POSTER_BOLD:
        return (
          <div className="absolute inset-0 flex flex-col pointer-events-none">
            <div className="h-[40%] bg-white/30 backdrop-blur-md flex flex-col justify-center items-center p-4 text-center z-10 relative overflow-hidden border-b border-white/20">
               {renderRichTitle("font-black leading-tight relative z-10", { 
                 color: state.textColor,
                 textShadow: '0 2px 10px rgba(0,0,0,0.15)' 
               })}
            </div>
            
            <div className="mt-auto mb-8 w-full flex justify-center gap-3 z-10 px-4 flex-wrap">
               {points.map((point, i) => (
                  renderTag(point, "px-4 py-2 bg-yellow-400 text-black font-bold border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] transform hover:-translate-y-1 transition-transform")
               ))}
            </div>
          </div>
        );

      case LayoutMode.SOLID_SPLIT:
        const isDarkText = state.textColor === '#000000' || state.textColor === '#1E3A8A' || state.textColor === '#059669';
        const cardBg = isDarkText ? 'bg-white' : 'bg-slate-900';
        const tagBg = isDarkText ? 'bg-slate-100 text-slate-800' : 'bg-slate-800 text-slate-200';

        return (
          <div className="absolute inset-0 flex flex-col justify-end pointer-events-none">
             <div className={`h-[28%] w-full ${cardBg} z-10 flex flex-col items-center justify-center p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]`}>
                {renderRichTitle("font-black mb-3 text-center", { color: isDarkText ? '#000000' : '#FFFFFF' })}
                <div className="flex gap-2 justify-center flex-wrap">
                   {points.map((point, i) => (
                      renderTag(point, `px-3 py-1 font-medium rounded-full ${tagBg}`)
                   ))}
                </div>
             </div>
          </div>
        );

      case LayoutMode.DIAGONAL:
         return (
           <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-[20%] left-[-10%] w-[120%] h-48 bg-yellow-400/90 transform -rotate-6 shadow-lg z-0 mix-blend-hard-light"></div>
              <div className="absolute top-[25%] left-[-10%] w-[120%] h-2 bg-black transform -rotate-6 z-0"></div>
              
              <div className="absolute top-[20%] w-full text-center z-10 transform -rotate-6 px-4">
                 {renderRichTitle("font-black italic tracking-tighter", { 
                   textShadow: '6px 6px 0px rgba(0,0,0,0.8)',
                   color: state.textColor 
                 })}
              </div>

              <div className="absolute bottom-12 right-4 flex flex-col items-end gap-4 z-10">
                 {points.map((point, i) => (
                    <div key={i} className={`px-6 py-2 transform -rotate-3 ${i % 2 === 0 ? 'bg-black text-white' : 'bg-white text-black'} font-bold shadow-[4px_4px_0px_rgba(0,0,0,0.2)] border-2 border-black`}>
                       <span style={{ fontSize: `${state.tagSize}px`, fontFamily: state.tagFont }}>{point}!!!</span>
                    </div>
                 ))}
              </div>
           </div>
         );

      case LayoutMode.PHOTO_FRAME:
         return (
           <div className="absolute inset-0 z-10 pointer-events-none border-[24px] border-white shadow-[inset_0_0_20px_rgba(0,0,0,0.2)] flex flex-col justify-end items-center pb-12">
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-white/50 shadow-xl max-w-[90%] text-center transform translate-y-8">
                  {renderRichTitle("font-bold text-slate-900 mb-2", { color: '#1e293b' })}
                  <div className="flex items-center justify-center gap-2 text-slate-500 uppercase tracking-widest font-serif mt-2">
                     {points.map((point, i) => (
                       <span key={i} style={{ 
                         fontSize: `${Math.max(10, state.tagSize - 4)}px`,
                         fontFamily: state.tagFont 
                       }}>{point} {i < points.length - 1 ? '•' : ''}</span>
                     ))}
                  </div>
              </div>
              <div className="absolute top-8 right-8 w-16 h-16 border-t-4 border-r-4 border-white/50 rounded-tr-3xl"></div>
              <div className="absolute bottom-8 left-8 w-16 h-16 border-b-4 border-l-4 border-white/50 rounded-bl-3xl"></div>
           </div>
         );

      case LayoutMode.MAGAZINE:
        return (
          <>
            <div className="absolute top-8 left-6 right-6 z-10 pointer-events-none">
               {renderRichTitle("font-black leading-tight break-words")}
            </div>
            <div className="absolute bottom-12 right-6 z-10 flex flex-col items-end gap-3 pointer-events-none">
               {points.map((point, i) => (
                  renderTag(point, `px-4 py-2 font-bold rounded-full ${styles.badgeBg}`)
               ))}
            </div>
          </>
        );

      case LayoutMode.SPLIT_BOTTOM:
        return (
          <>
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/90 to-transparent z-0 pointer-events-none" />
            <div className="absolute bottom-10 left-6 right-6 z-10 pointer-events-none">
              {renderRichTitle("font-bold mb-4 leading-tight")}
               <div className="flex flex-wrap gap-2 mt-4">
                {points.map((point, i) => (
                  renderTag(`#${point}`, "px-3 py-1 font-medium rounded-md bg-white/20 backdrop-blur text-white border border-white/30")
                ))}
               </div>
            </div>
          </>
        );
        
      case LayoutMode.CENTER_BOX:
        return (
           <div className="absolute inset-0 flex items-center justify-center z-10 p-8 pointer-events-none">
              <div className={`bg-white/10 backdrop-blur-md border-2 border-white/50 p-8 text-center rounded-xl shadow-2xl transform -rotate-2 w-full`}>
                  {renderRichTitle("font-bold mb-4 leading-tight", { textShadow: '2px 2px 0px rgba(0,0,0,0.5)' })}
                  
                  <div className="h-1 w-20 bg-yellow-400 mx-auto mb-4 mt-4"></div>
                   <div className="flex justify-center gap-2 flex-wrap">
                    {points.map((point, i) => (
                      renderTag(`${point} •`, "text-white font-semibold shadow-black drop-shadow-md")
                    ))}
                   </div>
              </div>
           </div>
        );

      default:
        // Default Fallback
        return (
          <>
             <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-full text-center px-4 z-10 pointer-events-none">
               {renderRichTitle("font-black tracking-tighter")}
             </div>

             <div className="absolute bottom-20 left-6 flex flex-col gap-4 z-10 pointer-events-none">
                {points.map((point, i) => (
                  <div key={i} className={`self-start px-4 py-2 transform ${i % 2 === 0 ? '-rotate-2' : 'rotate-1'} ${styles.badgeBg} rounded-lg font-bold shadow-lg border-2 border-white`}>
                    <span style={{ fontSize: `${state.tagSize}px`, fontFamily: state.tagFont }}>✨ {point}</span>
                  </div>
                ))}
             </div>
          </>
        );
    }
  };

  const isBlurredBg = state.layout === LayoutMode.FOCUS_CENTER || state.layout === LayoutMode.LAYERED_DEPTH || state.layout === LayoutMode.CREATIVE_COLLAGE;
  
  return (
    <div className="flex-1 bg-gray-200 flex items-center justify-center p-4 lg:p-8 overflow-hidden relative pattern-grid-lg text-gray-300">
      <div 
        ref={canvasRef}
        className={`relative w-full max-w-[450px] aspect-[3/4] bg-white shadow-2xl overflow-hidden select-none group ${state.style === StylePreset.COZY ? 'rounded-3xl' : ''}`}
      >
        {state.imageUrl ? (
          <>
            <img 
              src={state.imageUrl} 
              alt="Background" 
              className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 
                ${state.layout === LayoutMode.SOLID_SPLIT ? 'h-[75%]' : ''}
                ${isBlurredBg ? 'blur-xl scale-110 opacity-60' : ''}
              `}
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center text-gray-400">
            <div className="w-20 h-20 bg-gray-200 rounded-full mb-4 animate-pulse"></div>
            <p>请先上传素材</p>
          </div>
        )}

        <div className={`absolute inset-0 transition-all duration-300 pointer-events-none 
          ${state.style === StylePreset.LUXURY ? 'bg-black/20' : ''}
          ${state.style === StylePreset.ACID ? 'contrast-125 saturate-150' : ''}
        `}>
           {state.imageUrl && renderLayout()}
        </div>
      </div>
    </div>
  );
};
