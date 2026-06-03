import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams } from 'wouter';
import { ChevronLeft, Send, Award, AlertCircle, MoreVertical, Flag, Ban } from 'lucide-react';
import anime from 'animejs/lib/anime.es.js';
import api from '../lib/api';
import { WS_BASE_URL } from '../config';
import Layout from '../components/Layout';
import { toast } from 'sonner';

export default function Chat() {
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [activity, setActivity] = useState<any>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<any>(null);
  const [reportReason, setReportReason] = useState('');

  const rawUser = JSON.parse(localStorage.getItem('user_info') || '{}');
  const currentUser = rawUser.user || rawUser;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initChat = async () => {
    try {
      const actRes: any = await api.get(`/activities/${id}`);
      if (actRes.code === 200) {
        const { activity: act, creator } = actRes.data;
        setActivity({ ...act, creator });
      }
      const msgRes: any = await api.get(`/activities/${id}/messages`);
      if (msgRes.code === 200) setMessages(msgRes.data || []);
    } catch (err: any) { toast.error(err.message || '初始化聊天失败'); } finally { setLoading(false); }
  };

  useEffect(() => { initChat(); }, [id]);

  useEffect(() => {
    if (loading || !id) return;
    const token = localStorage.getItem('access_token');
    const socket = new WebSocket(`${WS_BASE_URL}/activities/${id}/ws?token=${token}`);
    socket.onmessage = (event) => {
      try { setMessages((prev) => [...prev, JSON.parse(event.data)]); } catch (err) { console.error('Failed to parse WS message', err); }
    };
    socket.onerror = () => toast.error('聊天连接异常，请检查网络');
    setWs(socket);
    return () => socket.close();
  }, [id, loading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    anime({ targets: '.chat-bubble-item:last-child', scale: [0.9, 1], opacity: [0, 1], duration: 220, easing: 'easeOutBack' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ content: inputText }));
      setInputText('');
    } else toast.error('网络连接断开，请尝试刷新页面');
  };

  const handleFinishActivity = async () => {
    try {
      const res: any = await api.put(`/activities/${id}`, { status: '已完成' });
      toast.success(res.message || '邀约局已成功结局！快给小伙伴们评价吧');
      initChat();
    } catch (err: any) { toast.error(err.message); }
  };

  const reportMessage = async () => {
    if (!actionMsg?.id) { toast.error('这条实时消息尚未落库编号，请稍后刷新后再举报'); return; }
    if (!reportReason.trim()) { toast.error('请填写举报原因'); return; }
    try {
      await api.post(`/chat/messages/${actionMsg.id}/report`, { reason: reportReason });
      toast.success('举报已提交，管理员会在后台处理');
      setActionMsg(null); setReportReason('');
    } catch (err: any) { toast.error(err.message || '举报失败'); }
  };

  const blockUser = async () => {
    if (!actionMsg?.sender_id) return;
    try {
      await api.post(`/chat/users/${actionMsg.sender_id}/block`, { reason: '聊天中拉黑' });
      toast.success(`已拉黑 ${actionMsg.sender_nickname}，其消息将不再显示`);
      setMessages((prev) => prev.filter((m) => m.sender_id !== actionMsg.sender_id));
      setActionMsg(null); setReportReason('');
    } catch (err: any) { toast.error(err.message || '拉黑失败'); }
  };

  if (loading) {
    return <Layout title="行动群聊" showNav={false}><div className="flex flex-col items-center justify-center h-[400px]"><div className="w-10 h-10 border-4 border-[#FFDE4D] border-t-transparent rounded-full animate-spin"></div><span className="text-xs font-bold text-gray-500 mt-4">正在建立加密群聊连接...</span></div></Layout>;
  }

  return (
    <Layout title={activity ? `💬 ${activity.title}` : '行动群聊'} showNav={false} headerAction={<div className="flex items-center gap-2">{activity?.creator_id === currentUser.id && activity?.status === '进行中' && <button onClick={handleFinishActivity} className="bg-[#6BCB77] border-2 border-black text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow-[2px_2px_0px_0px_#121212] active:translate-y-[1px]">🏁 结局评价</button>}<button onClick={() => setLocation(`/activities/${id}`)} className="w-10 h-10 border-2 border-black rounded-xl flex items-center justify-center bg-white shadow-[2px_2px_0px_0px_#121212] active:translate-y-[1px]"><ChevronLeft className="w-6 h-6 text-black" /></button></div>}>
      <div className="bg-[#FFE8E8] border-b-3 border-black p-3 flex items-center gap-2 shrink-0"><AlertCircle className="w-5 h-5 text-[#FF5F5F] shrink-0" /><p className="text-[10px] font-bold text-gray-700 leading-tight">【行动指南】请确认集合时间：{new Date(activity?.start_time).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}，地点：{activity?.location}。聊天中可对不当消息举报或拉黑对方。</p></div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 pb-[80px] bg-[#F9F9F7]">
        {messages.map((msg, idx) => {
          const isMe = msg.sender_id === currentUser.id;
          const isSystem = msg.message_type === 'system';
          if (isSystem) return <div key={msg.id || idx} className="chat-bubble-item flex justify-center"><span className="bg-gray-200 border border-black text-[9px] font-black px-2.5 py-0.5 rounded text-gray-600 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.15)]">📢 {msg.content}</span></div>;
          return <div key={`${msg.id || 'live'}-${idx}`} className={`chat-bubble-item flex gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}><div style={{ backgroundColor: msg.sender_avatar_color || '#FFDE4D' }} className="w-9 h-9 rounded-full border-2 border-black flex items-center justify-center text-xs font-black shrink-0">{msg.sender_nickname?.charAt(0)}</div><div className={`max-w-[72%] space-y-1 ${isMe ? 'text-right' : 'text-left'}`}><div className={`flex items-center gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}><span className="text-[9px] font-black text-gray-400 block">{msg.sender_nickname}</span>{!isMe && <button onClick={() => setActionMsg(msg)} className="w-5 h-5 rounded-full border border-black bg-white flex items-center justify-center"><MoreVertical className="w-3 h-3" /></button>}</div><div className={`border-2 border-black p-3 rounded-xl text-xs font-bold shadow-[2px_2px_0px_0px_#121212] inline-block ${isMe ? 'bg-[#FFDE4D] text-black rounded-tr-none' : 'bg-white text-black rounded-tl-none'}`}>{msg.content}</div></div></div>;
        })}
        <div ref={messagesEndRef} />
      </div>

      {activity?.status === '已完成' && <div className="absolute bottom-[76px] left-4 right-4 brutal-card p-3 bg-[#EBF9EB] z-10 flex items-center justify-between"><div className="flex items-center gap-2"><Award className="w-5 h-5 text-[#6BCB77]" /><span className="text-[10px] font-black text-black">活动已圆满结局！快去给队友评价打分吧</span></div><button onClick={() => setLocation(`/activities/${id}/evaluate`)} className="bg-[#6BCB77] border border-black text-[9px] font-black px-2 py-1 rounded">去评价</button></div>}

      <form onSubmit={handleSendMessage} className="absolute bottom-0 left-0 right-0 h-[76px] bg-white border-t-3 border-black flex items-center px-4 gap-2 z-10"><input type="text" placeholder="给小伙伴发条消息吧..." value={inputText} onChange={(e) => setInputText(e.target.value)} className="flex-1 brutal-input text-xs py-2.5" /><button type="submit" className="w-10 h-10 bg-[#FFDE4D] border-2 border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_#121212] active:translate-y-[1px]"><Send className="w-5 h-5 text-black" /></button></form>

      {actionMsg && <div className="absolute inset-0 bg-black/60 z-30 flex items-end justify-center p-4"><div className="brutal-card bg-white p-4 w-full space-y-3 animate-in slide-in-from-bottom"><div className="flex items-center justify-between"><h3 className="font-black text-base">处理来自 {actionMsg.sender_nickname} 的消息</h3><button onClick={() => setActionMsg(null)} className="text-xs font-black">关闭</button></div><p className="text-xs font-bold bg-gray-50 border border-black rounded-xl p-2">{actionMsg.content}</p><textarea value={reportReason} onChange={(e) => setReportReason(e.target.value)} placeholder="如需举报，请填写原因，例如骚扰、广告、辱骂等" className="brutal-input w-full h-20 text-xs" /><div className="grid grid-cols-2 gap-2"><button onClick={reportMessage} className="border-2 border-black rounded-xl py-2 bg-[#FFDE4D] font-black shadow-[2px_2px_0_#121212] flex items-center justify-center gap-1"><Flag className="w-4 h-4" />举报</button><button onClick={blockUser} className="border-2 border-black rounded-xl py-2 bg-[#FF5F5F] text-white font-black shadow-[2px_2px_0_#121212] flex items-center justify-center gap-1"><Ban className="w-4 h-4" />拉黑</button></div></div></div>}
    </Layout>
  );
}
