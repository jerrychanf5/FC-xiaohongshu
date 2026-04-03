
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Sparkles, Layout, Type, Palette, Download, Eye, RefreshCw, Copy, Image as ImageIcon, MessageSquare, Plus, X as XIcon, Tag, User, MapPin, Users, Lightbulb, Check } from 'lucide-react';
import { toPng } from 'html-to-image';

import { EditorState, StylePreset, LayoutMode, GeneratedContent, FONTS, CREATION_STRATEGIES } from './types';
import { generateListingContent, regenerateListingContent } from './services/geminiService';
import { CanvasArea } from './components/CanvasArea';
import { FeedPreview } from './components/FeedPreview';
import { HistoryInput } from './components/HistoryInput';

// Includes standard SC fonts + Japanese fonts that have great Kanji support for "Design" styles
const GOOGLE_FONTS_URL = "https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=DotGothic16&family=Hachi+Maru+Pop&family=Liu+Jian+Mao+Cao&family=Long+Cang&family=Ma+Shan+Zheng&family=Noto+Sans+SC:wght@400;700;900&family=Noto+Serif+SC:wght@400;700&family=Potta+One&family=Rampart+One&family=Reggae+One&family=RocknRoll+One&family=Yusei+Magic&family=ZCOOL+KuaiLe&family=ZCOOL+QingKe+HuangYou&family=ZCOOL+XiaoWei&family=Zhi+Mang+Xing&display=swap";
const LXGW_URL = 'https://cdn.jsdelivr.net/npm/lxgw-wenkai-screen-webfont/style.css';

const initialState: EditorState = {
  imageUrl: null,
  keywords: '',
  persona: '', // User Persona
  targetAudience: '', // Target Audience
  selectedStrategies: [], // User selected strategies (Default empty)
  
  generatedResults: [],
  currentResultIndex: 0,
  generated: null,

  style: StylePreset.URGENT,
  layout: LayoutMode.MAGAZINE, 
  customTitle: '',
  customFont: FONTS[0].name,
  tagFont: FONTS[0].name, // Default Tag Font
  textColor: '#FFFFFF', 
  highlightColor: '#FFFF00', 
  tags: [], 
  
  // Font Sizes (Pixels)
  titleSize: 64,
  tagSize: 24,

  isGenerating: false,
  feedback: '',
  isRegenerating: false,
};

// History types
interface HistoryState {
  personas: string[];
  audiences: string[];
  sellingPoints: string[];
}

const STORAGE_KEY = 'redestate_history_v1';

export default function App() {
  const [state, setState] = useState<EditorState>(initialState);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  
  // History State
  const [history, setHistory] = useState<HistoryState>({
    personas: [],
    audiences: [],
    sellingPoints: []
  });

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Fonts via JS (Fetch & Inject) to avoid CORS issues in html-to-image
  useEffect(() => {
    const injectStyle = (id: string, css: string) => {
      if (document.getElementById(id)) return;
      const style = document.createElement('style');
      style.id = id;
      style.textContent = css;
      document.head.appendChild(style);
    };

    const loadFonts = async () => {
      // 1. Google Fonts
      try {
        const response = await fetch(GOOGLE_FONTS_URL);
        const css = await response.text();
        injectStyle('google-fonts-style', css);
      } catch (e) {
        console.error("Failed to load Google fonts:", e);
      }

      // 2. LXGW WenKai (CDN)
      try {
        const response = await fetch(LXGW_URL);
        const css = await response.text();
        injectStyle('lxgw-font-style', css);
      } catch (e) {
        console.error("Failed to load LXGW fonts:", e);
      }

      // 3. Smiley Sans (Manual @font-face injection)
      const smileyCss = `
        @font-face {
          font-family: 'SmileySans';
          src: url('https://unpkg.com/smiley-sans@1.1.1/SmileySans-Oblique.ttf.woff2') format('woff2');
          font-display: swap;
        }
      `;
      injectStyle('smiley-sans-style', smileyCss);
    };
    loadFonts();
  }, []);

  // Load History from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save item to history
  const addToHistory = (field: keyof HistoryState, value: string) => {
    if (!value || !value.trim()) return;
    const trimmed = value.trim();
    
    setHistory(prev => {
      const currentList = prev[field];
      // Move to top if exists, add if new, limit to 10
      const newList = [trimmed, ...currentList.filter(i => i !== trimmed)].slice(0, 10);
      
      const newHistory = { ...prev, [field]: newList };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const clearHistory = (field: keyof HistoryState) => {
     setHistory(prev => {
       const newHistory = { ...prev, [field]: [] };
       localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
       return newHistory;
     });
  };

  // Handle Strategy Selection
  const toggleStrategy = (strategyName: string) => {
    setState(prev => {
      const current = prev.selectedStrategies;
      if (current.includes(strategyName)) {
        return { ...prev, selectedStrategies: current.filter(s => s !== strategyName) };
      }
      if (current.length >= 3) {
        // Limit to 3 for performance
        return prev;
      }
      return { ...prev, selectedStrategies: [...current, strategyName] };
    });
  };

  // Handle Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (end) => {
        setState(prev => ({ ...prev, imageUrl: end.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Apply a generated result to the canvas state
  const applyResultToCanvas = (result: GeneratedContent) => {
    setState(prev => ({
      ...prev,
      generated: result,
      customTitle: result.title,
      textColor: result.suggestedColor || prev.textColor,
      tags: result.sellingPoints,
    }));
  };

  // Handle AI Generation
  const handleGenerate = async () => {
    if (!state.imageUrl) return alert('请先上传素材');
    
    // Save inputs to history
    addToHistory('personas', state.persona);
    addToHistory('audiences', state.targetAudience);
    addToHistory('sellingPoints', state.keywords);

    setState(prev => ({ ...prev, isGenerating: true, generatedResults: [], generated: null }));
    try {
      // Pass persona, sellingPoints (keywords), targetAudience, and selected strategies
      const results = await generateListingContent(
        state.imageUrl, 
        state.keywords, 
        state.persona, 
        state.targetAudience,
        state.selectedStrategies
      );
      
      setState(prev => {
        const newState = {
          ...prev,
          generatedResults: results,
          currentResultIndex: 0,
          isGenerating: false
        };
        // Apply the first result automatically
        if (results.length > 0) {
          newState.generated = results[0];
          newState.customTitle = results[0].title;
          newState.textColor = results[0].suggestedColor || prev.textColor;
          newState.tags = results[0].sellingPoints;
        }
        return newState;
      });
    } catch (e) {
      console.error(e);
      setState(prev => ({ ...prev, isGenerating: false }));
      alert('生成失败，请重试');
    }
  };

  // Switch between tabs
  const handleResultTabChange = (index: number) => {
    const result = state.generatedResults[index];
    if (result) {
       setState(prev => ({ ...prev, currentResultIndex: index }));
       applyResultToCanvas(result);
    }
  };

  // Handle Regeneration with Feedback
  const handleRegenerate = async () => {
    if (!state.generated || !state.imageUrl) return;
    
    setState(prev => ({ ...prev, isRegenerating: true }));
    try {
      const result = await regenerateListingContent(state.generated, state.feedback, state.imageUrl);
      
      setState(prev => {
        // Update the item in the array
        const newResults = [...prev.generatedResults];
        newResults[prev.currentResultIndex] = result;
        
        return {
          ...prev,
          generatedResults: newResults,
          generated: result,
          customTitle: result.title,
          textColor: result.suggestedColor || prev.textColor,
          tags: result.sellingPoints,
          isRegenerating: false,
          feedback: '' // Clear feedback on success
        };
      });
    } catch (e) {
      console.error(e);
      setState(prev => ({ ...prev, isRegenerating: false }));
      alert('优化失败，请重试');
    }
  };

  // Export/Download
  const handleDownload = useCallback(async () => {
    if (canvasRef.current === null) return;
    try {
      // skipAutoScale helps prevent some rendering glitches with text scaling
      const dataUrl = await toPng(canvasRef.current, { cacheBust: true, pixelRatio: 2, skipAutoScale: true });
      const link = document.createElement('a');
      link.download = `red-estate-${state.generated?.strategy || 'post'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Download failed", err);
      alert('导出失败，请尝试截图或更换浏览器');
    }
  }, [canvasRef, state.generated]);

  // Preview Mockup
  const handlePreviewMockup = async () => {
    if (canvasRef.current === null) return;
    try {
      const dataUrl = await toPng(canvasRef.current, { pixelRatio: 1, skipAutoScale: true });
      setPreviewDataUrl(dataUrl);
      setIsPreviewOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('文案已复制到剪贴板');
  };

  // Tag Management
  const handleAddTag = () => {
    if (newTagInput.trim()) {
      setState(prev => ({ ...prev, tags: [...prev.tags, newTagInput.trim()] }));
      setNewTagInput('');
    }
  };

  const handleDeleteTag = (index: number) => {
    setState(prev => ({ ...prev, tags: prev.tags.filter((_, i) => i !== index) }));
  };

  return (
    <div className="flex h-screen w-full bg-slate-900 text-slate-100 overflow-hidden font-sans">
      
      {/* LEFT SIDEBAR: Input & Config */}
      <div className="w-96 bg-slate-900 border-r border-slate-800 flex flex-col h-full z-20 shadow-xl">
        <div className="p-5 border-b border-slate-800">
          <h1 className="text-xl font-bold flex items-center gap-2 text-red-500">
            <Sparkles className="w-5 h-5" />
            RedEstate AI
          </h1>
          <p className="text-xs text-slate-500 mt-1">房产小红书创作台 Pro</p>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
          
          {/* 1. Upload */}
          <section>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">1. 上传素材</h2>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 rounded-xl p-6 hover:border-red-500 hover:bg-slate-800 transition-colors cursor-pointer text-center group"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*"
              />
              {state.imageUrl ? (
                <div className="relative w-full h-32 rounded-lg overflow-hidden">
                  <img src={state.imageUrl} alt="preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <RefreshCw className="w-6 h-6 text-white" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-slate-300">
                  <ImageIcon className="w-8 h-8" />
                  <span className="text-sm">点击上传素材</span>
                </div>
              )}
            </div>
          </section>

          {/* 2. Content Strategy */}
          <section>
             <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">2. 设定信息</h2>
             <div className="space-y-4">
                <HistoryInput
                   label={<><User className="w-3 h-3"/> 人设设定 (可选)</>}
                   value={state.persona}
                   onChange={(val) => setState(prev => ({ ...prev, persona: val }))}
                   placeholder="例如：资深房产专家、邻家大姐姐..."
                   history={history.personas}
                   onSelectHistory={(val) => setState(prev => ({ ...prev, persona: val }))}
                   onClearHistory={() => clearHistory('personas')}
                />

                <HistoryInput
                   label={<><Users className="w-3 h-3"/> 目标购房群体 (可选)</>}
                   value={state.targetAudience}
                   onChange={(val) => setState(prev => ({ ...prev, targetAudience: val }))}
                   placeholder="例如：刚需首套、改善置换、投资客..."
                   history={history.audiences}
                   onSelectHistory={(val) => setState(prev => ({ ...prev, targetAudience: val }))}
                   onClearHistory={() => clearHistory('audiences')}
                />

                <HistoryInput
                   label={<><MapPin className="w-3 h-3"/> 楼盘卖点信息 (可选)</>}
                   value={state.keywords}
                   onChange={(val) => setState(prev => ({ ...prev, keywords: val }))}
                   placeholder="例如：急售、降价20万、地铁口..."
                   history={history.sellingPoints}
                   onSelectHistory={(val) => setState(prev => ({ ...prev, keywords: val }))}
                   onClearHistory={() => clearHistory('sellingPoints')}
                   isTextArea={true}
                />
             </div>
          </section>

           {/* 3. Strategy Selection (New) */}
          <section>
             <div className="flex justify-between items-center mb-3">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Lightbulb className="w-3 h-3"/> 3. 创作策略 (多选)
                </h2>
                <span className="text-[10px] text-slate-500">{state.selectedStrategies.length}/3</span>
             </div>
             <div className="flex flex-wrap gap-2">
                {CREATION_STRATEGIES.map((s) => {
                  const isSelected = state.selectedStrategies.includes(s.label);
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleStrategy(s.label)}
                      disabled={!isSelected && state.selectedStrategies.length >= 3}
                      className={`
                        px-2 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1
                        ${isSelected 
                          ? 'bg-red-600/20 border-red-500 text-red-400' 
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                        }
                        ${(!isSelected && state.selectedStrategies.length >= 3) ? 'opacity-40 cursor-not-allowed' : ''}
                      `}
                      title={s.desc}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      {s.label}
                    </button>
                  );
                })}
             </div>
             {state.selectedStrategies.length === 0 && (
                <p className="text-[10px] text-slate-600 mt-2 ml-1">
                   * 未选择时，AI 将自动推荐最佳策略。
                </p>
             )}

             <button 
                  onClick={handleGenerate}
                  disabled={state.isGenerating || !state.imageUrl}
                  className="w-full mt-6 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  {state.isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> 正在分析...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> 一键生成多维方案
                    </>
                  )}
              </button>
          </section>

          {/* 4. Generated Results (Tabs) */}
          {state.generatedResults.length > 0 && (
             <section className="animate-in slide-in-from-left duration-300 space-y-4 pt-4 border-t border-slate-800">
                
                {/* Strategy Tabs */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                   {state.generatedResults.map((res, idx) => (
                      <button
                        key={res.id}
                        onClick={() => handleResultTabChange(idx)}
                        className={`
                          shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap transition-all
                          ${state.currentResultIndex === idx
                            ? 'bg-red-600 text-white border-red-600 shadow-md'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                          }
                        `}
                      >
                        {res.strategy || `方案 ${idx + 1}`}
                      </button>
                   ))}
                </div>

                {/* Selected Content */}
                {state.generated && (
                  <div className="space-y-4">
                      {/* Cover Advice */}
                      <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-lg p-3 border border-indigo-500/30">
                          <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold mb-1">
                             <Palette className="w-3 h-3" /> 封面设计建议
                          </div>
                          <p className="text-xs text-indigo-100 leading-relaxed">
                            {state.generated.coverAdvice}
                          </p>
                      </div>

                      {/* Content Body */}
                      <div>
                          <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">正文文案</h2>
                            <button onClick={() => copyToClipboard(state.generated?.content || "")} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                              <Copy className="w-3 h-3" /> 复制
                            </button>
                          </div>
                          <div className="bg-slate-800 rounded-lg p-3 text-xs text-slate-300 max-h-48 overflow-y-auto border border-slate-700 scrollbar-thin scrollbar-thumb-slate-600">
                            <p className="whitespace-pre-wrap">{state.generated.content}</p>
                            <div className="mt-3 pt-3 border-t border-slate-700 flex flex-wrap gap-1">
                               {state.generated.tags.map((tag, i) => (
                                 <span key={i} className="text-blue-400">#{tag}</span>
                               ))}
                            </div>
                          </div>
                      </div>

                      {/* Feedback Loop */}
                      <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                        <label className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> 优化当前方案
                        </label>
                        <div className="flex gap-2">
                            <input
                              className="flex-1 bg-slate-900 border border-slate-700 rounded-md p-2 text-xs text-white focus:ring-1 focus:ring-red-500 outline-none"
                              placeholder="输入修改意见..."
                              value={state.feedback}
                              onChange={(e) => setState(prev => ({ ...prev, feedback: e.target.value }))}
                              onKeyDown={(e) => e.key === 'Enter' && handleRegenerate()}
                            />
                            <button 
                                onClick={handleRegenerate}
                                disabled={state.isRegenerating || !state.feedback}
                                className="px-3 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded-md transition-colors disabled:opacity-50"
                            >
                                {state.isRegenerating ? <RefreshCw className="w-3 h-3 animate-spin"/> : '优化'}
                            </button>
                        </div>
                      </div>
                  </div>
                )}
             </section>
          )}

           {/* 5. Tag Management */}
           <section>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2 mt-4 pt-4 border-t border-slate-800">
                <Tag className="w-3 h-3" /> 封面标签管理
              </h2>
              <div className="flex gap-2 mb-2">
                 <input 
                   type="text" 
                   value={newTagInput}
                   onChange={(e) => setNewTagInput(e.target.value)}
                   className="flex-1 bg-slate-800 border border-slate-700 rounded-md p-2 text-xs text-white focus:outline-none"
                   placeholder="添加新标签..."
                 />
                 <button onClick={handleAddTag} className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-md">
                   <Plus className="w-4 h-4" />
                 </button>
              </div>
              <div className="flex flex-wrap gap-2">
                 {state.tags.length > 0 ? (
                    state.tags.map((tag, idx) => (
                      <span key={idx} className="bg-slate-800 border border-slate-700 rounded-full px-2 py-1 text-xs text-slate-300 flex items-center gap-1">
                         {tag}
                         <button onClick={() => handleDeleteTag(idx)} className="hover:text-red-400">
                           <XIcon className="w-3 h-3" />
                         </button>
                      </span>
                    ))
                 ) : (
                   <span className="text-xs text-slate-600">暂无标签，请生成或添加</span>
                 )}
              </div>
           </section>

        </div>
      </div>

      {/* CENTER: Canvas */}
      <CanvasArea 
        state={state} 
        setPreviewData={setPreviewDataUrl}
        onExportRef={(ref) => {
            // @ts-ignore
            canvasRef.current = ref.current;
        }}
      />

      {/* RIGHT SIDEBAR: Visual Tweaks */}
      <div className="w-80 bg-white text-slate-800 flex flex-col h-full z-20 shadow-xl border-l border-gray-200">
        <div className="p-5 border-b border-gray-200">
           <h2 className="text-lg font-bold flex items-center gap-2">
            <Palette className="w-5 h-5 text-slate-600" />
            视觉微调
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
           {/* Typography */}
           <section>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block flex items-center gap-2">
                <Type className="w-3 h-3" /> 字体 & 标题
              </label>
              
              <div className="mb-4">
                <label className="text-xs text-gray-500 mb-1 block">封面标题 (支持 [ ] 高亮)</label>
                <textarea
                  rows={2}
                  value={state.customTitle}
                  onChange={(e) => setState(prev => ({ ...prev, customTitle: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:border-red-500 focus:outline-none"
                  placeholder="输入标题，使用[括号]高亮..."
                />
              </div>

              <div className="mb-4">
                <h3 className="text-xs font-bold text-slate-700 mb-2">标题字体</h3>
                 <select 
                  value={state.customFont}
                  onChange={(e) => setState(prev => ({ ...prev, customFont: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md p-2 text-xs focus:border-red-500 focus:outline-none mb-2"
                >
                  {FONTS.map(f => (
                    <option key={f.name} value={f.name}>{f.label} ({f.type})</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <h3 className="text-xs font-bold text-slate-700 mb-2">标签字体</h3>
                 <select 
                  value={state.tagFont}
                  onChange={(e) => setState(prev => ({ ...prev, tagFont: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md p-2 text-xs focus:border-red-500 focus:outline-none mb-2"
                >
                  {FONTS.map(f => (
                    <option key={f.name} value={f.name}>{f.label} ({f.type})</option>
                  ))}
                </select>
              </div>

              {/* Font Size Sliders */}
              <div className="mb-4 grid grid-cols-2 gap-4">
                 <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">标题大小</label>
                      <span className="text-xs text-gray-500">{state.titleSize}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="20" 
                      max="150" 
                      value={state.titleSize}
                      onChange={(e) => setState(prev => ({ ...prev, titleSize: Number(e.target.value) }))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                    />
                 </div>
                 <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">标签大小</label>
                      <span className="text-xs text-gray-500">{state.tagSize}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="60" 
                      value={state.tagSize}
                      onChange={(e) => setState(prev => ({ ...prev, tagSize: Number(e.target.value) }))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                    />
                 </div>
              </div>

              {/* Color Pickers */}
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-700 mb-2">文字主色</h3>
                    <div className="flex flex-wrap gap-2">
                       <div className="relative w-6 h-6 rounded-full overflow-hidden border border-gray-300 flex items-center justify-center bg-gradient-to-br from-red-500 via-green-500 to-blue-500">
                          <input 
                            type="color"
                            className="opacity-0 w-full h-full cursor-pointer absolute inset-0"
                            value={state.textColor}
                            onChange={(e) => setState(prev => ({ ...prev, textColor: e.target.value }))}
                          />
                       </div>
                       <div className="text-xs text-gray-500 self-center">{state.textColor}</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-700 mb-2">高亮颜色 [ ]</h3>
                    <div className="flex flex-wrap gap-2">
                       <div className="relative w-6 h-6 rounded-full overflow-hidden border border-gray-300 flex items-center justify-center bg-gradient-to-br from-yellow-300 via-orange-500 to-red-500">
                          <input 
                            type="color"
                            className="opacity-0 w-full h-full cursor-pointer absolute inset-0"
                            value={state.highlightColor}
                            onChange={(e) => setState(prev => ({ ...prev, highlightColor: e.target.value }))}
                          />
                       </div>
                       <div className="text-xs text-gray-500 self-center">{state.highlightColor}</div>
                    </div>
                  </div>
              </div>
           </section>

           {/* Style Presets */}
           <section>
             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">整体风格</label>
             <div className="grid grid-cols-2 gap-3">
               {[
                 { id: StylePreset.URGENT, label: '🔥 急售风', desc: '高饱和 抢眼' },
                 { id: StylePreset.LUXURY, label: '💎 豪宅风', desc: '黑金 高级感' },
                 { id: StylePreset.COZY, label: '🍃 种草风', desc: '温馨 奶油色' },
                 { id: StylePreset.MINIMAL, label: '⚪ 极简风', desc: '干净 留白' },
                 { id: StylePreset.MORANDI, label: '⛰️ 莫兰迪', desc: '高级灰 低调' },
                 { id: StylePreset.VIBRANT, label: '🌈 多巴胺', desc: '高亮 活力' },
                 // Cyberpunk Removed
                 { id: StylePreset.NEW_CHINESE, label: '🧧 新中式', desc: '红金 大气' },
                 { id: StylePreset.ACID, label: '🧪 酸性', desc: '前卫 酷感' },
               ].map((s) => (
                 <button
                  key={s.id}
                  onClick={() => setState(prev => ({ ...prev, style: s.id as StylePreset }))}
                  className={`p-3 rounded-lg border text-left transition-all ${state.style === s.id ? 'border-red-500 bg-red-50 ring-1 ring-red-500' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                 >
                   <div className="font-bold text-sm text-slate-800">{s.label}</div>
                   <div className="text-xs text-gray-500 mt-1">{s.desc}</div>
                 </button>
               ))}
             </div>
           </section>

           {/* Layouts */}
           <section>
             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block flex items-center gap-2">
               <Layout className="w-3 h-3" /> 排版结构
             </label>
             <div className="space-y-2">
               {[
                 { id: LayoutMode.MAGAZINE, label: '杂志大字报' },
                 { id: LayoutMode.SPLIT_BOTTOM, label: '底部留白' },
                 { id: LayoutMode.CENTER_BOX, label: '中心画框' },
                 // New Layouts
                 { id: LayoutMode.SOLID_SPLIT, label: '底部硬卡 (信息)' },
                 { id: LayoutMode.DIAGONAL, label: '动感对角 (吸睛)' },
                 { id: LayoutMode.PHOTO_FRAME, label: '拍立得框 (ins风)' },
                 { id: LayoutMode.POSTER_BOLD, label: '冲击波海报 (强)' },
                 { id: LayoutMode.FILM_STRIP, label: '胶片连拍 (故事)' },
                 { id: LayoutMode.MAGAZINE_ELEGANT, label: '时尚杂志 (高级)' },
                 // Phase 4 New
                 { id: LayoutMode.FOCUS_CENTER, label: '焦点突出 (特写)' },
                 { id: LayoutMode.CREATIVE_COLLAGE, label: '创意拼贴 (艺术)' },
                 { id: LayoutMode.LAYERED_DEPTH, label: '递进分层 (立体)' },
                 { id: LayoutMode.SYMMETRICAL_BALANCE, label: '对称平衡 (稳重)' },
                 { id: LayoutMode.FULL_BLEED_TYPO, label: '满版图文 (冲击)' },
               ].map((l) => (
                  <label key={l.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                    <input 
                      type="radio" 
                      name="layout" 
                      checked={state.layout === l.id}
                      onChange={() => setState(prev => ({ ...prev, layout: l.id as LayoutMode }))}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm font-medium">{l.label}</span>
                  </label>
               ))}
             </div>
           </section>
        </div>

        {/* Action Buttons */}
        <div className="p-5 border-t border-gray-200 space-y-3">
          <button 
            onClick={handlePreviewMockup}
            className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 rounded-lg font-bold transition-colors"
          >
            <Eye className="w-4 h-4" /> 预览发现页效果
          </button>
          <button 
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white py-3 rounded-lg font-bold shadow-lg shadow-red-500/30 transition-all hover:-translate-y-0.5"
          >
            <Download className="w-4 h-4" /> 导出高清大图
          </button>
        </div>
      </div>

      {/* Modal Layer */}
      <FeedPreview 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)}
        previewImage={previewDataUrl}
        title={state.customTitle}
      />
    </div>
  );
}
