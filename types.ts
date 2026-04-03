

export enum StylePreset {
  URGENT = 'URGENT',   // 急售风
  LUXURY = 'LUXURY',   // 豪宅风
  COZY = 'COZY',       // 种草风
  MINIMAL = 'MINIMAL', // 极简风
  MORANDI = 'MORANDI', // 莫兰迪
  VIBRANT = 'VIBRANT', // 多巴胺
  NEW_CHINESE = 'NEW_CHINESE', // 新中式
  ACID = 'ACID'        // 酸性设计
}

export enum LayoutMode {
  MAGAZINE = 'MAGAZINE',             // 杂志大字报
  SPLIT_BOTTOM = 'SPLIT_BOTTOM',     // 底部留白
  CENTER_BOX = 'CENTER_BOX',          // 中心方块
  
  // Phase 1 Layouts
  SOLID_SPLIT = 'SOLID_SPLIT',       // 底部硬卡
  DIAGONAL = 'DIAGONAL',             // 动感对角
  PHOTO_FRAME = 'PHOTO_FRAME',        // 拍立得框
  
  // Phase 2 Layouts
  POSTER_BOLD = 'POSTER_BOLD',       // 冲击波海报
  
  // Phase 3 Layouts
  FILM_STRIP = 'FILM_STRIP',         // 胶片连拍
  MAGAZINE_ELEGANT = 'MAGAZINE_ELEGANT', // 时尚杂志

  // Phase 4 Layouts
  FOCUS_CENTER = 'FOCUS_CENTER',       // 焦点突出
  CREATIVE_COLLAGE = 'CREATIVE_COLLAGE', // 创意拼贴
  LAYERED_DEPTH = 'LAYERED_DEPTH',     // 递进分层
  SYMMETRICAL_BALANCE = 'SYMMETRICAL_BALANCE', // 对称平衡
  FULL_BLEED_TYPO = 'FULL_BLEED_TYPO'  // 满版图文
}

export interface GeneratedContent {
  id: string; // Unique ID for keying
  strategy: string; // The strategy name used (e.g. "Data Contrast")
  title: string;
  content: string;
  tags: string[]; // Content tags (hashtags)
  suggestedColor?: string;
  sellingPoints: string[]; // Visual tags
  coverAdvice: string; // Visual design advice for the user
}

export interface EditorState {
  imageUrl: string | null;
  keywords: string; // Used for "Property Selling Points"
  persona: string;  // User Persona
  targetAudience: string; // New: Target Audience
  selectedStrategies: string[]; // User selected strategies
  
  // Generated Results
  generatedResults: GeneratedContent[]; // Store all variations
  currentResultIndex: number; // Currently selected result
  generated: GeneratedContent | null; // Helper for current active (backward compat)

  style: StylePreset;
  layout: LayoutMode;
  
  // Visual Editing
  customTitle: string;
  customFont: string; // Title Font
  tagFont: string;    // Tag Font
  textColor: string;
  highlightColor: string; // New: For bracketed text
  tags: string[]; // Visual tags on the cover (editable)
  
  // Font Sizing
  titleSize: number;
  tagSize: number;

  // AI Logic
  isGenerating: boolean;
  feedback: string;
  isRegenerating: boolean;
}

export const CREATION_STRATEGIES = [
  { id: '数字对比法', label: '📊 数字对比', desc: '用数据制造冲击' },
  { id: '痛点刺激法', label: '💔 痛点刺激', desc: '直击买房焦虑' },
  { id: '悬念提问法', label: '❓ 悬念提问', desc: '引发好奇点击' },
  { id: '场景化描述', label: '🏡 场景描述', desc: '描绘未来生活' },
  { id: '情感共鸣法', label: '❤️ 情感共鸣', desc: '走心温情故事' },
  { id: '福利诱惑法', label: '🎁 福利诱惑', desc: '强调性价比/降价' },
  { id: '权威背书法', label: '🏆 权威背书', desc: '专家/政策解读' },
  { id: '对比冲突法', label: '🆚 对比冲突', desc: '制造强烈反差' },
  { id: '本地化关键词', label: '📍 本地聚焦', desc: '精准同城流量' },
  { id: '热点借势法', label: '🔥 热点借势', desc: '蹭热梗/新政' }
];

export const FONTS = [
  // Basic
  { name: 'Noto Sans SC', label: '标准黑体', type: 'sans' },
  { name: 'Noto Serif SC', label: '优雅宋体', type: 'serif' },
  
  // Trendy / Design (New)
  { name: 'SmileySans', label: '得意黑 (潮)', type: 'display' }, 
  { name: 'LXGW WenKai', label: '霞鹜文楷 (文艺)', type: 'handwriting' },
  { name: 'Dela Gothic One', label: '德拉哥特 (重磅)', type: 'display' },
  { name: 'RocknRoll One', label: '摇滚圆体 (活泼)', type: 'display' },
  { name: 'Reggae One', label: '雷鬼体 (动感)', type: 'display' },
  { name: 'Rampart One', label: '立体镂空 (设计)', type: 'display' },
  { name: 'DotGothic16', label: '像素体 (复古)', type: 'display' },
  { name: 'Yusei Magic', label: '马克笔 (手绘)', type: 'handwriting' },
  { name: 'Potta One', label: '波塔毛笔 (可爱)', type: 'brush' },
  { name: 'Hachi Maru Pop', label: '圆滚滚 (萌)', type: 'handwriting' },

  // Classic Art
  { name: 'ZCOOL QingKe HuangYou', label: '站酷黄油', type: 'title' }, 
  { name: 'ZCOOL XiaoWei', label: '站酷小薇', type: 'elegant' },
  { name: 'Ma Shan Zheng', label: '马善政楷体', type: 'handwriting' },
  { name: 'Zhi Mang Xing', label: '极客行书', type: 'brush' }, 
  { name: 'Long Cang', label: '龙苍草书', type: 'cursive' }, 
  { name: 'ZCOOL KuaiLe', label: '快乐标题', type: 'display' },
  { name: 'Liu Jian Mao Cao', label: '流健毛草', type: 'cursive' }
];
