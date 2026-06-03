import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { MessageSquare, Calendar, MapPin } from 'lucide-react';
import anime from 'animejs/lib/anime.es.js';
import api from '../lib/api';
import Layout from '../components/Layout';
import { toast } from 'sonner';

export default function Messages() {
  const [, setLocation] = useLocation();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const currentUser = JSON.parse(localStorage.getItem('user_info') || '{}');

  useEffect(() => {
    const fetchMyActivities = async () => {
      try {
        const res: any = await api.get('/activities');
        if (res.code === 200) {
          setActivities(res.data || []);
          setTimeout(() => {
            anime({
              targets: '.msg-fade-in',
              opacity: [0, 1],
              translateY: [10, 0],
              delay: anime.stagger(50),
              duration: 400,
              easing: 'easeOutQuad'
            });
          }, 50);
        }
      } catch (err: any) {
        toast.error(err.message || '获取活动列表失败');
      } finally {
        setLoading(false);
      }
    };
    fetchMyActivities();
  }, []);

  const myActivities = activities.filter(
    (act) => act.creator_id === currentUser.id
  );

  return (
    <Layout title="我的行动群聊 💬">
      <div className="p-4 space-y-3 pb-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[300px]">
            <div className="w-8 h-8 border-3 border-[#FFDE4D] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : myActivities.length === 0 ? (
          <div className="brutal-card p-8 text-center bg-white mt-4">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-bold mb-1">暂无行动群聊 🍃</p>
            <p className="text-xs text-gray-400">发起或加入邀约，即可进入专属群聊</p>
          </div>
        ) : (
          myActivities.map((act) => (
            <div
              key={act.id}
              onClick={() => setLocation(`/chat/${act.id}`)}
              className="msg-fade-in brutal-card p-4 bg-white cursor-pointer opacity-0"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-[#FFDE4D] border-2 border-black rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <span className="text-sm font-black text-black line-clamp-1">{act.title}</span>
                    <p className="text-[10px] text-gray-400 font-bold">{act.category} · {act.status}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded border border-black ${
                    act.status === '招募中' ? 'bg-[#6BCB77] text-black' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {act.status}
                  </span>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-3 text-[10px] text-gray-500 font-bold">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(act.start_time).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {act.location}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}
