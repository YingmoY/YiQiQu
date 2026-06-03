import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { Ban, Calendar, CheckCircle2, Edit3, HeartHandshake, LogOut, Save, Shield, Sparkles, Tag, TestTube2, UserRound, X } from 'lucide-react';
import anime from 'animejs/lib/anime.es.js';
import { toast } from 'sonner';
import Layout from '../components/Layout';
import api, { clearTokens } from '../lib/api';
import { MBTI_OPTIONS, AVATAR_COLORS } from '../config';

const mbtiQuestions = [
  '聚会后我通常会感到更有能量',
  '我更相信具体事实而不是抽象直觉',
  '做决定时我更看重逻辑一致性',
  '我喜欢提前计划好行程',
  '我更愿意主动认识新朋友',
  '我会优先关注现实可执行方案',
  '争论时我会先分析事实和原则',
  '待办事项被清空会让我很安心',
];

export default function Profile() {
  const [, setLocation] = useLocation();
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [tagInput, setTagInput] = useState('');
  const [blacklist, setBlacklist] = useState<any[]>([]);
  const [created, setCreated] = useState<any[]>([]);
  const [applied, setApplied] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [testAnswers, setTestAnswers] = useState<number[]>(Array(mbtiQuestions.length).fill(1));
  const [activePanel, setActivePanel] = useState<'edit' | 'mbti' | 'blacklist' | 'created' | 'applied' | 'invites'>('edit');
  const user = profile?.user || profile;
  const reputation = profile?.reputation;

  const allTags = useMemo(() => Array.from(new Set([...(form.interests || []), ...(form.tags || [])])).filter(Boolean), [form]);

  const loadAll = async () => {
    try {
      const [profileRes, blacklistRes, createdRes, appliedRes, invitationsRes]: any[] = await Promise.all([
        api.get('/users/profile'),
        api.get('/users/blacklist'),
        api.get('/me/activities/created'),
        api.get('/me/activities/applied'),
        api.get('/me/invitations'),
      ]);
      const p = profileRes.data;
      const u = p.user || p;
      setProfile(p);
      setForm({
        nickname: u.nickname || '',
        avatar_color: u.avatar_color || '#FFDE4D',
        school: u.school || '',
        major: u.major || '',
        bio: u.bio || '',
        mbti: u.mbti || 'INFP',
        social_energy: u.social_energy || 50,
        interests: u.interests || [],
        tags: u.tags || [],
      });
      setBlacklist(blacklistRes.data || []);
      setCreated(createdRes.data || []);
      setApplied(appliedRes.data || []);
      setInvitations(invitationsRes.data || []);
      setTimeout(() => anime({ targets: '.mine-card', opacity: [0, 1], translateY: [18, 0], delay: anime.stagger(45), easing: 'easeOutBack', duration: 520 }), 40);
    } catch (err: any) {
      toast.error(err.message || '加载个人中心失败');
    }
  };

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      anime({ targets: '.mine-card', opacity: [0, 1], translateY: [10, 0], delay: anime.stagger(25), easing: 'easeOutQuad', duration: 360 });
    }, 20);
    return () => window.clearTimeout(timer);
  }, [activePanel]);

  const saveProfile = async () => {
    try {
      const res: any = await api.put('/users/profile', { ...form, mbti_source: 'manual' });
      if (res.code === 200) {
        toast.success('资料已更新');
        localStorage.setItem('user_info', JSON.stringify(res.data));
        loadAll();
      }
    } catch (err: any) { toast.error(err.message || '保存失败'); }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (allTags.includes(t)) { setTagInput(''); return; }
    setForm({ ...form, tags: [...(form.tags || []), t] });
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setForm({ ...form, tags: (form.tags || []).filter((t: string) => t !== tag), interests: (form.interests || []).filter((t: string) => t !== tag) });
  };

  const submitMBTITest = async () => {
    try {
      const res: any = await api.post('/users/mbti-test', { answers: testAnswers });
      toast.success(`测试完成：${res.data.mbti}`);
      loadAll();
    } catch (err: any) { toast.error(err.message || '测试提交失败'); }
  };

  const unblock = async (id: number) => {
    try { await api.delete(`/users/${id}/unblock`); toast.success('已解除黑名单'); loadAll(); } catch (err: any) { toast.error(err.message || '解除失败'); }
  };

  const logout = () => { clearTokens(); setLocation('/auth'); };

  if (!user) {
    return <Layout title="我的"><div className="p-8 text-center font-black">资料加载中...</div></Layout>;
  }

  const panels = [
    ['edit', '资料编辑', Edit3], ['mbti', 'MBTI 测试', TestTube2], ['blacklist', '黑名单', Ban], ['created', '我的发起', Calendar], ['applied', '我的报名', CheckCircle2], ['invites', '我的邀请', HeartHandshake],
  ] as const;

  return (
    <Layout title="我的">
      <div className="p-4 pb-24 space-y-4">
        <div className="mine-card brutal-card bg-white p-4 opacity-0 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-28 h-28 bg-[#FFDE4D] rounded-full blur-sm animate-pulse" />
          <div className="relative flex items-center gap-3">
            <div style={{ backgroundColor: user.avatar_color }} className="w-16 h-16 rounded-2xl border-3 border-black shadow-[3px_3px_0_#121212] flex items-center justify-center font-black text-2xl">{user.nickname?.[0]}</div>
            <div className="flex-1">
              <h2 className="text-xl font-black">{user.nickname}</h2>
              <p className="text-xs font-bold text-gray-500">{user.email}</p>
              <p className="text-xs font-bold mt-1">{user.school} · {user.major}</p>
            </div>
            <button onClick={logout} className="p-2 rounded-xl border-2 border-black bg-white shadow-[2px_2px_0_#121212]"><LogOut className="w-4 h-4" /></button>
          </div>
          <div className="relative mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="bg-[#FFDE4D]/70 rounded-xl border border-black p-2"><p className="text-xs font-bold">MBTI</p><p className="font-black">{user.mbti}</p></div>
            <div className="bg-[#6BCB77]/70 rounded-xl border border-black p-2"><p className="text-xs font-bold">社交能量</p><p className="font-black">{user.social_energy}</p></div>
            <div className="bg-[#4D96FF]/20 rounded-xl border border-black p-2"><p className="text-xs font-bold">信誉</p><p className="font-black">{reputation?.reputation_score ?? 100}</p></div>
          </div>
        </div>

        <div className="mine-card grid grid-cols-3 gap-2 opacity-0">
          {panels.map(([key, label, Icon]) => (
            <button key={key} onClick={() => setActivePanel(key)} className={`rounded-xl border-2 border-black px-2 py-2 text-xs font-black shadow-[2px_2px_0_#121212] transition-all active:translate-y-0.5 ${activePanel === key ? 'bg-[#FFDE4D]' : 'bg-white'}`}><Icon className="w-4 h-4 mx-auto mb-1" />{label}</button>
          ))}
        </div>

        {activePanel === 'edit' && <div className="mine-card brutal-card bg-white p-4 opacity-0 space-y-3">
          <h3 className="font-black flex items-center gap-2"><UserRound className="w-5 h-5" />个人资料编辑</h3>
          <input className="brutal-input w-full" value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} placeholder="昵称" />
          <div className="grid grid-cols-2 gap-2"><input className="brutal-input" value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} placeholder="学校" /><input className="brutal-input" value={form.major} onChange={(e) => setForm({ ...form, major: e.target.value })} placeholder="专业" /></div>
          <textarea className="brutal-input w-full min-h-[80px]" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="一句话介绍自己" />
          <div className="grid grid-cols-2 gap-2"><select className="brutal-input" value={form.mbti} onChange={(e) => setForm({ ...form, mbti: e.target.value })}>{MBTI_OPTIONS.map((m: string) => <option key={m}>{m}</option>)}</select><input type="range" min="1" max="100" value={form.social_energy} onChange={(e) => setForm({ ...form, social_energy: Number(e.target.value) })} /></div>
          <div className="flex gap-2 overflow-x-auto py-1">{AVATAR_COLORS.map((c: string) => <button key={c} onClick={() => setForm({ ...form, avatar_color: c })} style={{ backgroundColor: c }} className={`w-8 h-8 rounded-full border-2 ${form.avatar_color === c ? 'border-black scale-110' : 'border-gray-300'}`} />)}</div>
          <div className="space-y-2"><div className="flex gap-2"><input className="brutal-input flex-1" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="添加兴趣/个性标签" /><button onClick={addTag} className="brutal-button px-3"><Tag className="w-4 h-4" /></button></div><div className="flex flex-wrap gap-2">{allTags.map((t: any) => <span key={t} className="bg-[#FFDE4D] border border-black rounded-full px-2 py-1 text-xs font-black flex items-center gap-1">{t}<X onClick={() => removeTag(t)} className="w-3 h-3" /></span>)}</div></div>
          <button onClick={saveProfile} className="brutal-button w-full py-3 flex items-center justify-center gap-2"><Save className="w-4 h-4" />保存个人资料</button>
        </div>}

        {activePanel === 'mbti' && <div className="mine-card brutal-card bg-white p-4 opacity-0 space-y-3"><h3 className="font-black flex items-center gap-2"><Sparkles className="w-5 h-5" />在线 MBTI 快测</h3>{mbtiQuestions.map((q, i) => <div key={q} className="border border-black rounded-xl p-3"><p className="text-sm font-bold mb-2">{i + 1}. {q}</p><div className="grid grid-cols-2 gap-2"><button onClick={() => setTestAnswers(testAnswers.map((v, idx) => idx === i ? 1 : v))} className={`rounded-lg border border-black py-1 text-xs font-black ${testAnswers[i] > 0 ? 'bg-[#6BCB77]' : 'bg-white'}`}>同意</button><button onClick={() => setTestAnswers(testAnswers.map((v, idx) => idx === i ? -1 : v))} className={`rounded-lg border border-black py-1 text-xs font-black ${testAnswers[i] < 0 ? 'bg-[#FF5F5F]' : 'bg-white'}`}>不同意</button></div></div>)}<button onClick={submitMBTITest} className="brutal-button w-full py-3">提交测试并写入资料</button></div>}

        {activePanel === 'blacklist' && <ListPanel empty="黑名单为空，聊天中可以拉黑用户。" items={blacklist.map((b) => ({ title: b.blocked_user?.nickname, desc: b.reason || b.blocked_user?.email, action: () => unblock(b.blocked_id), actionText: '解除' }))} />}
        {activePanel === 'created' && <ListPanel empty="还没有发起过活动。" items={created.map((x) => ({ title: x.activity?.title, desc: `${x.activity?.status} · ${x.applications?.length || 0} 个报名`, action: () => setLocation(`/activities/${x.activity?.id}`), actionText: '管理' }))} />}
        {activePanel === 'applied' && <ListPanel empty="还没有报名记录。" items={applied.map((x) => ({ title: x.activity?.title, desc: `报名状态：${x.application?.status}${x.activity?.status === '已完成' ? ' · 可评价' : ''}`, action: () => setLocation(x.activity?.status === '已完成' ? `/activities/${x.activity?.id}/evaluate` : `/activities/${x.activity?.id}`), actionText: x.activity?.status === '已完成' ? '去评价' : '查看' }))} />}
        {activePanel === 'invites' && <ListPanel empty="暂无智能邀请。" items={invitations.map((x) => ({ title: x.activity?.title, desc: x.invitation?.message || x.invitation?.status, action: () => setLocation(`/activities/${x.activity?.id}`), actionText: '查看' }))} />}
      </div>
    </Layout>
  );
}

function ListPanel({ items, empty }: { items: any[]; empty: string }) {
  return <div className="mine-card brutal-card bg-white p-4 space-y-3"><h3 className="font-black flex items-center gap-2"><Shield className="w-5 h-5" />记录管理</h3>{items.length === 0 ? <p className="text-sm font-bold text-gray-500 text-center py-6">{empty}</p> : items.map((item, idx) => <div key={idx} className="border-2 border-black rounded-xl p-3 flex items-center justify-between bg-[#F9F9F7]"><div className="pr-2"><p className="font-black text-sm">{item.title || '未命名'}</p><p className="text-xs font-bold text-gray-500 line-clamp-2">{item.desc}</p></div><button onClick={item.action} className="bg-white border-2 border-black rounded-lg px-3 py-1 text-xs font-black shadow-[2px_2px_0_#121212]">{item.actionText}</button></div>)}</div>;
}
