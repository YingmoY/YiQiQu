import React, { useState, useEffect } from 'react';
import { Trophy, Award, Flame, HelpCircle, ChevronRight } from 'lucide-react';
import anime from 'animejs/lib/anime.es.js';
import api from '../lib/api';
import Layout from '../components/Layout';
import { toast } from 'sonner';

export default function Leaderboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRuleModal, setShowRuleModal] = useState(false);

  const fetchLeaderboard = async () => {
    try {
      const res: any = await api.get('/leaderboard');
      if (res.code === 200) {
        setUsers(res.data || []);
        
        // 级联入场动效
        setTimeout(() => {
          anime({
            targets: '.leaderboard-item',
            opacity: [0, 1],
            translateX: [-20, 0],
            delay: anime.stagger(50),
            duration: 450,
            easing: 'easeOutBack'
          });
        }, 50);
      }
    } catch (err: any) {
      toast.error(err.message || '获取排行榜失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return (
    <Layout title="信誉先锋榜 🏆">
      {/* 顶部荣誉勋章卡片 */}
      <div className="p-4 shrink-0">
        <div className="brutal-card p-4 bg-[#FFDE4D] flex justify-between items-center">
          <div className="space-y-1">
            <h3 className="text-base font-black text-black">校园信誉先锋 🎖️</h3>
            <p className="text-xs font-bold text-gray-700">信誉是校园社交最珍贵的通行证</p>
          </div>
          <button
            onClick={() => setShowRuleModal(true)}
            className="w-9 h-9 border-2 border-black rounded-xl bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_#121212] active:translate-y-[1px]"
          >
            <HelpCircle className="w-5 h-5 text-black" />
          </button>
        </div>
      </div>

      {/* 排行榜列表 */}
      <div className="px-4 space-y-3 pb-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[200px]">
            <div className="w-8 h-8 border-3 border-[#FFDE4D] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="brutal-card p-6 text-center bg-white">
            <p className="text-gray-500 font-bold">榜单空空如也 🍃</p>
          </div>
        ) : (
          users.map((item, index) => {
            const rank = item.rank || index + 1;
            const isTop3 = rank <= 3;
            const rankColors = ['#FFDE4D', '#FF5F5F', '#6BCB77'];

            return (
              <div
                key={index}
                className="leaderboard-item brutal-card p-3 bg-white flex items-center justify-between opacity-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{ backgroundColor: isTop3 ? rankColors[index] : '#F3F4F6' }}
                    className="w-8 h-8 border-2 border-black rounded-lg flex items-center justify-center text-sm font-black"
                  >
                    {isTop3 ? <Trophy className="w-4 h-4 text-black" /> : rank}
                  </div>

                  <div
                    style={{ backgroundColor: item.avatar_color || '#FFDE4D' }}
                    className="w-10 h-10 rounded-full border-2 border-black flex items-center justify-center text-sm font-black shrink-0"
                  >
                    {item.nickname?.charAt(0)}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-black">{item.nickname}</span>
                      <span className="bg-gray-100 border border-black text-[8px] font-black px-1 rounded">
                        {item.mbti}
                      </span>
                    </div>
                    <p className="text-[9px] font-bold text-gray-400 mt-0.5">
                      {item.major}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-[#6BCB77] block">★ {item.score}</span>
                  <span className="text-[8px] font-black text-gray-400">
                    {item.score >= 95 ? '极佳信誉' : item.score >= 80 ? '信誉良好' : '需要提升'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 信誉规则弹窗 */}
      {showRuleModal && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-6 z-20">
          <div className="brutal-card p-5 bg-white w-full space-y-4 max-h-[80%] overflow-y-auto no-scrollbar">
            <h3 className="text-base font-black text-black flex items-center gap-1.5">
              <Award className="w-5 h-5 text-[#FFDE4D]" />
              信誉积分规则攻略 🛡️
            </h3>
            
            <div className="space-y-3 text-xs font-bold text-gray-700 leading-relaxed">
              <div className="border-l-3 border-[#6BCB77] pl-2 space-y-1">
                <p className="text-black font-black">🌟 信誉初始分：100分</p>
                <p>新注册同学默认拥有 100 满分信誉。</p>
              </div>

              <div className="border-l-3 border-[#FFDE4D] pl-2 space-y-1">
                <p className="text-black font-black">📈 信誉加分项</p>
                <p>1. 每顺利成局并完成一次活动评价：+1分</p>
                <p>2. 获得队友 5 星好评：+1分（上限 120分）</p>
              </div>

              <div className="border-l-3 border-[#FF5F5F] pl-2 space-y-1">
                <p className="text-black font-black">📉 信誉扣分项</p>
                <p>1. 爽约（放鸽子）并被同局队友核实：直接 -10分</p>
                <p>2. 活动开始前 2 小时内临时取消：-3分</p>
                <p>3. 获得队友 1-2 星差评：-2分</p>
              </div>

              <div className="border-l-3 border-black pl-2 space-y-1">
                <p className="text-black font-black">🎯 门槛与限制</p>
                <p>1. 低于 80 分：限制同时发起活动数量（最多 1 个）</p>
                <p>2. 低于 60 分：禁止发起或申请加入任何活动</p>
              </div>
            </div>

            <button
              onClick={() => setShowRuleModal(false)}
              className="w-full brutal-btn-primary py-2.5 text-xs"
            >
              我知道了
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
