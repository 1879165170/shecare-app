// ==================== 数据管理 ====================
const Store = {
  get(key, defaultVal = null) {
    const data = localStorage.getItem(`shecare_${key}`);
    return data ? JSON.parse(data) : defaultVal;
  },
  set(key, value) {
    localStorage.setItem(`shecare_${key}`, JSON.stringify(value));
  },
  remove(key) {
    localStorage.removeItem(`shecare_${key}`);
  }
};

// ==================== 周期计算 ====================
const CycleEngine = {
  // 获取用户周期配置
  getConfig() {
    return Store.get('cycleConfig', {
      periodStart: null, // 最后一次月经开始日期
      cycleLength: 28,
      periodLength: 5
    });
  },

  saveConfig(config) {
    Store.set('cycleConfig', config);
  },

  // 获取当前周期的阶段
  getCurrentPhase() {
    const config = this.getConfig();
    if (!config.periodStart) return { phase: 'unknown', day: 0 };

    const start = new Date(config.periodStart);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 计算周期第几天
    const diffTime = today - start;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) % config.cycleLength;
    const cycleDay = diffDays + 1;

    // 判断阶段
    let phase = 'luteal'; // 默认黄体期
    if (cycleDay <= config.periodLength) {
      phase = 'menstrual'; // 月经期
    } else if (cycleDay <= 13) {
      phase = 'follicular'; // 卵泡期
    } else if (cycleDay <= 16) {
      phase = 'ovulation'; // 排卵期
    } else {
      phase = 'luteal'; // 黄体期
    }

    return { phase, day: cycleDay };
  },

  // 获取下次月经日期
  getNextPeriod() {
    const config = this.getConfig();
    if (!config.periodStart) return null;

    const start = new Date(config.periodStart);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let nextStart = new Date(start);
    while (nextStart <= today) {
      nextStart.setDate(nextStart.getDate() + config.cycleLength);
    }
    return nextStart;
  },

  // 获取某天的状态（用于日历显示）
  getDayStatus(date) {
    const config = this.getConfig();
    if (!config.periodStart) return '';

    const start = new Date(config.periodStart);
    const diffTime = date - start;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const cycleDay = (diffDays % config.cycleLength + config.cycleLength) % config.cycleLength + 1;

    if (cycleDay <= config.periodLength) return 'period';
    if (cycleDay >= 12 && cycleDay <= 16) return 'ovulation';
    if (cycleDay >= 10 && cycleDay <= 18) return 'fertile';
    return '';
  },

  // 阶段详细信息
  getPhaseDetails(phase) {
    const details = {
      menstrual: {
        name: '月经期',
        emoji: '🌸',
        days: '第1-5天',
        desc: '雌激素和孕激素水平较低，子宫内膜脱落。你需要更多休息和温暖。',
        exercises: ['瑜伽（温和）', '散步', '拉伸', '冥想'],
        foods: ['红枣', '生姜', '红糖', '深色蔬菜', '富含铁的食物', '温热汤品']
      },
      follicular: {
        name: '卵泡期',
        emoji: '🌱',
        days: '第6-13天',
        desc: '雌激素上升，精力充沛，皮肤状态好。适合挑战新事物和高强度运动。',
        exercises: ['HIIT', '跑步', '力量训练', '舞蹈', '球类运动'],
        foods: ['高蛋白食物', '新鲜蔬果', '全谷物', '坚果', '发酵食品']
      },
      ovulation: {
        name: '排卵期',
        emoji: '✨',
        days: '第14-16天',
        desc: '雌激素达到峰值，社交能力增强，思维清晰。受孕几率最高的时期。',
        exercises: ['有氧运动', '游泳', '骑行', '团体课程', '户外运动'],
        foods: ['抗氧化食物', '优质脂肪', '深海鱼', '牛油果', '莓果类']
      },
      luteal: {
        name: '黄体期',
        emoji: '🍂',
        days: '第17-28天',
        desc: '孕激素上升，可能出现PMS症状。需要关注情绪变化和抗炎饮食。',
        exercises: ['瑜伽', '普拉提', '快走', '轻度力量训练', '舒缓拉伸'],
        foods: ['复合碳水', '富含镁的食物', '深绿色蔬菜', '香蕉', '黑巧克力', '草本茶']
      }
    };
    return details[phase] || details.luteal;
  }
};

// ==================== 建议引擎 ====================
const Advisor = {
  // 获取今日建议
  getTodayTips() {
    const { phase } = CycleEngine.getCurrentPhase();
    const tips = {
      menstrual: [
        { icon: '🩸', text: '多休息，避免剧烈运动', category: '运动' },
        { icon: '🍵', text: '喝温热的红糖姜茶缓解不适', category: '饮食' },
        { icon: '🔥', text: '用暖水袋热敷腹部', category: '护理' },
        { icon: '😴', text: '保证充足睡眠，早点休息', category: '睡眠' }
      ],
      follicular: [
        { icon: '💪', text: '精力充沛，适合高强度运动', category: '运动' },
        { icon: '🥗', text: '多吃高蛋白食物促进恢复', category: '饮食' },
        { icon: '🎯', text: '适合制定新计划和挑战', category: '生活' },
        { icon: '☀️', text: '皮肤状态好，可以尝试新妆容', category: '美容' }
      ],
      ovulation: [
        { icon: '✨', text: '社交能力增强，适合约会聚会', category: '社交' },
        { icon: '🏃‍♀️', text: '体能巅峰，可以挑战极限运动', category: '运动' },
        { icon: '🐟', text: '补充优质脂肪和抗氧化食物', category: '饮食' },
        { icon: '📝', text: '思维清晰，适合重要决策', category: '工作' }
      ],
      luteal: [
        { icon: '🧘‍♀️', text: '选择舒缓运动，避免过度消耗', category: '运动' },
        { icon: '🍫', text: '适当补充镁，缓解PMS症状', category: '饮食' },
        { icon: '😌', text: '情绪波动正常，多对自己温柔', category: '情绪' },
        { icon: '🌙', text: '睡前远离手机，改善睡眠质量', category: '睡眠' }
      ]
    };
    return tips[phase] || tips.luteal;
  },

  // 饮食建议
  getDietAdvice() {
    const { phase } = CycleEngine.getCurrentPhase();
    const advice = {
      menstrual: '多摄入富含铁的食物如红肉、菠菜，补充维生素C促进铁吸收。避免生冷食物，多喝温热汤品。',
      follicular: '新陈代谢旺盛，多摄入优质蛋白质和新鲜蔬果。可以适当增加碳水化合物为运动供能。',
      ovulation: '雌激素高峰期，注意补充抗氧化食物如莓果、深色蔬菜。减少加工食品，保护激素平衡。',
      luteal: '孕激素上升，注意抗炎饮食。多吃富含镁的深绿色蔬菜、坚果，减少咖啡因和糖分摄入。'
    };
    return advice[phase] || advice.luteal;
  },

  // 运动推荐
  getExerciseRecommend() {
    const { phase } = CycleEngine.getCurrentPhase();
    const recommend = {
      menstrual: {
        name: '温和瑜伽',
        intensity: '低',
        icon: '🧘‍♀️',
        desc: '舒缓拉伸，缓解痛经'
      },
      follicular: {
        name: 'HIIT 训练',
        intensity: '高',
        icon: '💪',
        desc: '利用高能量期挑战自己'
      },
      ovulation: {
        name: '户外跑步',
        intensity: '中高',
        icon: '🏃‍♀️',
        desc: '体能巅峰，享受运动快感'
      },
      luteal: {
        name: '普拉提',
        intensity: '中',
        icon: '🤸‍♀️',
        desc: '塑形同时稳定情绪'
      }
    };
    return recommend[phase] || recommend.luteal;
  },

  // 抗炎训练推荐
  getAntiInflammatory() {
    return [
      { icon: '🧘', name: '呼吸冥想', desc: '5分钟腹式呼吸，降低皮质醇', duration: '5分钟' },
      { icon: '🚶‍♀️', name: '轻快散步', desc: '促进血液循环，缓解炎症', duration: '20分钟' },
      { icon: '🏊‍♀️', name: '温水游泳', desc: '全身放松，关节友好', duration: '30分钟' },
      { icon: '💆‍♀️', name: '泡沫轴放松', desc: '缓解肌肉紧张，促进恢复', duration: '10分钟' }
    ];
  },

  // 食品预警
  checkFood(food, isProcessed) {
    const warnings = [];
    if (isProcessed) {
      const { phase } = CycleEngine.getCurrentPhase();
      if (phase === 'luteal') {
        warnings.push({
          level: 'high',
          text: '黄体期对加工食品更敏感，可能加重PMS症状'
        });
      } else {
        warnings.push({
          level: 'medium',
          text: '加工食品可能影响激素平衡，建议适量'
        });
      }
    }
    return warnings;
  }
};

// ==================== AI助手 ====================
const Assistant = {
  // 基于规则的回复
  getResponse(question) {
    const { phase, day } = CycleEngine.getCurrentPhase();
    const phaseInfo = CycleEngine.getPhaseDetails(phase);
    const config = CycleEngine.getConfig();

    // 关键词匹配
    const q = question.toLowerCase();

    if (q.includes('痛经') || q.includes('肚子疼') || q.includes('姨妈痛')) {
      return `在${phaseInfo.name}，痛经是常见现象。建议：
1. 热敷腹部，用暖水袋或暖宝宝
2. 喝红糖姜茶或洋甘菊茶
3. 轻柔的瑜伽拉伸
4. 避免生冷食物
5. 如果疼痛严重，可以适当服用布洛芬

你现在是周期第${day}天，好好休息哦～`;
    }

    if (q.includes('运动') || q.includes('锻炼') || q.includes('健身')) {
      const rec = Advisor.getExerciseRecommend();
      return `你现在处于${phaseInfo.name}，适合的运动是${rec.name}（强度：${rec.intensity}）。

${phaseInfo.desc}

推荐运动：${phaseInfo.exercises.join('、')}

记得听从身体信号，不要勉强自己～`;
    }

    if (q.includes('吃') || q.includes('饮食') || q.includes('食物') || q.includes('营养')) {
      return `在${phaseInfo.name}，推荐的食物有：
${phaseInfo.foods.join('、')}

${Advisor.getDietAdvice()}

注意避免：生冷食物、过量咖啡因、加工食品`;
    }

    if (q.includes('睡') || q.includes('失眠') || q.includes('困')) {
      return `睡眠质量会受周期影响。在${phaseInfo.name}：

🌙 睡眠建议：
1. 保持规律作息
2. 睡前1小时远离手机
3. 可以泡脚或喝温热的花草茶
4. 保持卧室凉爽黑暗
5. 如果焦虑，试试冥想或深呼吸

祝你今晚好眠～`;
    }

    if (q.includes('情绪') || q.includes('心情') || q.includes('焦虑') || q.includes('抑郁') || q.includes('烦躁')) {
      return `在${phaseInfo.name}，情绪波动是正常的生理现象。

💕 温柔提醒：
1. 接纳自己的情绪，不要责怪自己
2. 可以写日记或和朋友倾诉
3. 适度运动能改善情绪
4. 保证充足睡眠
5. 如果持续低落，请寻求专业帮助

你已经做得很好了，对自己温柔一点～`;
    }

    if (q.includes('周期') || q.includes('排卵') || q.includes('安全期') || q.includes('怀孕')) {
      const nextPeriod = CycleEngine.getNextPeriod();
      const nextDate = nextPeriod ? nextPeriod.toLocaleDateString('zh-CN') : '未知';
      return `你的周期信息：
📅 当前：${phaseInfo.name}（周期第${day}天）
🔄 周期长度：${config.cycleLength}天
🩸 下次月经预计：${nextDate}

排卵期通常在下次月经前14天左右，是受孕几率最高的时期。`;
    }

    if (q.includes('皮肤') || q.includes('痘痘') || q.includes('美容')) {
      return `皮肤状态与周期密切相关：

${phaseInfo.name}皮肤特点：
${phase === 'menstrual' ? '皮肤可能暗沉、干燥，加强保湿' :
  phase === 'follicular' ? '皮肤状态最佳，光泽细腻' :
  phase === 'ovulation' ? '皮肤水润有光泽，状态极佳' :
  '可能出油、长痘，注意清洁控油'}

护肤建议：温和清洁、充分保湿、防晒不能少～`;
    }

    // 默认回复
    return `你好呀！我是你的健康助手 💕

你现在处于${phaseInfo.name}（周期第${day}天）。

${phaseInfo.desc}

你可以问我关于：
🌙 周期和排卵
🍽️ 饮食建议
🏃‍♀️ 运动推荐
😴 睡眠和情绪
🌸 皮肤护理

有什么想聊的吗？`;
  },

  // 快捷问题
  getQuickQuestions() {
    return [
      '今天适合什么运动？',
      '痛经怎么办？',
      '该吃什么好？',
      '最近情绪不好',
      '睡眠质量差',
      '我的周期正常吗？'
    ];
  }
};

// ==================== 社区 ====================
const Community = {
  getPosts() {
    return Store.get('communityPosts', [
      {
        id: 1,
        user: '小花',
        avatar: '🌸',
        time: '2小时前',
        content: '今天是黄体期第3天，感觉有点累但还是坚持做了瑜伽。对自己说声：做得好！',
        feelings: ['疲倦', '坚持'],
        likes: 12,
        comments: 3
      },
      {
        id: 2,
        user: '月月',
        avatar: '🌙',
        time: '5小时前',
        content: '卵泡期真的是黄金时间！今天状态超好，完成了HIIT训练，皮肤也亮亮的。',
        feelings: ['充满活力', '开心'],
        likes: 28,
        comments: 8
      },
      {
        id: 3,
        user: '小雨',
        avatar: '🌧️',
        time: '1天前',
        content: '月经期第一天，痛经有点严重。按照建议热敷+红糖姜茶，感觉好一些了。姐妹们要照顾好自己。',
        feelings: ['疲倦', '酸痛'],
        likes: 45,
        comments: 15
      }
    ]);
  },

  addPost(post) {
    const posts = this.getPosts();
    posts.unshift({
      id: Date.now(),
      user: '我',
      avatar: '💕',
      time: '刚刚',
      ...post
    });
    Store.set('communityPosts', posts);
  }
};

// ==================== 页面导航 ====================
let currentPage = 'home';
const pageHistory = [];

function showPage(page) {
  // 隐藏所有页面
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById('main').classList.add('hidden');

  // 显示目标页面
  if (page === 'home') {
    document.getElementById('main').classList.remove('hidden');
    pageHistory.length = 0;
  } else {
    const pageEl = document.getElementById(`page-${page}`);
    if (pageEl) {
      pageEl.classList.remove('hidden');
      pageHistory.push(currentPage);
    }
  }

  // 更新底部导航状态
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('onclick')?.includes(`'${page}'`)) {
      item.classList.add('active');
    }
  });

  currentPage = page;

  // 页面特定初始化
  if (page === 'period') initPeriodPage();
  if (page === 'diet') initDietPage();
  if (page === 'exercise') initExercisePage();
  if (page === 'mood') initMoodPage();
  if (page === 'body') initBodyPage();
  if (page === 'community') initCommunityPage();
  if (page === 'assistant') initAssistantPage();
}

function goBack() {
  const prevPage = pageHistory.pop() || 'home';
  showPage(prevPage);
}

// ==================== 首页 ====================
function initHome() {
  // 更新问候语
  const hour = new Date().getHours();
  let greeting = '早上好';
  if (hour >= 12 && hour < 18) greeting = '下午好';
  else if (hour >= 18) greeting = '晚上好';
  document.getElementById('greeting').textContent = greeting;

  // 更新日期
  const today = new Date();
  const options = { month: 'long', day: 'numeric', weekday: 'long' };
  document.getElementById('headerDate').textContent = today.toLocaleDateString('zh-CN', options);

  // 更新周期卡片
  updateCycleCard();

  // 更新今日建议
  updateTodayTips();

  // 更新今日概览
  updateOverview();
}

function updateCycleCard() {
  const { phase, day } = CycleEngine.getCurrentPhase();
  const phaseInfo = CycleEngine.getPhaseDetails(phase);

  document.getElementById('phaseIcon').textContent = phaseInfo.emoji;
  document.getElementById('phaseName').textContent = phaseInfo.name;
  document.getElementById('phaseDay').textContent = `周期第 ${day} 天`;

  // 根据阶段显示提示
  const tips = {
    menstrual: '今天身体需要更多休息和温暖 🌸',
    follicular: '精力充沛，适合挑战新事物 🌱',
    ovulation: '社交能力增强，思维清晰 ✨',
    luteal: '关注情绪变化，多对自己温柔 🍂'
  };
  document.getElementById('cycleTip').textContent = tips[phase] || '';

  // 更新进度条
  const config = CycleEngine.getConfig();
  const progress = (day / config.cycleLength) * 100;
  document.getElementById('cycleProgress').style.width = `${progress}%`;
}

function updateTodayTips() {
  const tips = Advisor.getTodayTips();
  const container = document.getElementById('todayTips');
  container.innerHTML = tips.map(tip => `
    <div class="overview-item" style="min-width: 140px; flex-shrink: 0;">
      <div style="font-size: 24px;">${tip.icon}</div>
      <div style="font-size: 13px; margin-top: 8px;">${tip.text}</div>
      <div style="font-size: 11px; color: var(--text-light); margin-top: 4px;">${tip.category}</div>
    </div>
  `).join('');
  container.style.cssText = 'display: flex; overflow-x: auto; gap: 12px; padding-bottom: 8px;';
}

function updateOverview() {
  const today = new Date().toISOString().split('T')[0];
  const meals = Store.get('meals', {});
  const exercises = Store.get('exercises', {});
  const moods = Store.get('moods', {});
  const sleep = Store.get('sleep', {});

  const todayMeals = meals[today] || [];
  const todayExercise = exercises[today] || null;
  const todayMood = moods[today] || null;
  const todaySleep = sleep[today] || null;

  const container = document.getElementById('overviewGrid');
  container.innerHTML = `
    <div class="overview-item">
      <div class="overview-label">今日饮食</div>
      <div class="overview-value">${todayMeals.length}</div>
      <div class="overview-trend" style="color: var(--success);">餐</div>
    </div>
    <div class="overview-item">
      <div class="overview-label">今日运动</div>
      <div class="overview-value">${todayExercise ? todayExercise.duration : 0}</div>
      <div class="overview-trend" style="color: var(--success);">分钟</div>
    </div>
    <div class="overview-item">
      <div class="overview-label">睡眠时长</div>
      <div class="overview-value">${todaySleep ? todaySleep.duration : '--'}</div>
      <div class="overview-trend" style="color: var(--text-light);">小时</div>
    </div>
    <div class="overview-item">
      <div class="overview-label">今日情绪</div>
      <div class="overview-value">${todayMood ? todayMood.emoji : '--'}</div>
      <div class="overview-trend" style="color: var(--text-light);">${todayMood ? todayMood.label : '未记录'}</div>
    </div>
  `;
}

// ==================== 周期页 ====================
let calendarDate = new Date();

function initPeriodPage() {
  renderCalendar();
  updateCycleInfo();
}

function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  document.getElementById('calendarMonth').textContent =
    `${year}年${month + 1}月`;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = (firstDay.getDay() + 6) % 7; // 周一为0

  let html = '';
  // 空白天数
  for (let i = 0; i < startDay; i++) {
    html += '<div class="calendar-day empty"></div>';
  }

  // 日期
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day);
    const status = CycleEngine.getDayStatus(date);
    const isToday = date.getTime() === today.getTime();

    html += `<div class="calendar-day ${status} ${isToday ? 'today' : ''}">${day}</div>`;
  }

  document.getElementById('calendarDays').innerHTML = html;
}

function changeMonth(delta) {
  calendarDate.setMonth(calendarDate.getMonth() + delta);
  renderCalendar();
}

function updateCycleInfo() {
  const { phase, day } = CycleEngine.getCurrentPhase();
  const phaseInfo = CycleEngine.getPhaseDetails(phase);
  const config = CycleEngine.getConfig();
  const nextPeriod = CycleEngine.getNextPeriod();

  document.getElementById('currentPhase').textContent = phaseInfo.name;
  document.getElementById('cycleLength').textContent = `${config.cycleLength}天`;
  document.getElementById('nextPeriod').textContent =
    nextPeriod ? `${nextPeriod.getMonth() + 1}/${nextPeriod.getDate()}` : '--';

  // 阶段详情
  document.getElementById('detailPhaseEmoji').textContent = phaseInfo.emoji;
  document.getElementById('detailPhaseName').textContent = phaseInfo.name;
  document.getElementById('detailPhaseDays').textContent = phaseInfo.days;
  document.getElementById('detailPhaseDesc').textContent = phaseInfo.desc;

  document.getElementById('detailPhaseExercises').innerHTML = `
    <h4>💪 推荐运动</h4>
    <div>${phaseInfo.exercises.join(' · ')}</div>
  `;

  document.getElementById('detailPhaseFoods').innerHTML = `
    <h4>🥗 推荐食物</h4>
    <div>${phaseInfo.foods.join(' · ')}</div>
  `;
}

function togglePeriodEdit() {
  // 简单实现：允许设置周期开始日期
  const dateStr = prompt('请输入最后一次月经开始日期 (YYYY-MM-DD):',
    Store.get('cycleConfig', {}).periodStart || new Date().toISOString().split('T')[0]);
  if (dateStr) {
    const config = CycleEngine.getConfig();
    config.periodStart = dateStr;
    CycleEngine.saveConfig(config);
    initPeriodPage();
    initHome();
  }
}

// ==================== 饮食页 ====================
let currentMealType = 'breakfast';
let currentFoodType = false;
let currentPortion = 'medium';

function initDietPage() {
  const advice = Advisor.getDietAdvice();
  document.getElementById('dietAdviceText').textContent = advice;

  renderMealTimeline();
  renderNutritionBars();
  renderFoodWarnings();
}

function renderMealTimeline() {
  const today = new Date().toISOString().split('T')[0];
  const meals = Store.get('meals', {});
  const todayMeals = meals[today] || [];

  const container = document.getElementById('mealTimeline');
  if (todayMeals.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-light);">
        <div style="font-size: 48px; margin-bottom: 12px;">🍽️</div>
        <p>今天还没有记录饮食</p>
      </div>
    `;
    return;
  }

  const mealIcons = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙',
    snack: '🍪'
  };

  const mealNames = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐',
    snack: '加餐'
  };

  container.innerHTML = todayMeals.map(meal => `
    <div class="meal-item">
      <div class="meal-time">${meal.time}</div>
      <div class="meal-icon">${mealIcons[meal.type] || '🍽️'}</div>
      <div class="meal-info">
        <div class="meal-name">${meal.food}</div>
        <div class="meal-type">${mealNames[meal.type]} · ${meal.portion}</div>
      </div>
      <div class="meal-tag ${meal.isProcessed ? 'processed' : 'natural'}">
        ${meal.isProcessed ? '加工' : '天然'}
      </div>
    </div>
  `).join('');
}

function renderNutritionBars() {
  // 模拟营养数据
  const container = document.getElementById('nutritionBars');
  const nutrients = [
    { name: '蛋白质', value: 65, max: 100, color: '#4CAF50', unit: 'g' },
    { name: '碳水化合物', value: 45, max: 100, color: '#2196F3', unit: 'g' },
    { name: '脂肪', value: 30, max: 100, color: '#FF9800', unit: 'g' },
    { name: '膳食纤维', value: 20, max: 100, color: '#9C27B0', unit: 'g' }
  ];

  container.innerHTML = nutrients.map(n => `
    <div class="nutrition-item">
      <div class="nutrition-label">
        <span>${n.name}</span>
        <span>${n.value}${n.unit} / ${n.max}${n.unit}</span>
      </div>
      <div class="nutrition-bar">
        <div class="nutrition-fill" style="width: ${(n.value / n.max) * 100}%; background: ${n.color};"></div>
      </div>
    </div>
  `).join('');
}

function renderFoodWarnings() {
  const container = document.getElementById('foodWarnings');
  const warnings = [
    { level: 'medium', text: '今天已有2次加工食品记录，注意控制' },
    { level: 'high', text: '黄体期建议减少咖啡因摄入' }
  ];

  container.innerHTML = warnings.map(w => `
    <div class="food-warning ${w.level}">${w.text}</div>
  `).join('');
}

function showDietAdd() {
  document.getElementById('modal-diet-add').classList.remove('hidden');
}

function setMealType(btn, type) {
  currentMealType = type;
  document.querySelectorAll('.meal-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function setFoodType(btn, isProcessed) {
  currentFoodType = isProcessed;
  document.querySelectorAll('.food-type-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function setPortion(btn, portion) {
  currentPortion = portion;
  document.querySelectorAll('.portion-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function saveMeal() {
  const food = document.getElementById('foodInput').value.trim();
  if (!food) {
    alert('请描述你吃了什么');
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  const meals = Store.get('meals', {});
  if (!meals[today]) meals[today] = [];

  const now = new Date();
  meals[today].push({
    type: currentMealType,
    food,
    isProcessed: currentFoodType,
    portion: currentPortion,
    time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`
  });

  Store.set('meals', meals);

  // 食品预警
  const warnings = Advisor.checkFood(food, currentFoodType);
  if (warnings.length > 0) {
    alert(warnings[0].text);
  }

  closeModal('modal-diet-add');
  document.getElementById('foodInput').value = '';
  initDietPage();
  initHome();
}

// ==================== 运动页 ====================
let selectedExercise = null;

function initExercisePage() {
  const rec = Advisor.getExerciseRecommend();
  document.getElementById('exerciseRecommendText').textContent = rec.name;
  document.getElementById('exerciseIntensity').textContent = `强度：${rec.intensity}`;

  renderExerciseTypes();
  renderWeekExercise();
  renderAntiInflammatory();
}

function renderExerciseTypes() {
  const types = [
    { id: 'yoga', icon: '🧘‍♀️', name: '瑜伽' },
    { id: 'running', icon: '🏃‍♀️', name: '跑步' },
    { id: 'strength', icon: '💪', name: '力量训练' },
    { id: 'swimming', icon: '🏊‍♀️', name: '游泳' },
    { id: 'cycling', icon: '🚴‍♀️', name: '骑行' },
    { id: 'dance', icon: '💃', name: '舞蹈' },
    { id: 'walking', icon: '🚶‍♀️', name: '散步' },
    { id: 'hiit', icon: '🔥', name: 'HIIT' }
  ];

  const container = document.getElementById('exerciseTypes');
  container.innerHTML = types.map(t => `
    <div class="exercise-type ${selectedExercise === t.id ? 'active' : ''}"
         onclick="selectExercise('${t.id}', '${t.name}')">
      <div class="exercise-type-icon">${t.icon}</div>
      <div class="exercise-type-name">${t.name}</div>
    </div>
  `).join('');
}

function selectExercise(id, name) {
  selectedExercise = id;
  const duration = prompt(`记录${name}时长（分钟）：`, '30');
  if (duration) {
    const today = new Date().toISOString().split('T')[0];
    const exercises = Store.get('exercises', {});
    exercises[today] = {
      type: id,
      name,
      duration: parseInt(duration),
      time: new Date().toISOString()
    };
    Store.set('exercises', exercises);

    alert(`太棒了！${name} ${duration}分钟打卡成功 💪`);
    initExercisePage();
    initHome();
  }
  renderExerciseTypes();
}

function renderWeekExercise() {
  const container = document.getElementById('weekExercise');
  const exercises = Store.get('exercises', {});

  // 本周数据
  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];
  const now = new Date();
  const today = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - ((today + 6) % 7));

  let totalDuration = 0;
  let totalDays = 0;

  const bars = weekDays.map((day, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const exercise = exercises[dateStr];
    const duration = exercise ? exercise.duration : 0;
    if (duration > 0) {
      totalDuration += duration;
      totalDays++;
    }
    const height = Math.min((duration / 60) * 100, 100);
    return `
      <div class="week-bar">
        <div class="week-bar-fill" style="height: ${height || 4}%"></div>
        <div class="week-bar-label">${day}</div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="week-chart">${bars}</div>
    <div class="week-stats">
      <div class="week-stat">
        <div class="week-stat-value">${totalDays}</div>
        <div class="week-stat-label">运动天数</div>
      </div>
      <div class="week-stat">
        <div class="week-stat-value">${totalDuration}</div>
        <div class="week-stat-label">总时长(分钟)</div>
      </div>
      <div class="week-stat">
        <div class="week-stat-value">${totalDays > 0 ? Math.round(totalDuration / totalDays) : 0}</div>
        <div class="week-stat-label">平均时长</div>
      </div>
    </div>
  `;
}

function renderAntiInflammatory() {
  const items = Advisor.getAntiInflammatory();
  const container = document.getElementById('antiInflammatory');

  container.innerHTML = items.map(item => `
    <div class="anti-item">
      <div class="anti-icon">${item.icon}</div>
      <div class="anti-info">
        <div class="anti-name">${item.name}</div>
        <div class="anti-desc">${item.desc}</div>
      </div>
      <button class="anti-btn" onclick="startAnti('${item.name}')">开始</button>
    </div>
  `).join('');
}

function startAnti(name) {
  alert(`开始「${name}」\n\n记得保持专注，感受身体的变化 🌿`);
}

// ==================== 睡眠情绪页 ====================
let sleepQuality = 3;
let selectedMood = null;

function initMoodPage() {
  renderMoodOptions();
  renderMoodChart();
  renderCommunityPreview();
}

function setSleepQuality(quality) {
  sleepQuality = quality;
  document.querySelectorAll('.quality-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.quality) === quality);
  });
}

function saveSleep() {
  const start = document.getElementById('sleepStart').value;
  const end = document.getElementById('sleepEnd').value;

  // 计算时长
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  let duration = (endH * 60 + endM) - (startH * 60 + startM);
  if (duration < 0) duration += 24 * 60;

  const today = new Date().toISOString().split('T')[0];
  const sleep = Store.get('sleep', {});
  sleep[today] = {
    start,
    end,
    duration: Math.round(duration / 60 * 10) / 10,
    quality: sleepQuality
  };
  Store.set('sleep', sleep);

  alert(`睡眠记录已保存 😴\n时长：${sleep[today].duration}小时\n质量：${'😴😪😐😊🥰'[sleepQuality - 1]}`);
  initHome();
}

function renderMoodOptions() {
  const moods = [
    { emoji: '😊', label: '开心', id: 'happy' },
    { emoji: '😌', label: '平静', id: 'calm' },
    { emoji: '🥰', label: '幸福', id: 'love' },
    { emoji: '😔', label: '低落', id: 'sad' },
    { emoji: '😤', label: '烦躁', id: 'angry' },
    { emoji: '😰', label: '焦虑', id: 'anxious' }
  ];

  const container = document.getElementById('moodOptions');
  container.innerHTML = moods.map(m => `
    <button class="mood-btn ${selectedMood === m.id ? 'active' : ''}"
            onclick="selectMood('${m.id}', '${m.emoji}', '${m.label}')">
      <span class="mood-btn-emoji">${m.emoji}</span>
      <span class="mood-btn-label">${m.label}</span>
    </button>
  `).join('');
}

function selectMood(id, emoji, label) {
  selectedMood = { id, emoji, label };
  renderMoodOptions();
}

function saveMood() {
  if (!selectedMood) {
    alert('请选择今天的情绪');
    return;
  }

  const note = document.getElementById('moodNote').value.trim();
  const today = new Date().toISOString().split('T')[0];
  const moods = Store.get('moods', {});
  moods[today] = {
    ...selectedMood,
    note,
    time: new Date().toISOString()
  };
  Store.set('moods', moods);

  alert('情绪记录已保存 💕\n\n' + (note ? '你的感受很重要，记得对自己温柔～' : ''));
  document.getElementById('moodNote').value = '';
  initHome();
}

function renderMoodChart() {
  const container = document.getElementById('moodChart');
  const moods = Store.get('moods', {});

  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];
  const now = new Date();
  const today = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - ((today + 6) % 7));

  const weekMoods = weekDays.map((day, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    return {
      day,
      mood: moods[dateStr] || null
    };
  });

  const moodEmojis = weekMoods.map(m =>
    m.mood ? m.mood.emoji : '⚪'
  ).join('');

  const happyDays = Object.values(moods).filter(m => m.id === 'happy' || m.id === 'love').length;

  container.innerHTML = `
    <div class="mood-week">
      ${weekMoods.map(m => `
        <div class="mood-day">
          <div class="mood-day-label">${m.day}</div>
          <div class="mood-day-emoji">${m.mood ? m.mood.emoji : '⚪'}</div>
        </div>
      `).join('')}
    </div>
    <div class="mood-stats">
      <div class="mood-stat">
        <div class="mood-stat-value">${Object.keys(moods).length}</div>
        <div class="mood-stat-label">记录天数</div>
      </div>
      <div class="mood-stat">
        <div class="mood-stat-value">${happyDays}</div>
        <div class="mood-stat-label">开心天数</div>
      </div>
    </div>
  `;
}

function renderCommunityPreview() {
  const posts = Community.getPosts().slice(0, 2);
  const container = document.getElementById('communityPreview');

  container.innerHTML = posts.map(post => `
    <div class="community-item">
      <div class="community-user">
        <div class="community-avatar">${post.avatar}</div>
        <div>
          <div class="community-name">${post.user}</div>
          <div class="community-time">${post.time}</div>
        </div>
      </div>
      <div class="community-content">${post.content}</div>
    </div>
  `).join('');
}

// ==================== 身体数据页 ====================
let poopType = '';
let poopCount = 0;
let selectedFlow = '';
let selectedSymptoms = [];

function initBodyPage() {
  const today = new Date().toISOString().split('T')[0];
  const records = Store.get('bodyRecords', {});
  const todayRecord = records[today] || {};

  document.getElementById('weightInput').value = todayRecord.weight || '';
  document.getElementById('periodToggle').checked = todayRecord.period || false;

  if (todayRecord.period) {
    document.getElementById('periodFlowSection').classList.remove('hidden');
    selectedFlow = todayRecord.flow || '';
  }

  updateWeightTrend();
  drawWeightChart();
}

function saveWeight() {
  const weight = parseFloat(document.getElementById('weightInput').value);
  if (!weight || weight <= 0) {
    alert('请输入有效的体重');
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  const records = Store.get('bodyRecords', {});
  if (!records[today]) records[today] = {};
  records[today].weight = weight;
  Store.set('bodyRecords', records);

  alert('体重记录已保存 ⚖️');
  updateWeightTrend();
  drawWeightChart();
  initHome();
}

function updateWeightTrend() {
  const records = Store.get('bodyRecords', {});
  const weights = Object.entries(records)
    .filter(([_, r]) => r.weight)
    .map(([date, r]) => ({ date, weight: r.weight }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const container = document.getElementById('weightTrend');
  if (weights.length >= 2) {
    const latest = weights[weights.length - 1].weight;
    const prev = weights[weights.length - 2].weight;
    const diff = (latest - prev).toFixed(1);

    if (diff > 0) {
      container.innerHTML = `<span style="color: var(--warning);">↑ ${diff}kg</span> 较上次`;
    } else if (diff < 0) {
      container.innerHTML = `<span style="color: var(--success);">↓ ${Math.abs(diff)}kg</span> 较上次`;
    } else {
      container.textContent = '与上次持平';
    }
  } else {
    container.textContent = '记录更多数据以查看趋势';
  }
}

function drawWeightChart() {
  const canvas = document.getElementById('weightChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const records = Store.get('bodyRecords', {});
  const weights = Object.entries(records)
    .filter(([_, r]) => r.weight)
    .map(([date, r]) => ({ date, weight: r.weight }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14);

  if (weights.length < 2) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#999';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('至少需要2条数据', canvas.width / 2, canvas.height / 2);
    return;
  }

  // 设置canvas尺寸
  canvas.width = canvas.offsetWidth * 2;
  canvas.height = canvas.offsetHeight * 2;
  ctx.scale(2, 2);

  const w = canvas.offsetWidth;
  const h = canvas.offsetHeight;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };

  const weights2 = weights.map(w => w.weight);
  const minW = Math.min(...weights2) - 1;
  const maxW = Math.max(...weights2) + 1;
  const range = maxW - minW || 1;

  // 清空
  ctx.clearRect(0, 0, w, h);

  // 画网格
  ctx.strokeStyle = '#E8E8E8';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + ((h - padding.top - padding.bottom) / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w - padding.right, y);
    ctx.stroke();

    // Y轴标签
    ctx.fillStyle = '#999';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    const val = maxW - (range / 4) * i;
    ctx.fillText(val.toFixed(1), padding.left - 8, y + 4);
  }

  // 画线
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;

  ctx.strokeStyle = '#E91E8C';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.beginPath();

  weights.forEach((item, i) => {
    const x = padding.left + (chartW / (weights.length - 1)) * i;
    const y = padding.top + chartH - ((item.weight - minW) / range) * chartH;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // 画点
  weights.forEach((item, i) => {
    const x = padding.left + (chartW / (weights.length - 1)) * i;
    const y = padding.top + chartH - ((item.weight - minW) / range) * chartH;

    ctx.fillStyle = 'white';
    ctx.strokeStyle = '#E91E8C';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
}

function togglePeriodRecord() {
  const checked = document.getElementById('periodToggle').checked;
  document.getElementById('periodFlowSection').classList.toggle('hidden', !checked);
}

function setFlow(btn, flow) {
  selectedFlow = flow;
  document.querySelectorAll('.flow-options button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function toggleSymptom(btn, symptom) {
  btn.classList.toggle('active');
  if (selectedSymptoms.includes(symptom)) {
    selectedSymptoms = selectedSymptoms.filter(s => s !== symptom);
  } else {
    selectedSymptoms.push(symptom);
  }
}

function savePeriod() {
  const isPeriod = document.getElementById('periodToggle').checked;
  const today = new Date().toISOString().split('T')[0];
  const records = Store.get('bodyRecords', {});
  if (!records[today]) records[today] = {};

  records[today].period = isPeriod;
  if (isPeriod) {
    records[today].flow = selectedFlow;
    records[today].symptoms = selectedSymptoms;
  }

  // 如果记录了姨妈开始，更新周期配置
  if (isPeriod) {
    const config = CycleEngine.getConfig();
    if (!config.periodStart) {
      config.periodStart = today;
      CycleEngine.saveConfig(config);
    }
  }

  Store.set('bodyRecords', records);
  alert('姨妈记录已保存 🩸');
  initHome();
}

function setPoop(btn, type) {
  poopType = type;
  document.querySelectorAll('.poop-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function changePoopCount(delta) {
  poopCount = Math.max(0, poopCount + delta);
  document.getElementById('poopCount').textContent = poopCount;
}

function savePoop() {
  if (!poopType) {
    alert('请选择排便类型');
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  const records = Store.get('bodyRecords', {});
  if (!records[today]) records[today] = {};

  records[today].poop = {
    type: poopType,
    count: poopCount
  };

  Store.set('bodyRecords', records);
  alert('排便记录已保存 💩');
  initHome();
}

// ==================== 社区页 ====================
let diaryFeelings = [];
let diaryIsPublic = true;

function initCommunityPage() {
  renderCommunityFeed();
}

function renderCommunityFeed() {
  const posts = Community.getPosts();
  const container = document.getElementById('communityFeed');

  container.innerHTML = posts.map(post => `
    <div class="community-item">
      <div class="community-user">
        <div class="community-avatar">${post.avatar}</div>
        <div>
          <div class="community-name">${post.user}</div>
          <div class="community-time">${post.time}</div>
        </div>
      </div>
      <div class="community-content">${post.content}</div>
      ${post.feelings ? `
        <div class="community-feelings">
          ${post.feelings.map(f => `<span class="community-feeling">${f}</span>`).join('')}
        </div>
      ` : ''}
      <div class="community-actions">
        <button class="community-action">❤️ ${post.likes || 0}</button>
        <button class="community-action">💬 ${post.comments || 0}</button>
        <button class="community-action">🔗 分享</button>
      </div>
    </div>
  `).join('');
}

function showDiaryAdd() {
  document.getElementById('modal-diary-add').classList.remove('hidden');
}

function toggleFeeling(btn, feeling) {
  btn.classList.toggle('active');
  if (diaryFeelings.includes(feeling)) {
    diaryFeelings = diaryFeelings.filter(f => f !== feeling);
  } else {
    diaryFeelings.push(feeling);
  }
}

function setPrivacy(btn, isPublic) {
  diaryIsPublic = isPublic;
  document.querySelectorAll('.privacy-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function saveDiary() {
  const content = document.getElementById('diaryContent').value.trim();
  if (!content) {
    alert('写点什么吧');
    return;
  }

  Community.addPost({
    content,
    feelings: diaryFeelings,
    isPublic: diaryIsPublic,
    likes: 0,
    comments: 0
  });

  closeModal('modal-diary-add');
  document.getElementById('diaryContent').value = '';
  diaryFeelings = [];
  initCommunityPage();
  alert('日记已保存 📓');
}

// ==================== AI助手页 ====================
function initAssistantPage() {
  renderQuickQuestions();
  renderWelcomeMessage();
}

function renderWelcomeMessage() {
  const container = document.getElementById('assistantMessages');
  const { phase, day } = CycleEngine.getCurrentPhase();
  const phaseInfo = CycleEngine.getPhaseDetails(phase);

  container.innerHTML = `
    <div class="message bot">
      你好呀！我是你的健康助手 💕<br><br>
      你现在处于${phaseInfo.name}（周期第${day}天）。<br><br>
      ${phaseInfo.desc}<br><br>
      有什么想聊的吗？可以问我关于周期、饮食、运动、睡眠、情绪的问题～
    </div>
  `;
}

function renderQuickQuestions() {
  const questions = Assistant.getQuickQuestions();
  const container = document.getElementById('quickQuestions');

  container.innerHTML = questions.map(q => `
    <button class="quick-q" onclick="askAssistant('${q}')">${q}</button>
  `).join('');
}

function askAssistant(question) {
  document.getElementById('assistantInput').value = question;
  sendToAssistant();
}

function sendToAssistant() {
  const input = document.getElementById('assistantInput');
  const question = input.value.trim();
  if (!question) return;

  const container = document.getElementById('assistantMessages');

  // 添加用户消息
  container.innerHTML += `
    <div class="message user">${question}</div>
    <div class="message bot typing" id="typing">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;

  input.value = '';
  container.scrollTop = container.scrollHeight;

  // 模拟延迟回复
  setTimeout(() => {
    const typing = document.getElementById('typing');
    if (typing) typing.remove();

    const response = Assistant.getResponse(question);
    container.innerHTML += `
      <div class="message bot">${response}</div>
    `;
    container.scrollTop = container.scrollHeight;
  }, 1000);
}

// ==================== 弹窗 ====================
function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

// ==================== 初始化 ====================
function init() {
  // 显示启动页
  setTimeout(() => {
    document.getElementById('splash').style.display = 'none';
    document.getElementById('main').classList.remove('hidden');
    initHome();
  }, 1500);

  // 检查是否设置了周期
  const config = CycleEngine.getConfig();
  if (!config.periodStart) {
    setTimeout(() => {
      const dateStr = prompt('欢迎使用 SheCare！\n\n请设置最后一次月经开始日期 (YYYY-MM-DD)：',
        new Date().toISOString().split('T')[0]);
      if (dateStr) {
        config.periodStart = dateStr;
        CycleEngine.saveConfig(config);
        initHome();
      }
    }, 2000);
  }

  // 注册Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  // 快捷问题回车发送
  document.getElementById('assistantInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendToAssistant();
  });
}

// 启动应用
window.addEventListener('DOMContentLoaded', init);