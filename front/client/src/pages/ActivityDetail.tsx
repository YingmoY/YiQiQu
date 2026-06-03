import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { Calendar, MapPin, Users, ChevronLeft, Check, Sparkles, Send, X } from 'lucide-react';
import anime from 'animejs/lib/anime.es.js';
import api from '../lib/api';
import { CATEGORY_THEMES } from '../config';
import Layout from '../components/Layout';
import { toast } from 'sonner';

export default function ActivityDetail() {
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applyReason, setApplyReason] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [myApplicationStatus, setMyApplicationStatus] = useState<string>('未申请');
  const [applications, setApplications] = useState<any[]>([]);
  const [recommendedUsers, setRecommendedUsers] = useState<any[]>([]);
  const [selectedInvitees, setSelectedInvitees] = useState<number[]>([]);

  const rawUser = JSON.parse(localStorage.getItem('user_info') || '{}');
  const currentUser = rawUser.user || rawUser;

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res: any = await api.get(`/activities/${id}`);
      if (res.code === 200) {
        const { activity: act, creator, reputation, participants, application_status } = res.data;
        const enriched = {
          ...act,
          location: act.location,
          max_participants: act.max_participants,
          current_members: (participants?.length || 0) + 1,
          creator: { ...creator, reputation: { score: reputation?.reputation_score || 100 } },
          participants: participants || [],
        };
        setActivity(enriched);
        setIsCreator(act.creator_id === currentUser.id);
        setMyApplicationStatus(application_status || '未申请');

        if (act.creator_id === currentUser.id) {
          const [appRes, recRes]: any[] = await Promise.all([
            api.get(`/activities/${id}/applications`),
            api.get(`/activities/${id}/recommended-users`, { params: { limit: 8 } }),
          ]);
          if (appRes.code === 200) setApplications(appRes.data || []);
          if (recRes.code === 200) setRecommendedUsers(recRes.data || []);
        }

        setTimeout(() => {
          anime({ targets: '.detail-fade-in', opacity: [0, 1], translateY: [15, 0], delay: anime.stagger(50), duration: 400, easing: 'easeOutQuad' });
          anime({ targets: '.invite-glow', scale: [0.98, 1], duration: 900, direction: 'alternate', loop: true, easing: 'easeInOutSine' });
        }, 50);
      }
    } catch (err: any) {
      toast.error(err.message || '获取活动详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDetail(); }, [id]);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyReason.trim()) {
      toast.error('请输入申请留言，方便发起人审核哦');
      return;
    }
    try {
      const res: any = await api.post(`/activities/${id}/apply`, { message: applyReason });
      toast.success(res.message || '申请提交成功，请耐心等待发起人审核！');
      setShowApplyModal(false);
      setApplyReason('');
      fetchDetail();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleReviewApplication = async (appId: number, action: '通过' | '拒绝') => {
    try {
      const endpoint = action === '通过' ? `/applications/${appId}/approve` : `/applications/${appId}/reject`;
      const res: any = await api.post(endpoint);
      toast.success(res.message || '操作成功');
      fetchDetail();
    } catch (err: any) { toast.error(err.message); }
  };

  const toggleInvitee = (uid: number) => {
    setSelectedInvitees((prev) => prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]);
  };

  const generateInvitations = async () => {
    try {
      const res: any = await api.post(`/activities/${id}/invitations/generate`, { invitee_ids: selectedInvitees, limit: selectedInvitees.length || 5 });
      toast.success(res.message || `已生成 ${res.data?.length || 0} 条智能邀请`);
      setSelectedInvitees([]);
      fetchDetail();
    } catch (err: any) { toast.error(err.message || '生成邀请失败'); }
  };

  if (loading) {
    return <Layout title="邀约详情" showNav={false}><div className="flex flex-col items-center justify-center h-[400px]"><div className="w-10 h-10 border-4 border-[#FFDE4D] border-t-transparent rounded-full animate-spin"></div><span className="text-xs font-bold text-gray-500 mt-4">努力加载中...</span></div></Layout>;
  }

  if (!activity) {
    return <Layout title="活动不存在" showNav={false}><div className="p-8 text-center"><p className="text-gray-500 font-bold mb-4">该活动不存在或已被取消 🍃</p><button onClick={() => setLocation('/')} className="brutal-btn-primary text-sm">返回广场</button></div></Layout>;
  }

  const theme = CATEGORY_THEMES[activity.category] || { bg: '#FFFFFF', text: '#121212', border: '#121212', label: '' };
  const pendingApps = applications.filter((a: any) => a.status === '待审批');

  return (
    <Layout title="邀约局详情 🎯" showNav={false} headerAction={<button onClick={() => setLocation('/')} className="w-10 h-10 border-2 border-black rounded-xl flex items-center justify-center bg-white shadow-[2px_2px_0px_0px_#121212] active:translate-y-[1px]"><ChevronLeft className="w-6 h-6 text-black" /></button>}>
      <div className="p-4 space-y-4 pb-24">
        <div className="detail-fade-in brutal-card p-4 bg-white flex items-center justify-between opacity-0">
          <div className="flex items-center gap-3"><div style={{ backgroundColor: activity.creator?.avatar_color || '#FFDE4D' }} className="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center text-lg font-black">{activity.creator?.nickname?.charAt(0)}</div><div><div className="flex items-center gap-1.5"><span className="text-sm font-black text-black">{activity.creator?.nickname}</span><span className="bg-[#FFDE4D] text-[9px] font-black border border-black px-1 rounded">{activity.creator?.mbti}</span></div><p className="text-[10px] font-bold text-gray-400 mt-0.5">{activity.creator?.school} · {activity.creator?.major}</p></div></div>
          <div className="text-right"><span className="text-[10px] font-black text-gray-400 block">信誉等级</span><span className="text-sm font-black text-[#6BCB77]">★ {activity.creator?.reputation?.score}</span></div>
        </div>

        <div className="detail-fade-in brutal-card p-5 bg-white opacity-0 space-y-4">
          <div className="flex justify-between items-center"><span style={{ backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }} className="border text-xs font-black px-3 py-1 rounded-full">{activity.category} · {theme.label}</span><span className="text-xs font-black text-gray-500">状态：{activity.status}</span></div>
          <h2 className="text-xl font-black text-black leading-snug">{activity.title}</h2>
          <p className="text-sm font-bold text-gray-600 bg-gray-50 p-3 border-2 border-dashed border-gray-200 rounded-xl leading-relaxed">{activity.description}</p>
          <div className="grid grid-cols-2 gap-3 pt-2"><div className="border-2 border-black rounded-xl p-2.5 bg-gray-50"><span className="text-[10px] font-black text-gray-400 block">时间</span><span className="text-xs font-black text-black">{new Date(activity.start_time).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div><div className="border-2 border-black rounded-xl p-2.5 bg-gray-50"><span className="text-[10px] font-black text-gray-400 block">目的地</span><span className="text-xs font-black text-black truncate block">{activity.location}</span></div></div>
        </div>

        <div className="detail-fade-in brutal-card p-4 bg-white opacity-0">
          <h3 className="text-sm font-black text-black mb-3 flex items-center gap-1.5"><Users className="w-4 h-4" />成局伙伴 ({activity.current_members} / {activity.max_participants})</h3>
          <div className="flex flex-wrap gap-3"><div className="flex flex-col items-center gap-1"><div style={{ backgroundColor: activity.creator?.avatar_color || '#FFDE4D' }} className="w-10 h-10 rounded-full border-2 border-black flex items-center justify-center text-sm font-black relative">{activity.creator?.nickname?.charAt(0)}<span className="absolute -bottom-1 -right-1 bg-black text-white text-[8px] font-black px-1 rounded-full border border-white">主</span></div><span className="text-[10px] font-bold text-gray-600 max-w-[50px] truncate">{activity.creator?.nickname}</span></div>{activity.participants?.map((member: any) => <div key={member.id} className="flex flex-col items-center gap-1"><div style={{ backgroundColor: member.avatar_color || '#6BCB77' }} className="w-10 h-10 rounded-full border-2 border-black flex items-center justify-center text-sm font-black">{member.nickname?.charAt(0)}</div><span className="text-[10px] font-bold text-gray-600 max-w-[50px] truncate">{member.nickname}</span></div>)}</div>
        </div>

        {isCreator && <div className="detail-fade-in brutal-card p-4 bg-[#FFF6C7] opacity-0 space-y-3 invite-glow">
          <div className="flex items-center justify-between"><h3 className="text-sm font-black text-black flex items-center gap-1.5"><Sparkles className="w-4 h-4" />智能推荐邀请对象</h3><button onClick={generateInvitations} className="bg-[#6BCB77] border-2 border-black rounded-xl px-3 py-1.5 text-xs font-black shadow-[2px_2px_0_#121212] flex items-center gap-1"><Send className="w-3.5 h-3.5" />生成邀请</button></div>
          <p className="text-[11px] font-bold text-gray-600">系统根据兴趣标签、MBTI、社交能量、信誉与活动类型综合排序，可选择对象后批量生成邀请。</p>
          {recommendedUsers.length === 0 ? <p className="text-xs font-bold text-gray-500 text-center py-4">暂无可推荐对象，可能都已报名或存在黑名单关系。</p> : <div className="space-y-2">{recommendedUsers.map((rec: any) => { const u = rec.user; const selected = selectedInvitees.includes(u.id); return <div key={u.id} onClick={() => toggleInvitee(u.id)} className={`border-2 border-black rounded-xl p-3 bg-white cursor-pointer transition-all ${selected ? 'translate-x-1 shadow-[4px_4px_0_#121212]' : 'shadow-[2px_2px_0_#121212]'}`}><div className="flex justify-between items-start gap-2"><div className="flex items-center gap-2"><div style={{ backgroundColor: u.avatar_color || '#FFDE4D' }} className="w-10 h-10 rounded-full border-2 border-black flex items-center justify-center font-black">{u.nickname?.[0]}</div><div><p className="text-sm font-black">{u.nickname} <span className="text-[9px] bg-[#FFDE4D] border border-black px-1 rounded">{u.mbti}</span></p><p className="text-[10px] font-bold text-gray-500">匹配分 {Math.round(rec.score)} · {u.school} {u.major}</p></div></div>{selected ? <Check className="w-5 h-5 text-[#6BCB77]" /> : <X className="w-5 h-5 text-gray-300" />}</div><div className="flex flex-wrap gap-1 mt-2">{(rec.reasons || []).slice(0, 3).map((r: string) => <span key={r} className="text-[9px] font-bold bg-gray-100 border border-gray-300 rounded px-1.5 py-0.5">{r}</span>)}</div><p className="text-[10px] font-bold text-gray-600 mt-2 line-clamp-2">{rec.message}</p></div>; })}</div>}
        </div>}

        {isCreator && pendingApps.length > 0 && <div className="detail-fade-in brutal-card p-4 bg-white opacity-0 space-y-3"><h3 className="text-sm font-black text-black mb-1">待审批申请 🛡️</h3><div className="space-y-3">{pendingApps.map((app: any) => <div key={app.id} className="border-2 border-black rounded-xl p-3 bg-[#FFE8E8]"><div className="flex justify-between items-start"><div><div className="flex items-center gap-1.5"><span className="text-xs font-black">{app.applicant?.nickname}</span><span className="bg-white border border-black text-[8px] font-black px-1 rounded">{app.applicant?.mbti}</span></div><p className="text-[9px] font-bold text-gray-500">信誉分: {app.reputation?.reputation_score}</p></div><div className="flex gap-1.5"><button onClick={() => handleReviewApplication(app.id, '通过')} className="w-7 h-7 bg-[#6BCB77] border-2 border-black rounded-lg flex items-center justify-center active:translate-y-[1px]"><Check className="w-4 h-4 text-black" /></button><button onClick={() => handleReviewApplication(app.id, '拒绝')} className="w-7 h-7 bg-[#FF5F5F] border-2 border-black rounded-lg flex items-center justify-center text-white active:translate-y-[1px]"><span className="font-black text-xs">X</span></button></div></div><p className="text-xs font-bold text-gray-700 mt-2 bg-white p-2 border border-black rounded-lg">💬 {app.message}</p></div>)}</div></div>}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[80px] bg-white border-t-3 border-black flex items-center justify-between px-5 z-10">
        {isCreator ? <button onClick={() => setLocation(`/chat/${activity.id}`)} className="w-full brutal-btn-primary py-3.5 text-sm">💬 进入专属行动群聊 ({activity.current_members}人已在)</button> : myApplicationStatus === '已通过' ? <button onClick={() => setLocation(`/chat/${activity.id}`)} className="w-full brutal-btn-accent py-3.5 text-sm">🎉 申请已通过！进入行动群聊</button> : myApplicationStatus === '待审批' ? <button disabled className="w-full brutal-btn bg-gray-200 text-gray-500 cursor-not-allowed py-3.5 text-sm shadow-none">⏳ 申请已提交，等待主理人审核中</button> : myApplicationStatus === '已拒绝' ? <button disabled className="w-full brutal-btn bg-red-100 text-red-500 cursor-not-allowed py-3.5 text-sm shadow-none">❌ 抱歉，申请已被拒绝</button> : <button onClick={() => setShowApplyModal(true)} disabled={activity.current_members >= activity.max_participants} className="w-full brutal-btn-primary py-3.5 text-sm">{activity.current_members >= activity.max_participants ? '🍃 队伍已满员' : '🤝 申请加入邀约'}</button>}
      </div>

      {showApplyModal && <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-6 z-20"><div className="brutal-card p-5 bg-white w-full space-y-4"><h3 className="text-base font-black text-black">发送申请留言 💬</h3><p className="text-xs font-bold text-gray-500">告诉主理人你想一起去的理由，通过率翻倍哦！</p><form onSubmit={handleApplySubmit} className="space-y-4"><textarea placeholder="例如：师兄好！我正好也想去，希望能带我一个~" value={applyReason} onChange={(e) => setApplyReason(e.target.value)} className="w-full brutal-input h-[100px] resize-none text-sm" /><div className="flex gap-2"><button type="button" onClick={() => setShowApplyModal(false)} className="flex-1 brutal-btn bg-white text-sm">取消</button><button type="submit" className="flex-1 brutal-btn-primary text-sm">确认发送</button></div></form></div></div>}
    </Layout>
  );
}
