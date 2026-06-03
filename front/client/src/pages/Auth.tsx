import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Mail, Lock, User as UserIcon, GraduationCap, CheckCircle2, ArrowRight } from 'lucide-react';
import anime from 'animejs/lib/anime.es.js';
import api, { setTokens } from '../lib/api';
import { MBTI_OPTIONS, ALLOWED_EMAIL_SUFFIX } from '../config';
import { toast } from 'sonner';

export default function Auth() {
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1); // 注册分步：1-基本账号, 2-校园认证, 3-个性标签

  // 表单数据
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [school, setSchool] = useState('复旦大学');
  const [major, setMajor] = useState('');
  const [mbti, setMbti] = useState('INFP');
  const [socialEnergy, setSocialEnergy] = useState(50);
  const [interestInput, setInterestInput] = useState('');
  const [interests, setInterests] = useState<string[]>([]);

  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // 步骤切换动画
  useEffect(() => {
    anime({
      targets: '.step-container',
      translateX: [50, 0],
      opacity: [0, 1],
      duration: 350,
      easing: 'easeOutQuad',
    });
  }, [step, isLogin]);

  // 验证码倒计时
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 发送验证码
  const handleSendCode = async () => {
    if (!email) {
      toast.error('请输入邮箱地址');
      return;
    }
    if (!email.endsWith(ALLOWED_EMAIL_SUFFIX)) {
      toast.error(`演示版仅允许使用后缀为 ${ALLOWED_EMAIL_SUFFIX} 的邮箱`);
      return;
    }

    setLoading(true);
    try {
      const res: any = await api.post('/auth/send-code', { email });
      toast.success(res.message || '验证码发送成功');
      setCodeSent(true);
      setCountdown(60);
      // 演示环境自动填充验证码，提升操作便利性
      if (res.data?.demo_code) {
        setCode(res.data.demo_code);
        toast.info(`[演示提示] 验证码已自动填充: ${res.data.demo_code}`);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 提交登录
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('请输入邮箱和密码');
      return;
    }

    setLoading(true);
    try {
      const res: any = await api.post('/auth/login', { email, password });
      setTokens(res.data.access_token, res.data.refresh_token);
      localStorage.setItem('user_info', JSON.stringify(res.data.user));
      toast.success('欢迎回来！登录成功');
      setLocation('/');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 注册第一步提交
  const handleRegisterStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !code) {
      toast.error('请填写完整账号信息及验证码');
      return;
    }
    setStep(2);
  };

  // 注册第二步提交
  const handleRegisterStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname || !school || !major) {
      toast.error('请完善你的校园认证档案');
      return;
    }
    setStep(3);
  };

  // 添加兴趣标签
  const handleAddInterest = () => {
    if (interestInput.trim() && !interests.includes(interestInput.trim())) {
      setInterests([...interests, interestInput.trim()]);
      setInterestInput('');
    }
  };

  // 注册第三步最终提交
  const handleRegisterFinal = async () => {
    setLoading(true);
    try {
      const res: any = await api.post('/auth/register', {
        email,
        password,
        code,
        nickname,
        school,
        major,
        mbti,
        social_energy: socialEnergy,
        interests,
      });
      setTokens(res.data.access_token, res.data.refresh_token);
      localStorage.setItem('user_info', JSON.stringify(res.data.user));
      toast.success('恭喜！注册成功，开启你的校园邀约之旅吧');
      setLocation('/');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h5-container bg-[#F9F9F7] flex flex-col justify-between p-6">
      {/* 顶部视觉 Banner */}
      <div className="text-center mt-6 shrink-0">
        <div className="inline-block bg-[#FFDE4D] border-3 border-black px-4 py-2 rotate-[-2deg] shadow-[3px_3px_0px_0px_#121212] mb-3">
          <span className="text-2xl font-black tracking-widest text-black">一起去！YI QI QU</span>
        </div>
        <p className="text-xs font-bold text-gray-500 tracking-wider">复旦大学专属行动型轻社交演示平台</p>
      </div>

      {/* 主卡片容器 */}
      <div className="flex-1 flex flex-col justify-center my-6">
        <div className="brutal-card p-5 bg-white step-container">
          {isLogin ? (
            /* 登录界面 */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <h2 className="text-xl font-black text-black mb-2">同学，请登录 🎒</h2>
              
              <div className="space-y-1">
                <label className="text-xs font-black text-black">复旦邮箱</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    placeholder="example@fudan.edu.cn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full brutal-input pl-11"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-black">密码</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    placeholder="请输入登录密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full brutal-input pl-11"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full brutal-btn-primary mt-2 text-base py-3"
              >
                {loading ? '登录中...' : '开始探索'}
              </button>
            </form>
          ) : (
            /* 注册分步界面 */
            <div>
              {step === 1 && (
                <form onSubmit={handleRegisterStep1} className="space-y-3">
                  <h2 className="text-xl font-black text-black mb-1">新同学注册 🚀</h2>
                  <p className="text-xs font-bold text-gray-500 mb-2">第一步：创建安全通行证</p>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-black">复旦学生邮箱</label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="yourname@fudan.edu.cn"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-1 brutal-input text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleSendCode}
                        disabled={countdown > 0 || loading}
                        className="brutal-btn bg-[#6BCB77] text-xs px-3 shadow-[2px_2px_0px_0px_#121212] active:translate-y-[1px]"
                      >
                        {countdown > 0 ? `${countdown}s` : '发验证码'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-black">验证码</label>
                    <input
                      type="text"
                      placeholder="请输入 6 位验证码"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full brutal-input"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-black">登录密码</label>
                    <input
                      type="password"
                      placeholder="设置 6 位以上密码"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full brutal-input"
                    />
                  </div>

                  <button type="submit" className="w-full brutal-btn-primary mt-2 text-sm py-3">
                    下一步：完善校园档案 <ArrowRight className="w-4 h-4 ml-1 inline" />
                  </button>
                </form>
              )}

              {step === 2 && (
                <form onSubmit={handleRegisterStep2} className="space-y-3">
                  <h2 className="text-xl font-black text-black mb-1">校园身份档案 🎓</h2>
                  <p className="text-xs font-bold text-gray-500 mb-2">第二步：核实学生专属信誉分</p>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-black">花名/昵称</label>
                    <input
                      type="text"
                      placeholder="例如：张杰瑞 Jerry"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full brutal-input"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-black">所在高校</label>
                    <input
                      type="text"
                      disabled
                      value={school}
                      className="w-full brutal-input bg-gray-100 cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-black">专业院系</label>
                    <input
                      type="text"
                      placeholder="例如：软件工程"
                      value={major}
                      onChange={(e) => setMajor(e.target.value)}
                      className="w-full brutal-input"
                    />
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 brutal-btn bg-white"
                    >
                      返回
                    </button>
                    <button type="submit" className="flex-[2] brutal-btn-primary">
                      下一步：定制个性 <ArrowRight className="w-4 h-4 ml-1 inline" />
                    </button>
                  </div>
                </form>
              )}

              {step === 3 && (
                <div className="space-y-3">
                  <h2 className="text-xl font-black text-black mb-1">个性特征定制 🎨</h2>
                  <p className="text-xs font-bold text-gray-500 mb-2">第三步：完成特征匹配画像</p>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-black">MBTI 心理类型</label>
                    <select
                      value={mbti}
                      onChange={(e) => setMbti(e.target.value)}
                      className="w-full brutal-input"
                    >
                      {MBTI_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-black text-black">
                      <span>社交能量 (Social Energy)</span>
                      <span className="text-[#FF5F5F]">{socialEnergy}%</span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold">高能量适合热闹局，低能量适合安静局</p>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={socialEnergy}
                      onChange={(e) => setSocialEnergy(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#FFDE4D]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-black">兴趣爱好标签</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="输入标签按回车或添加"
                        value={interestInput}
                        onChange={(e) => setInterestInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddInterest()}
                        className="flex-1 brutal-input text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleAddInterest}
                        className="brutal-btn bg-[#FFDE4D] text-xs"
                      >
                        添加
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2 max-h-[80px] overflow-y-auto">
                      {interests.map((tag) => (
                        <span
                          key={tag}
                          className="bg-gray-100 border border-black text-[10px] font-black px-2 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="flex-1 brutal-btn bg-white"
                    >
                      返回
                    </button>
                    <button
                      type="button"
                      onClick={handleRegisterFinal}
                      disabled={loading}
                      className="flex-[2] brutal-btn-primary"
                    >
                      {loading ? '注册中...' : '开启旅程'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 底部切换按钮 */}
      <div className="text-center mb-4 shrink-0">
        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setStep(1);
          }}
          className="text-xs font-black text-black underline decoration-2 underline-offset-4 hover:text-[#FF5F5F] transition-all"
        >
          {isLogin ? '还没有账号？新同学点击这里注册' : '已有学生账号？立即登录'}
        </button>
      </div>
    </div>
  );
}
