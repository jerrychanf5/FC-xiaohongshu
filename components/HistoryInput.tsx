
import React, { useState, useRef, useEffect } from 'react';
import { History, ChevronDown, Trash2 } from 'lucide-react';

interface HistoryInputProps {
  label: React.ReactNode; // Can include icon
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  history: string[];
  onSelectHistory: (val: string) => void;
  onClearHistory?: () => void;
  isTextArea?: boolean;
}

export const HistoryInput: React.FC<HistoryInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  history,
  onSelectHistory,
  onClearHistory,
  isTextArea = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs text-slate-500 flex items-center gap-1">
          {label}
        </label>
        {history.length > 0 && (
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${isOpen ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <History className="w-3 h-3" />
            <span className="scale-75">历史</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      <div className="relative">
        {isTextArea ? (
          <textarea
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none transition-all text-white placeholder-slate-500 scrollbar-hide"
            rows={2}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : (
          <input
            type="text"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none transition-all text-white placeholder-slate-500"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        )}

        {/* Dropdown Menu */}
        {isOpen && history.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
             <div className="max-h-48 overflow-y-auto custom-scrollbar">
               {history.map((item, index) => (
                 <button
                   key={index}
                   onClick={() => {
                     onSelectHistory(item);
                     setIsOpen(false);
                   }}
                   className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white border-b border-slate-700/50 last:border-0 truncate"
                 >
                   {item}
                 </button>
               ))}
             </div>
             {onClearHistory && (
               <div className="border-t border-slate-700 bg-slate-800/50">
                 <button 
                   onClick={() => {
                     onClearHistory();
                     setIsOpen(false);
                   }}
                   className="w-full text-center py-2 text-[10px] text-slate-500 hover:text-red-400 flex justify-center items-center gap-1"
                 >
                   <Trash2 className="w-3 h-3" /> 清空历史
                 </button>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};
