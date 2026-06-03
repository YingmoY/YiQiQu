import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { Activity, AlertTriangle, BarChart3, Ban, CheckCircle2, Flag, Plus, RefreshCw, Shield, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import anime from 'animejs/lib/anime.es.js';
import api from '../lib/api';

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<any>({});
  const [users, setUsers] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [sensitiveWords, setSensitiveWords] = useState<any[]>([]);
  const [sensitiveHits, setSensitiveHits] = useState<any[]>([]);
  const [newWord, setNewWord] = useState({ word: '', category: '通用', action: 'mask' });
  const [checkText, setCheckText] = useState('');
  const [checkResult, setCheckResult] = useState<any>(null);
  const [tab, setTab] = useState<'overview' | 'reports' | 'activities' | 'users' | 'sensitive'>('overview');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [s, u, a, r, w, h]: any[] = await Promise.all([api.get('/admin/stats'), api.get('/admin/users'), api.get('/admin/activities'), api.get('/admin/reports'), api.get('/admin/sensitive-words'), api.get('/admin/sensitive-hits')]);
      setStats(s.data || {});
      setUsers(u.data || []);
      setActivities(a.data || []);
      setReports(r.data || []);
      setSensitiveWords(w.data || []);
      setSensitiveHits((h.data || []).map((row: any) => row.hit ? { ...row.hit, user: row.user } : row));
      setTimeout(() => anime({ targets: '.admin-card', opacity: [0, 1], translateY: [20, 0], delay: anime.stagger(60), duration: 520, easing: 'easeOutBack' }), 50);
    } catch (err: any) { toast.error(err.message || '请确认当前账号具有管理员权限'); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      anime({ targets: '.admin-card', opacity: [0, 1], translateY: [10, 0], delay: anime.stagger(35), duration: 360, easing: 'easeOutQuad' });
    }, 20);
    return () => window.clearTimeout(timer);
  }, [tab]);

  const reportOf = (row: any) => row.report || row;
  const activityOf = (row: any) => row.activity || row;
  const creatorOf = (row: any) => row.creator || row.activity?.creator || {};

  const resolveReport = async (id: number, action = 'resolved') => {
    try { await api.post(`/admin/reports/${id}/resolve`, { action, status: action === 'ignored' ? '已忽略' : '已处理' }); toast.success('举报已处理'); load(); } catch (err: any) { toast.error(err.message || '处理失败'); }
  };
  const banUser = async (id: number, banned: boolean) => {
    try { await api.post(`/admin/users/${id}/ban`, { banned }); toast.success(banned ? '已封禁用户' : '已解除封禁'); load(); } catch (err: any) { toast.error(err.message || '操作失败'); }
  };
  const updateActivityStatus = async (id: number, status: string) => {
    try { await api.post(`/admin/activities/${id}/status`, { status }); toast.success('活动状态已更新'); load(); } catch (err: any) { toast.error(err.message || '更新失败'); }
  };
  const addSensitiveWord = async () => {
    if (!newWord.word.trim()) return toast.error('请输入敏感词');
    try { await api.post('/admin/sensitive-words', newWord); toast.success('敏感词已新增'); setNewWord({ word: '', category: '通用', action: 'mask' }); load(); } catch (err: any) { toast.error(err.message || '新增失败'); }
  };
  const toggleSensitiveWord = async (item: any) => {
    try { await api.put(`/admin/sensitive-words/${item.id}`, { is_enabled: !item.is_enabled }); toast.success('状态已更新'); load(); } catch (err: any) { toast.error(err.message || '更新失败'); }
  };
  const deleteSensitiveWord = async (id: number) => {
    try { await api.delete(`/admin/sensitive-words/${id}`); toast.success('敏感词已删除'); load(); } catch (err: any) { toast.error(err.message || '删除失败'); }
  };
  const checkSensitiveText = async () => {
    if (!checkText.trim()) return toast.error('请输入检测内容');
    try { const res: any = await api.post('/admin/sensitive-words/check', { content: checkText }); setCheckResult(res.data); } catch (err: any) { toast.error(err.message || '检测失败'); }
  };

  const pendingReports = reports.filter((row) => ['待处理', 'pending'].includes(reportOf(row).status));
  const recentActivities = useMemo(() => activities.slice(0, 8), [activities]);

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-black">
      <header className="sticky top-0 z-20 bg-white border-b-4 border-black shadow-[0_4px_0_#121212]"><div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-11 h-11 bg-[#FFDE4D] border-3 border-black rounded-2xl flex items-center justify-center shadow-[3px_3px_0_#121212]"><Shield className="w-6 h-6" /></div><div><h1 className="text-2xl font-black">一起去 · 管理后台</h1><p className="text-xs font-bold text-gray-500">举报处理、活动治理、用户管理与统计看板</p></div></div><div className="flex gap-2"><button onClick={load} className="border-2 border-black rounded-xl px-4 py-2 bg-[#6BCB77] font-black shadow-[3px_3px_0_#121212] flex items-center gap-2"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />刷新</button><button onClick={() => setLocation('/')} className="border-2 border-black rounded-xl px-4 py-2 bg-white font-black shadow-[3px_3px_0_#121212]">返回前台</button></div></div></header>

      <main className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-[230px_1fr] gap-6">
        <aside className="space-y-3">{[['overview', '统计看板', BarChart3], ['reports', '举报处理', Flag], ['activities', '活动管理', Activity], ['users', '用户管理', Users], ['sensitive', '敏感词库', AlertTriangle]].map(([key, label, Icon]: any) => <button key={key} onClick={() => setTab(key)} className={`w-full border-3 border-black rounded-2xl px-4 py-3 font-black flex items-center gap-3 shadow-[4px_4px_0_#121212] transition-all hover:-translate-y-1 ${tab === key ? 'bg-[#FFDE4D]' : 'bg-white'}`}><Icon className="w-5 h-5" />{label}</button>)}</aside>

        <section className="space-y-6">
          {tab === 'overview' && <><div className="grid grid-cols-4 gap-4"><Stat title="总用户" value={stats.users ?? users.length} color="#FFDE4D" icon={<Users />} /><Stat title="活动数" value={stats.activities ?? activities.length} color="#6BCB77" icon={<Activity />} /><Stat title="待处理举报" value={stats.pending_reports ?? pendingReports.length} color="#FF5F5F" icon={<Flag />} /><Stat title="智能邀请" value={stats.invitations ?? '-'} color="#4D96FF" icon={<CheckCircle2 />} /></div><div className="grid grid-cols-2 gap-6"><DataCard title="最近活动" rows={recentActivities.map((row) => { const a = activityOf(row); const c = creatorOf(row); return [a.title, a.status, c.nickname || '-']; })} headers={['标题', '状态', '发起人']} /><DataCard title="待处理举报" rows={pendingReports.slice(0, 8).map((row) => { const r = reportOf(row); return [r.reason, r.target_type, row.reporter?.nickname || r.reporter_id]; })} headers={['原因', '对象', '举报人']} /></div></>}

          {tab === 'reports' && <div className="admin-card opacity-0 brutal-card bg-white p-5"><h2 className="text-xl font-black mb-4">举报处理</h2><div className="space-y-3">{reports.length === 0 ? <p className="py-8 text-center font-bold text-gray-400">暂无举报</p> : reports.map((row) => { const r = reportOf(row); return <div key={r.id} className="border-2 border-black rounded-2xl p-4 bg-[#F9F9F7] flex justify-between gap-4"><div><div className="flex items-center gap-2"><span className="bg-[#FFDE4D] border border-black rounded px-2 py-0.5 text-xs font-black">{r.target_type} #{r.target_id}</span><span className="text-xs font-bold text-gray-500">{r.status}</span></div><p className="font-black mt-2">{r.reason}</p><p className="text-xs font-bold text-gray-500 mt-1">举报人：{row.reporter?.nickname || r.reporter_id}</p></div><div className="flex gap-2 items-center"><button onClick={() => resolveReport(r.id, 'ban_user')} className="border-2 border-black rounded-xl px-4 py-2 bg-[#FF5F5F] text-white font-black shadow-[2px_2px_0_#121212]">封禁相关用户</button><button onClick={() => resolveReport(r.id, 'resolved')} className="border-2 border-black rounded-xl px-4 py-2 bg-[#6BCB77] font-black shadow-[2px_2px_0_#121212]">通过</button><button onClick={() => resolveReport(r.id, 'ignored')} className="border-2 border-black rounded-xl px-4 py-2 bg-white font-black shadow-[2px_2px_0_#121212]">忽略</button></div></div>; })}</div></div>}

          {tab === 'activities' && <div className="admin-card opacity-0 brutal-card bg-white p-5"><h2 className="text-xl font-black mb-4">活动管理</h2><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b-2 border-black text-left"><th className="p-2">标题</th><th>分类</th><th>状态</th><th>发起人</th><th>报名</th><th>操作</th></tr></thead><tbody>{activities.map((row) => { const a = activityOf(row); const c = creatorOf(row); return <tr key={a.id} className="border-b border-gray-200 font-bold"><td className="p-2 max-w-[260px] truncate">{a.title}</td><td>{a.category}</td><td>{a.status}</td><td>{c.nickname || '-'}</td><td>{row.applications ?? '-'}</td><td className="space-x-2"><button onClick={() => updateActivityStatus(a.id, '已结束')} className="border border-black rounded px-2 py-1 bg-[#FFDE4D] font-black">结束</button><button onClick={() => updateActivityStatus(a.id, '已取消')} className="border border-black rounded px-2 py-1 bg-[#FF5F5F] text-white font-black">下架</button></td></tr>; })}</tbody></table></div></div>}

          {tab === 'users' && <div className="admin-card opacity-0 brutal-card bg-white p-5"><h2 className="text-xl font-black mb-4">用户管理</h2><div className="grid grid-cols-2 gap-3">{users.map((row) => { const u = row.user || row; return <div key={u.id} className="border-2 border-black rounded-2xl p-4 bg-[#F9F9F7] flex items-center justify-between"><div className="flex items-center gap-3"><div style={{ backgroundColor: u.avatar_color || '#FFDE4D' }} className="w-12 h-12 rounded-xl border-2 border-black flex items-center justify-center font-black">{u.nickname?.[0]}</div><div><p className="font-black">{u.nickname} <span className="text-xs bg-white border border-black px-1 rounded">{u.role}</span></p><p className="text-xs font-bold text-gray-500">{u.email}</p><p className="text-xs font-bold">信誉：{row.reputation?.reputation_score ?? 100} · {u.is_banned || u.banned ? '已封禁' : '正常'}</p></div></div><button onClick={() => banUser(u.id, !(u.is_banned || u.banned))} className={`border-2 border-black rounded-xl px-3 py-2 font-black shadow-[2px_2px_0_#121212] ${u.is_banned || u.banned ? 'bg-[#6BCB77]' : 'bg-[#FF5F5F] text-white'}`}><Ban className="w-4 h-4" /></button></div>; })}</div></div>}

          {tab === 'sensitive' && <div className="grid grid-cols-[1.1fr_0.9fr] gap-6">
            <div className="admin-card opacity-0 brutal-card bg-white p-5 space-y-4"><h2 className="text-xl font-black flex items-center gap-2"><AlertTriangle className="w-5 h-5" />敏感词词库</h2><div className="grid grid-cols-[1fr_120px_120px_90px] gap-2"><input className="brutal-input" value={newWord.word} onChange={(e) => setNewWord({ ...newWord, word: e.target.value })} placeholder="输入敏感词" /><input className="brutal-input" value={newWord.category} onChange={(e) => setNewWord({ ...newWord, category: e.target.value })} placeholder="分类" /><select className="brutal-input" value={newWord.action} onChange={(e) => setNewWord({ ...newWord, action: e.target.value })}><option value="mask">替换</option><option value="reject">拒绝</option></select><button onClick={addSensitiveWord} className="border-2 border-black rounded-xl bg-[#FFDE4D] font-black shadow-[2px_2px_0_#121212] flex items-center justify-center gap-1"><Plus className="w-4 h-4" />新增</button></div><div className="space-y-2 max-h-[520px] overflow-y-auto pr-2">{sensitiveWords.length === 0 ? <p className="py-8 text-center font-bold text-gray-400">暂无敏感词</p> : sensitiveWords.map((item) => <div key={item.id} className="border-2 border-black rounded-2xl p-3 bg-[#F9F9F7] flex items-center justify-between"><div><p className="font-black">{item.word} <span className="text-xs border border-black rounded px-1 bg-white">{item.category}</span></p><p className="text-xs font-bold text-gray-500">动作：{item.action === 'reject' ? '拒绝提交' : '星号替换'} · 命中：{item.hit_count || 0} · {item.is_enabled ? '启用' : '停用'}</p></div><div className="flex gap-2"><button onClick={() => toggleSensitiveWord(item)} className={`border-2 border-black rounded-xl px-3 py-1 text-xs font-black shadow-[2px_2px_0_#121212] ${item.is_enabled ? 'bg-[#FFDE4D]' : 'bg-[#6BCB77]'}`}>{item.is_enabled ? '停用' : '启用'}</button><button onClick={() => deleteSensitiveWord(item.id)} className="border-2 border-black rounded-xl px-2 py-1 bg-[#FF5F5F] text-white shadow-[2px_2px_0_#121212]"><Trash2 className="w-4 h-4" /></button></div></div>)}</div></div>
            <div className="space-y-6"><div className="admin-card opacity-0 brutal-card bg-white p-5 space-y-3"><h2 className="text-xl font-black">文本检测</h2><textarea className="brutal-input w-full min-h-[120px]" value={checkText} onChange={(e) => setCheckText(e.target.value)} placeholder="输入一段内容，检测命中和过滤结果" /><button onClick={checkSensitiveText} className="border-2 border-black rounded-xl px-4 py-2 bg-[#4D96FF] text-white font-black shadow-[3px_3px_0_#121212]">开始检测</button>{checkResult && <div className="border-2 border-black rounded-2xl p-3 bg-[#F9F9F7]"><p className="text-sm font-black">命中：{(checkResult.matched_words || []).join('、') || '无'}</p><p className="text-xs font-bold text-gray-500 mt-1">处理方式：{checkResult.rejected ? '拒绝提交' : '允许提交/替换'}</p><p className="mt-2 text-sm font-bold break-all">{checkResult.clean_text}</p></div>}</div><div className="admin-card opacity-0 brutal-card bg-white p-5"><h2 className="text-xl font-black mb-4">最近命中日志</h2><div className="space-y-2 max-h-[320px] overflow-y-auto">{sensitiveHits.length === 0 ? <p className="py-8 text-center font-bold text-gray-400">暂无命中记录</p> : sensitiveHits.slice(0, 20).map((hit) => <div key={hit.id} className="border border-black rounded-xl p-3 bg-[#F9F9F7]"><div className="flex items-center justify-between"><p className="font-black text-sm">{hit.scene} · 用户 #{hit.user_id || '-'}</p><span className="text-xs font-bold">{hit.action}</span></div><p className="text-xs font-bold text-gray-500 mt-1">命中：{(hit.matched_words || []).join('、')}</p><p className="text-xs mt-1 line-clamp-2">{hit.filtered_content}</p></div>)}</div></div></div>
          </div>}
        </section>
      </main>
    </div>
  );
}

function Stat({ title, value, color, icon }: any) { return <div className="admin-card opacity-0 border-3 border-black rounded-3xl p-5 shadow-[5px_5px_0_#121212]" style={{ backgroundColor: color }}><div className="flex justify-between items-start"><p className="font-black text-sm">{title}</p><div className="w-8 h-8">{icon}</div></div><p className="text-4xl font-black mt-4">{value}</p></div>; }
function DataCard({ title, headers, rows }: any) { return <div className="admin-card opacity-0 brutal-card bg-white p-5"><h2 className="text-xl font-black mb-4">{title}</h2><table className="w-full text-sm"><thead><tr className="border-b-2 border-black text-left">{headers.map((h: string) => <th key={h} className="py-2">{h}</th>)}</tr></thead><tbody>{rows.length === 0 ? <tr><td className="py-6 text-gray-400 font-bold" colSpan={headers.length}>暂无数据</td></tr> : rows.map((row: any[], i: number) => <tr key={i} className="border-b border-gray-200 font-bold">{row.map((c, idx) => <td key={idx} className="py-2 pr-2 max-w-[220px] truncate">{c}</td>)}</tr>)}</tbody></table></div>; }
