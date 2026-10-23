import React from 'react';

export const PageLoader: React.FC = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 space-y-3">
    <div className="w-9 h-9 rounded-md bg-zinc-950 text-white flex items-center justify-center font-bold text-xs tracking-tighter animate-pulse">
      CH
    </div>
    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 animate-pulse">
      Yuklanmoqda...
    </p>
  </div>
);

export default PageLoader;
