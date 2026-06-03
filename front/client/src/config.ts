// "一起去" 校园行动型轻社交平台前端核心配置

// 后端 API 基础路径，本地开发使用 H5 Proxy 转发或直接连 Go 端口
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api/v1' 
  : 'http://localhost:8080/api/v1';

// WebSocket 基础路径
export const WS_BASE_URL = process.env.NODE_ENV === 'production'
  ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/api/v1`
  : 'ws://localhost:8080/api/v1';

// 预设的高校邮箱注册后缀
export const ALLOWED_EMAIL_SUFFIX = '@fudan.edu.cn';

// MBTI 类型选项
export const MBTI_OPTIONS = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP'
];

// 潮流波普风格头像底色
export const AVATAR_COLORS = [
  '#FFDE4D', // 柠檬黄
  '#FF5F5F', // 珊瑚红
  '#4D96FF', // 天空蓝
  '#6BCB77', // 浅草绿
  '#FF6B6B', // 西瓜红
  '#B983FF'  // 薰衣草紫
];

// 活动场景预设分类及对应的潮流色块主题
export const CATEGORY_THEMES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  '吃饭': {
    bg: '#FFE8E8',
    text: '#FF5F5F',
    border: '#FF5F5F',
    label: '一起干饭'
  },
  '自习': {
    bg: '#EAF2FF',
    text: '#4D96FF',
    border: '#4D96FF',
    label: '一起自习'
  },
  '运动': {
    bg: '#EBF9EB',
    text: '#6BCB77',
    border: '#6BCB77',
    label: '一起运动'
  },
  '外出': {
    bg: '#F5ECFF',
    text: '#B983FF',
    border: '#B983FF',
    label: '一起去玩'
  }
};
