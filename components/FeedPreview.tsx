import React from 'react';
import { X, Heart } from 'lucide-react';

interface FeedPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  previewImage: string; // DataURL of the generated canvas
  title: string;
}

const MockCard = ({ image, title, likes, user }: { image: string, title: string, likes: string, user: string }) => (
  <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 break-inside-avoid mb-4">
    <div className="relative aspect-[3/4] bg-gray-200">
      <img src={image} alt="Cover" className="w-full h-full object-cover" />
    </div>
    <div className="p-3">
      <h3 className="font-bold text-slate-800 text-sm line-clamp-2 mb-2 leading-snug">{title}</h3>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded-full bg-gray-300"></div>
          <span>{user}</span>
        </div>
        <div className="flex items-center gap-1">
          <Heart className="w-3 h-3" />
          <span>{likes}</span>
        </div>
      </div>
    </div>
  </div>
);

export const FeedPreview: React.FC<FeedPreviewProps> = ({ isOpen, onClose, previewImage, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-100 w-full max-w-md h-[80vh] rounded-3xl overflow-hidden flex flex-col relative shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Header Mockup */}
        <div className="bg-white px-4 py-3 flex justify-between items-center border-b border-gray-200 shrink-0">
          <div className="font-bold text-gray-500">发现</div>
          <div className="flex gap-4 text-sm font-semibold text-slate-800">
            <span className="text-gray-400">关注</span>
            <span className="border-b-2 border-red-500 pb-1">推荐</span>
            <span className="text-gray-400">附近</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Feed Grid Mockup */}
        <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
          <div className="columns-2 gap-2">
            {/* The User's Post */}
            <MockCard 
              image={previewImage} 
              title={title || "你的标题会显示在这里"} 
              likes="1.2w" 
              user="房产严选" 
            />
            
            {/* Dummy Posts to simulate environment */}
            <MockCard image="https://picsum.photos/400/500?random=1" title="这才是生活该有的样子！200平大平层实拍" likes="5432" user="家居控" />
            <MockCard image="https://picsum.photos/400/600?random=2" title="别再买这种沙发了，真的很坑！" likes="899" user="避雷指南" />
            <MockCard image="https://picsum.photos/400/450?random=3" title="我的梦中情房终于装修好啦✨" likes="2.1w" user="小甜甜" />
            <MockCard image="https://picsum.photos/400/550?random=4" title="上海租房 | 3000元能租到什么样的房子？" likes="334" user="沪漂日记" />
          </div>
        </div>

        {/* Bottom Tab Bar Mockup */}
        <div className="bg-white px-6 py-3 flex justify-between items-center border-t border-gray-200 shrink-0 text-2xl">
            <span className="text-slate-800 font-bold">Home</span>
            <span className="text-gray-400">Shop</span>
            <span className="bg-red-500 text-white rounded-lg px-3 py-1 text-lg font-bold">+</span>
            <span className="text-gray-400">Msg</span>
            <span className="text-gray-400">Me</span>
        </div>
      </div>
    </div>
  );
};
