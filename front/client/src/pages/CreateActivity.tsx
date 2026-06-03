import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ChevronLeft, Calendar, MapPin, Users, Sparkles, Send, Check } from 'lucide-react';
import anime from 'animejs/lib/anime.es.js';
import api from '../lib/api';
import { CATEGORY_THEMES } from '../config';
import Layout from '../components/Layout';
import { toast } from 'sonner';

export default function CreateActivity() {
  const [, setLocation] = useLocation();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('吃饭');
  const [description, setDescription] = useState('');
  const [location, setDestLoc] = useState('');
  const [startTime, setStartTime] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(4);
  const [autoApprove, setAutoApprove] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdActivity, setCreatedActivity] = useState<any>(null);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    anime({ targets: '.create-form-item', opacity: [0, 1], translateY: [15, 0], delay: anime.stagger(50), duration: 420, easing: 'easeOutBack' });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !location.trim() || !startTime || !description.trim()) {
      toast.error('请填写完整的活动信息');
      return;
    }
    setLoading(true);
    try {
      const res: any = await api.post('/activities', { title, category, description, location, start_time: new Date(startTime).toISOString(), max_participants: Number(maxParticipants), auto_approve: autoApprove });
      if (res.code === 200) {
        toast.success('邀约活动发起成功！系统已生成推荐邀请名单');
        const activity = res.data?.activity || res.data;
        setCreatedActivity(activity);
        setRecommended(res.data?.recommended_invitees || []);
        setSelected((res.data?.recommended_invitees || []).slice(0, 3).map((r: any) => r.user.id));
        setTimeout(() => anime({ targets: '.recommend-after-card', opacity: [0, 1], translateY: [30, 0], scale: [0.95, 1], duration: 600, easing: 'easeOutBack' }), 50);
      }
    } catch (err: any) { toast.error(err.message || '发起活动失败'); } finally { setLoading(false); }
  };

  const toggle = (uid: number) => setSelected((prev) => prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]);

  const generateInvitations = async () => {
    if (!createdActivity?.id) return;
    try {
      const res: any = await api.post(`/activities/${createdActivity.id}/invitations/generate`, { invitee_ids: selected, limit: selected.length || 5 });
      toast.success(res.message || '智能邀请已生成');
      setLocation(`/activities/${createdActivity.id}`);
    } catch (err: any) { toast.error(err.message || '生成邀请失败'); }
  };

  if (createdActivity) {
    return <Layout title="智能邀请生成" showNav={false} headerAction={<button onClick={() => setLocation(`/activities/${createdActivity.id}`)} className="w-10 h-10 border-2 border-black rounded-xl flex items-center justify-center bg-white shadow-[2px_2px_0px_0px_#121212]"><ChevronLeft className="w-6 h-6" /></button>}><div className="p-4 pb-24 space-y-4"><div className="recommend-after-card brutal-card bg-[#FFF6C7] p-5 opacity-0 relative overflow-hidden"><div className="absolute -right-6 -top-6 w-24 h-24 bg-[#FFDE4D] rounded-full animate-pulse" /><div className="relative"><h2 className="font-black text-xl flex items-center gap-2"><Sparkles className="w-6 h-6" />活动已发布</h2><p className="text-xs font-bold text-gray-600 mt-2">系统根据现有用户画像，为你筛选出最可能报名、最适合本活动的邀请对象。默认选中前三名，你也可以手动调整。</p></div></div>{recommended.length === 0 ? <div className="brutal-card bg-white p-8 text-center"><p className="font-black text-gray-500">暂无推荐对象</p><button onClick={() => setLocation(`/activities/${createdActivity.id}`)} className="brutal-button mt-4 px-4 py-2">查看活动详情</button></div> : <div className="space-y-3">{recommended.map((rec: any) => { const u = rec.user; const isSelected = selected.includes(u.id); return <div key={u.id} onClick={() => toggle(u.id)} className={`recommend-after-card opacity-0 brutal-card p-4 bg-white cursor-pointer transition-all ${isSelected ? 'translate-x-1' : ''}`}><div className="flex justify-between items-start"><div className="flex items-center gap-3"><div style={{ backgroundColor: u.avatar_color || '#FFDE4D' }} className="w-12 h-12 rounded-2xl border-2 border-black flex items-center justify-center font-black">{u.nickname?.[0]}</div><div><p className="font-black">{u.nickname} <span className="text-[10px] bg-[#FFDE4D] border border-black px-1 rounded">{u.mbti}</span></p><p className="text-xs font-bold text-gray-500">匹配分 {Math.round(rec.score)} · {u.school} {u.major}</p></div></div>{isSelected && <Check className="w-6 h-6 text-[#6BCB77]" />}</div><div className="flex flex-wrap gap-1 mt-3">{(rec.reasons || []).map((r: string) => <span key={r} className="text-[10px] font-black bg-[#FFF6C7] border border-black rounded px-2 py-0.5">{r}</span>)}</div><p className="mt-3 text-xs font-bold text-gray-600 bg-gray-50 border border-gray-200 rounded-xl p-2">{rec.message}</p></div>; })}</div>}<div className="absolute bottom-0 left-0 right-0 h-[80px] bg-white border-t-3 border-black flex items-center gap-3 px-5 z-10"><button onClick={() => setLocation(`/activities/${createdActivity.id}`)} className="flex-1 brutal-btn bg-white py-3.5 text-sm">稍后处理</button><button onClick={generateInvitations} className="flex-[1.4] brutal-btn-primary py-3.5 text-sm flex items-center justify-center gap-2"><Send className="w-4 h-4" />生成 {selected.length || '默认'} 份邀请</button></div></div></Layout>;
  }

  return (
    <Layout title="发起新邀约 🚀" showNav={false} headerAction={<button onClick={() => setLocation('/')} className="w-10 h-10 border-2 border-black rounded-xl flex items-center justify-center bg-white shadow-[2px_2px_0px_0px_#121212] active:translate-y-[1px]"><ChevronLeft className="w-6 h-6 text-black" /></button>}>
      <form onSubmit={handleSubmit} className="p-4 space-y-4 pb-24">
        <div className="create-form-item brutal-card p-4 bg-white opacity-0 space-y-3"><div className="space-y-1"><label className="text-xs font-black text-black">分类场景</label><div className="grid grid-cols-4 gap-2">{Object.keys(CATEGORY_THEMES).map((cat) => { const theme = CATEGORY_THEMES[cat]; const isSelected = category === cat; return <button key={cat} type="button" onClick={() => setCategory(cat)} style={{ backgroundColor: isSelected ? theme.border : '#FFFFFF', color: isSelected ? '#FFFFFF' : '#121212' }} className="py-2 border-2 border-black rounded-xl font-black text-xs shadow-[2px_2px_0px_0px_#121212] active:translate-y-[1px] transition-all">{cat}</button>; })}</div></div><div className="space-y-1"><label className="text-xs font-black text-black">活动标题</label><input type="text" placeholder="例如：旦苑二楼一起约麻辣香锅 🍲" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full brutal-input text-sm py-2" /></div></div>
        <div className="create-form-item brutal-card p-4 bg-white opacity-0 space-y-1"><label className="text-xs font-black text-black">活动描述 (行动指南)</label><textarea placeholder="请写下你的具体安排、集合方式、AA 制度或你想聊的话题..." value={description} onChange={(e) => setDescription(e.target.value)} className="w-full brutal-input h-[100px] resize-none text-sm py-2" /></div>
        <div className="create-form-item brutal-card p-4 bg-white opacity-0 space-y-3"><div className="space-y-1"><label className="text-xs font-black text-black flex items-center gap-1"><Calendar className="w-4 h-4" /> 集合时间</label><input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full brutal-input text-sm py-2" /></div><div className="space-y-1"><label className="text-xs font-black text-black flex items-center gap-1"><MapPin className="w-4 h-4" /> 集合目的地</label><input type="text" placeholder="例如：邯郸校区旦苑食堂二楼西侧" value={location} onChange={(e) => setDestLoc(e.target.value)} className="w-full brutal-input text-sm py-2" /></div></div>
        <div className="create-form-item brutal-card p-4 bg-white opacity-0 space-y-3"><div className="space-y-1"><label className="text-xs font-black text-black flex items-center gap-1"><Users className="w-4 h-4" /> 最大成局人数</label><input type="number" min="2" max="10" value={maxParticipants} onChange={(e) => setMaxParticipants(Number(e.target.value))} className="w-full brutal-input text-sm py-2" /></div><div className="flex justify-between items-center p-3 border-2 border-black rounded-xl bg-gray-50"><div><span className="text-xs font-black text-black">自动通过报名申请</span><p className="text-[9px] text-gray-500 font-bold">开启后无需手动审核，报名即入队</p></div><input type="checkbox" checked={autoApprove} onChange={(e) => setAutoApprove(e.target.checked)} className="w-5 h-5 accent-[#FFDE4D] border-2 border-black rounded" /></div></div>
        <div className="create-form-item brutal-card p-4 bg-[#FFF6C7] opacity-0"><h3 className="font-black text-sm flex items-center gap-2"><Sparkles className="w-4 h-4" />发布后自动推荐邀请对象</h3><p className="text-[10px] font-bold text-gray-600 mt-1">推荐算法会读取用户标签、MBTI、信誉和活动偏好，帮助你更快成局。</p></div>
        <div className="absolute bottom-0 left-0 right-0 h-[80px] bg-white border-t-3 border-black flex items-center px-5 z-10"><button type="submit" disabled={loading} className="w-full brutal-btn-primary py-3.5 text-sm">{loading ? '正在发布并计算推荐...' : '📢 发布邀约召集令'}</button></div>
      </form>
    </Layout>
  );
}
