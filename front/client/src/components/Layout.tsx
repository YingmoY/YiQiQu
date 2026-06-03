import React, { useEffect, useRef } from 'react';
import { useLocation, Link } from 'wouter';
import { Compass, PlusCircle, MessageSquare, User, Trophy } from 'lucide-react';
import anime from 'animejs';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showNav?: boolean;
  headerAction?: React.ReactNode;
}

export default function Layout({ children, title, showNav = true, headerAction }: LayoutProps) {
  const [location, setLocation] = useLocation();
  const navRef = useRef<HTMLDivElement>(null);

  // 页面载入时的入场级联动画
  useEffect(() => {
    anime({
      targets: '.page-fade-in',
      opacity: [0, 1],
      translateY: [15, 0],
      duration: 400,
      easing: 'easeOutQuad'
    });
  }, [location]);

  // 导航栏按钮点击缩放反馈
  const handleNavClick = (path: string, e: React.MouseEvent) => {
    const target = e.currentTarget;
    anime({
      targets: target,
      scale: [1, 0.85, 1],
      duration: 200,
      easing: 'easeInOutQuad',
      complete: () => {
        setLocation(path);
      }
    });
  };

  const navItems = [
    { path: '/', label: '广场', icon: Compass },
    { path: '/leaderboard', label: '排行', icon: Trophy },
    { path: '/create', label: '发起', icon: PlusCircle, highlight: true },
    { path: '/messages', label: '消息', icon: MessageSquare },
    { path: '/profile', label: '我的', icon: User },
  ];

  return (
    <div className="h5-container page-fade-in">
      {/* 顶部潮流导航栏 */}
      <header className="h-[64px] bg-white border-b-3 border-black flex items-center justify-between px-5 shrink-0 z-10">
        <h1 className="text-xl font-black tracking-wider text-black select-none">
          {title || '一起去！'}
        </h1>
        <div className="flex items-center gap-3">
          {headerAction}
        </div>
      </header>

      {/* 页面主内容区域 */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-[80px] bg-[#F9F9F7]">
        {children}
      </main>

      {/* 底部波普风格弹性导航栏 */}
      {showNav && (
        <nav 
          ref={navRef}
          className="absolute bottom-0 left-0 right-0 h-[76px] bg-white border-t-3 border-black flex items-center justify-around px-2 z-10"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            if (item.highlight) {
              return (
                <button
                  key={item.path}
                  onClick={(e) => handleNavClick(item.path, e)}
                  className="relative -top-5 w-[56px] h-[56px] bg-[#FF5F5F] border-3 border-black rounded-full flex items-center justify-center shadow-[3px_3px_0px_0px_#121212] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#121212] transition-all"
                >
                  <Icon className="w-7 h-7 text-white stroke-[2.5]" />
                </button>
              );
            }

            return (
              <button
                key={item.path}
                onClick={(e) => handleNavClick(item.path, e)}
                className={`flex flex-col items-center justify-center w-[54px] h-[54px] rounded-xl transition-all ${
                  isActive 
                    ? 'bg-[#FFDE4D] text-black border-2 border-black font-black' 
                    : 'text-gray-500 font-medium'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
                <span className="text-[10px] mt-0.5 tracking-wider">{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
