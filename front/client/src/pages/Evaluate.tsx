import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { ChevronLeft, Star, Heart, Award, ShieldAlert } from 'lucide-react';
import anime from 'animejs/lib/anime.es.js';
import api from '../lib/api';
import Layout from '../components/Layout';
import { toast } from 'sonner';

export default function Evaluate() {
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const [activity, setActivity] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 评价表单状态
  const [targetUserId, setTargetUserId] = useState<number | null>(null);
  const [score, setScore] = useState(5);
  const [comment, setThemeComment] = useState('');
  const [isAbsent, setIsAbsent] = useState(false); // 鸽子判定
  const [isLate, setIsLate] = useState(false); // 迟到判定
  const [evaluatedIds, setEvaluatedIds] = useState<number[]>([]);

  const currentUser = JSON.parse(localStorage.getItem('user_info') || '{}');

  const initEvaluate = async () => {
    try {
      const [res, reviewRes]: any[] = await Promise.all([
        api.get(`/activities/${id}`),
        api.get(`/activities/${id}/reviews/me`).catch(() => ({ data: [] })),
      ]);
      if (res.code === 200) {
        const { activity: act, creator, participants } = res.data;
        setActivity(act);

        const list: any[] = [];
        if (act.creator_id !== currentUser.id) {
          list.push(creator);
        }
        (participants || [])
          .filter((u: any) => u.id !== currentUser.id)
          .forEach((u: any) => list.push(u));

        const reviewed = (reviewRes.data || []).map((row: any) => row.review?.reviewee_id || row.reviewee_id).filter(Boolean);
        setEvaluatedIds(reviewed);
        setMembers(list);
        const firstPending = list.find((m) => !reviewed.includes(m.id));
        setTargetUserId(firstPending?.id || null);

        setTimeout(() => {
          anime({
            targets: '.eval-fade-in',
            opacity: [0, 1],
            translateY: [15, 0],
            delay: anime.stagger(50),
            duration: 400,
            easing: 'easeOutQuad'
          });
        }, 50);
      }
    } catch (err: any) {
      toast.error(err.message || '初始化评价页面失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initEvaluate();
  }, [id]);

  const handleSubmitEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId) return;

    try {
      const res: any = await api.post(`/activities/${id}/reviews`, {
        reviewee_id: targetUserId,
        score: isAbsent ? 1 : Number(score),
        comment: isAbsent ? '该同学爽约（放鸽子），未参加本次邀约活动。' : comment,
        is_attended: !isAbsent,
        is_punctual: !isLate,
      });

      toast.success(res.message || '评价提交成功！信誉分已同步结算');
      const nextEvaluatedIds = Array.from(new Set([...evaluatedIds, targetUserId]));
      setEvaluatedIds(nextEvaluatedIds);
      setThemeComment('');
      setIsAbsent(false);
      setIsLate(false);
      setScore(5);

      const nextMember = members.find(m => m.id !== targetUserId && !nextEvaluatedIds.includes(m.id));
      if (nextMember) {
        setTargetUserId(nextMember.id);
      } else {
        toast.success('🎉 恭喜！你已完成本局所有伙伴的信誉互评');
        setLocation(`/activities/${id}`);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <Layout title="信誉互评" showNav={false}>
        <div className="flex flex-col items-center justify-center h-[400px]">
          <div className="w-10 h-10 border-4 border-[#FFDE4D] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-gray-500 mt-4">加载伙伴名单中...</span>
        </div>
      </Layout>
    );
  }

  const currentTargetUser = members.find(m => m.id === targetUserId);

  return (
    <Layout
      title="同局伙伴信誉互评 🛡️"
      showNav={false}
      headerAction={
        <button 
          onClick={() => setLocation(`/activities/${id}`)} 
          className="w-10 h-10 border-2 border-black rounded-xl flex items-center justify-center bg-white shadow-[2px_2px_0px_0px_#121212] active:translate-y-[1px]"
        >
          <ChevronLeft className="w-6 h-6 text-black" />
        </button>
      }
    >
      <div className="p-4 space-y-4 pb-24">
        {/* 1. 伙伴选择器 */}
        <div className="eval-fade-in brutal-card p-4 bg-white opacity-0 space-y-3">
          <label className="text-xs font-black text-black">选择互评伙伴</label>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {members.map((m) => {
              const isEvaluated = evaluatedIds.includes(m.id);
              const isSelected = m.id === targetUserId;
              return (
                <button
                  key={m.id}
                  onClick={() => !isEvaluated && setTargetUserId(m.id)}
                  style={{
                    backgroundColor: isSelected ? '#FFDE4D' : isEvaluated ? '#EBF9EB' : '#FFFFFF',
                    opacity: isEvaluated ? 0.6 : 1
                  }}
                  className={`px-3 py-2 border-2 border-black rounded-xl shrink-0 flex items-center gap-1.5 font-bold text-xs shadow-[2px_2px_0px_0px_#121212] active:translate-y-[1px]`}
                >
                  <div
                    style={{ backgroundColor: m.avatar_color || '#FFDE4D' }}
                    className="w-5 h-5 rounded-full border border-black flex items-center justify-center text-[10px] font-black"
                  >
                    {m.nickname?.charAt(0)}
                  </div>
                  <span>{m.nickname}</span>
                  {isEvaluated && <span className="text-[#6BCB77]">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. 评价主表单 */}
        {currentTargetUser ? (
          <form onSubmit={handleSubmitEvaluate} className="eval-fade-in brutal-card p-5 bg-white opacity-0 space-y-4">
            <div className="flex items-center gap-3 bg-gray-50 p-3 border-2 border-dashed border-gray-200 rounded-xl">
              <div
                style={{ backgroundColor: currentTargetUser.avatar_color || '#FFDE4D' }}
                className="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center text-lg font-black"
              >
                {currentTargetUser.nickname?.charAt(0)}
              </div>
              <div>
                <span className="text-sm font-black text-black">{currentTargetUser.nickname}</span>
                <p className="text-[10px] font-bold text-gray-400 mt-0.5">
                  所在专业: {currentTargetUser.major} · MBTI: {currentTargetUser.mbti}
                </p>
              </div>
            </div>

            {/* 鸽子判定开关 */}
            <div className="flex justify-between items-center p-3 border-2 border-black rounded-xl bg-[#FFE8E8]">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#FF5F5F]" />
                <div>
                  <span className="text-xs font-black text-black">该同学爽约（放鸽子）了</span>
                  <p className="text-[9px] text-gray-500 font-bold">爽约将扣除 10 分信誉分，且无法进行其他评分</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isAbsent}
                onChange={(e) => setIsAbsent(e.target.checked)}
                className="w-5 h-5 accent-[#FF5F5F] border-2 border-black rounded"
              />
            </div>

            {!isAbsent && (
              <>
                {/* 星级评分 */}
                <div className="space-y-1">
                  <label className="text-xs font-black text-black block">信誉行为评级</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setScore(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-8 h-8 stroke-2 ${
                            star <= score ? 'fill-[#FFDE4D] text-black' : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold">
                    {score === 5 ? '💯 守时守信，交流愉快，极其推荐' : score >= 4 ? '✨ 表现良好，顺利完成邀约' : '🍃 体验一般，有待提升'}
                  </p>
                </div>

                {/* 迟到判定 */}
                <div className="flex justify-between items-center p-3 border-2 border-black rounded-xl bg-gray-50">
                  <div>
                    <span className="text-xs font-black text-black">该同学有迟到行为</span>
                    <p className="text-[9px] text-gray-500 font-bold">小迟到，但最终顺利参加了活动</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isLate}
                    onChange={(e) => setIsLate(e.target.checked)}
                    className="w-5 h-5 accent-[#FFDE4D] border-2 border-black rounded"
                  />
                </div>

                {/* 评价留言 */}
                <div className="space-y-1">
                  <label className="text-xs font-black text-black block">印象评价 (匿名)</label>
                  <textarea
                    placeholder="夸一夸队友，或者写下你的行动感受..."
                    value={comment}
                    onChange={(e) => setThemeComment(e.target.value)}
                    className="w-full brutal-input h-[80px] resize-none text-xs"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full brutal-btn-primary py-3 text-sm mt-2"
            >
              {isAbsent ? '📢 提交爽约举报' : '✓ 提交伙伴评价'}
            </button>
          </form>
        ) : (
          <div className="brutal-card p-8 text-center bg-white">
            <p className="text-gray-500 font-bold">本局没有其他伙伴需要评价 🍃</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
