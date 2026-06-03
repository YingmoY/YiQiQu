import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Compass, Search, Plus, Calendar, MapPin, Users, Flame, RefreshCw, Sparkles } from 'lucide-react';
import anime from 'animejs/lib/anime.es.js';
import api from '../lib/api';
import { CATEGORY_THEMES } from '../config';
import Layout from '../components/Layout';
import { toast } from 'sonner';

export default function Home() {
  const [, setLocation] = useLocation();
  const [activities, setActivities] = useState<any[]>([]);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const bannerList = [
    { id: 1, title: '算法优先推荐 ✨', desc: '兴趣、MBTI、信誉与时间地点共同决定广场排序', color: '#FFDE4D' },
    { id: 2, title: '发布后智能邀人 🤝', desc: '发起活动后自动找出最适合一起去的同学', color: '#6BCB77' },
    { id: 3, title: '安全行动群聊 🛡️', desc: '聊天可拉黑和举报，后台统一处理风险内容', color: '#FF5F5F' },
  ];

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/activities', { params: { category } });
      if (res.code === 200) {
        const list = res.data || [];
        const filtered = search.trim()
          ? list.filter((a: any) => a.title?.includes(search) || a.location?.includes(search) || a.description?.includes(search) || (a.recommendation_reasons || []).join(' ').includes(search))
          : list;
        setActivities(filtered);
        setTimeout(() => {
          anime({ targets: '.activity-card-item', opacity: [0, 1], translateY: [20, 0], rotate: [-1, 0], delay: anime.stagger(60), duration: 560, easing: 'easeOutBack' });
          anime({ targets: '.rec-badge', scale: [1, 1.08], direction: 'alternate', loop: true, duration: 900, easing: 'easeInOutSine' });
        }, 50);
      }
    } catch (err: any) { toast.error(err.message || '获取活动列表失败'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchActivities(); }, [category]);

  const handleSearchSubmit = (e: React.FormEvent) => { e.preventDefault(); fetchActivities(); };
  const handleCategoryClick = (cat: string) => setCategory(category === cat ? '' : cat);

  return (
    <Layout title="一起去广场 🎒">
      <div className="px-4 pt-4 overflow-x-auto flex gap-3 no-scrollbar shrink-0">
        {bannerList.map((banner) => <div key={banner.id} style={{ backgroundColor: banner.color }} className="w-[280px] shrink-0 border-3 border-black rounded-xl p-4 shadow-[3px_3px_0px_0px_#121212] flex flex-col justify-between hover:-translate-y-1 transition-transform"><div><h3 className="text-base font-black text-black mb-1">{banner.title}</h3><p className="text-xs font-bold text-gray-700">{banner.desc}</p></div><div className="mt-3 flex justify-between items-center"><span className="text-[10px] bg-white border border-black font-black px-2 py-0.5 rounded">智能体验</span><span className="text-xs font-black text-black underline cursor-pointer">立即体验 →</span></div></div>)}
      </div>

      <div className="px-4 pt-5 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
        {Object.keys(CATEGORY_THEMES).map((cat) => {
          const theme = CATEGORY_THEMES[cat];
          const isSelected = category === cat;
          return <button key={cat} onClick={() => handleCategoryClick(cat)} style={{ backgroundColor: isSelected ? theme.border : '#FFFFFF', color: isSelected ? '#FFFFFF' : '#121212', borderColor: '#121212' }} className="px-4 py-2 border-2 rounded-full font-black text-sm shadow-[2px_2px_0px_0px_#121212] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#121212] transition-all flex items-center gap-1.5 shrink-0"><span>{cat}</span><span className="text-xs opacity-80">{theme.label}</span></button>;
        })}
      </div>

      <form onSubmit={handleSearchSubmit} className="px-4 pt-4 shrink-0"><div className="relative"><input type="text" placeholder="搜索：目的地、标签、主题、推荐理由..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full brutal-input pl-11 py-2.5 text-sm" /><button type="submit" className="absolute left-3.5 top-3.5"><Search className="w-5 h-5 text-gray-500" /></button></div></form>

      <div className="px-4 pt-5 space-y-4 pb-4">
        <div className="flex justify-between items-center px-1"><div><span className="text-sm font-black text-black flex items-center gap-1"><Sparkles className="w-4 h-4 text-[#FF5F5F]" />算法推荐顺序 ({activities.length})</span><p className="text-[10px] font-bold text-gray-400">不是简单按发布时间，而是按与你的匹配度排序</p></div><button onClick={fetchActivities} className="text-xs font-bold text-gray-500 flex items-center gap-1 hover:text-black"><RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> 刷新</button></div>

        {activities.length === 0 ? <div className="brutal-card p-8 text-center bg-white"><p className="text-gray-500 font-bold mb-2">还没有匹配的邀约局 🍃</p><p className="text-xs text-gray-400">点击下方中间的发起按钮，创建一个吧！</p></div> : activities.map((act, idx) => {
          const theme = CATEGORY_THEMES[act.category] || { bg: '#FFFFFF', text: '#121212', border: '#121212' };
          const isFull = act.joined_count >= act.max_participants;
          return <div key={act.id} onClick={() => setLocation(`/activities/${act.id}`)} className="activity-card-item brutal-card p-4 bg-white cursor-pointer opacity-0 relative overflow-hidden"><div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-[#FFDE4D]/30 blur-sm" /><div className="relative flex justify-between items-start gap-2"><div className="flex items-center gap-2"><span style={{ backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }} className="border text-[10px] font-black px-2 py-0.5 rounded">{act.category}</span><span className="text-xs font-bold text-gray-400">发起人: {act.creator_nickname}</span></div><span className={`text-[10px] font-black px-2 py-0.5 rounded border border-black ${isFull ? 'bg-gray-200 text-gray-500' : 'bg-[#6BCB77] text-black'}`}>{act.status}</span></div><div className="relative mt-2 flex items-start justify-between gap-2"><h3 className="text-base font-black text-black line-clamp-1">{act.title}</h3><span className="rec-badge bg-[#FFDE4D] border-2 border-black rounded-full px-2 py-0.5 text-[10px] font-black shadow-[2px_2px_0_#121212] shrink-0">TOP {idx + 1}</span></div><div className="relative mt-3 space-y-1.5"><div className="flex items-center gap-1.5 text-xs font-bold text-gray-600"><Calendar className="w-4 h-4 text-black shrink-0" /><span>{new Date(act.start_time).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div><div className="flex items-center gap-1.5 text-xs font-bold text-gray-600"><MapPin className="w-4 h-4 text-black shrink-0" /><span className="line-clamp-1">{act.location}</span></div></div><div className="relative flex flex-wrap gap-1 mt-3">{(act.recommendation_reasons || []).slice(0, 3).map((r: string) => <span key={r} className="bg-[#FFF6C7] text-[10px] font-black text-black px-1.5 py-0.5 rounded border border-black">{r}</span>)}{act.description && <span className="bg-gray-100 text-[10px] font-bold text-gray-600 px-1.5 py-0.5 rounded border border-gray-300 line-clamp-1 max-w-[220px]">{act.description.slice(0, 30)}{act.description.length > 30 ? '...' : ''}</span>}</div><div className="relative mt-4 pt-3 border-t-2 border-dashed border-gray-200 flex justify-between items-center"><div className="flex items-center gap-1"><Users className="w-4 h-4 text-black" /><span className="text-xs font-black">{act.joined_count} / {act.max_participants} 人</span></div><div className="flex items-center gap-2 text-xs font-bold text-gray-500"><span>匹配 {Math.round(act.recommendation_score || 0)}</span><span className="flex items-center gap-1"><Flame className="w-4 h-4 text-[#FF5F5F]" />信誉: {act.creator_reputation}</span></div></div></div>;
        })}
      </div>
    </Layout>
  );
}
