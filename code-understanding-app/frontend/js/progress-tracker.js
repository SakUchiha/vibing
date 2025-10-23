/**
 * Progress Tracking System for KidLearner
 * Tracks user learning progress, achievements, and statistics
 */
class ProgressTracker {
  constructor() {
    this.storageKey = 'kidlearner_progress';
    this.achievements = {
      first_lesson: { name: 'First Steps', description: 'Completed your first lesson', icon: '🎯' },
      code_master: { name: 'Code Master', description: 'Completed 5 lessons', icon: '👑' },
      ai_helper: { name: 'AI Assistant', description: 'Asked AI for help 10 times', icon: '🤖' },
      validator: { name: 'Code Validator', description: 'Validated code 20 times', icon: '✅' },
      streak_7: { name: 'Week Warrior', description: '7-day learning streak', icon: '🔥' },
      editor_pro: { name: 'Editor Pro', description: 'Saved 10 code files', icon: '💾' }
    };
    this.init();
  }

  init() {
    if (!this.getProgress()) {
      this.resetProgress();
    }
  }

  getProgress() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey)) || null;
    } catch (e) {
      console.error('Error loading progress:', e);
      return null;
    }
  }

  saveProgress(progress) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(progress));
    } catch (e) {
      console.error('Error saving progress:', e);
    }
  }

  resetProgress() {
    const initialProgress = {
      lessonsCompleted: [],
      totalLessons: 0,
      aiInteractions: 0,
      codeValidations: 0,
      filesSaved: 0,
      lastActiveDate: new Date().toISOString().split('T')[0],
      currentStreak: 0,
      longestStreak: 0,
      achievements: [],
      timeSpent: 0, // in minutes
      startDate: new Date().toISOString()
    };
    this.saveProgress(initialProgress);
  }

  completeLesson(lessonId) {
    const progress = this.getProgress();
    if (!progress.lessonsCompleted.includes(lessonId)) {
      progress.lessonsCompleted.push(lessonId);
      progress.totalLessons = progress.lessonsCompleted.length;
      this.updateStreak();
      this.checkAchievements(progress);
      this.saveProgress(progress);
    }
  }

  incrementAIInteractions() {
    const progress = this.getProgress();
    progress.aiInteractions++;
    this.checkAchievements(progress);
    this.saveProgress(progress);
  }

  incrementValidations() {
    const progress = this.getProgress();
    progress.codeValidations++;
    this.checkAchievements(progress);
    this.saveProgress(progress);
  }

  incrementFilesSaved() {
    const progress = this.getProgress();
    progress.filesSaved++;
    this.checkAchievements(progress);
    this.saveProgress(progress);
  }

  updateStreak() {
    const progress = this.getProgress();
    const today = new Date().toISOString().split('T')[0];
    const lastActive = progress.lastActiveDate;

    if (lastActive === today) {
      // Already active today
      return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastActive === yesterdayStr) {
      // Consecutive day
      progress.currentStreak++;
      if (progress.currentStreak > progress.longestStreak) {
        progress.longestStreak = progress.currentStreak;
      }
    } else {
      // Streak broken
      progress.currentStreak = 1;
    }

    progress.lastActiveDate = today;
    this.checkAchievements(progress);
    this.saveProgress(progress);
  }

  checkAchievements(progress) {
    const newAchievements = [];

    // First lesson achievement
    if (progress.totalLessons >= 1 && !progress.achievements.includes('first_lesson')) {
      newAchievements.push('first_lesson');
    }

    // Code master achievement
    if (progress.totalLessons >= 5 && !progress.achievements.includes('code_master')) {
      newAchievements.push('code_master');
    }

    // AI helper achievement
    if (progress.aiInteractions >= 10 && !progress.achievements.includes('ai_helper')) {
      newAchievements.push('ai_helper');
    }

    // Validator achievement
    if (progress.codeValidations >= 20 && !progress.achievements.includes('validator')) {
      newAchievements.push('validator');
    }

    // Streak achievement
    if (progress.currentStreak >= 7 && !progress.achievements.includes('streak_7')) {
      newAchievements.push('streak_7');
    }

    // Editor pro achievement
    if (progress.filesSaved >= 10 && !progress.achievements.includes('editor_pro')) {
      newAchievements.push('editor_pro');
    }

    if (newAchievements.length > 0) {
      progress.achievements.push(...newAchievements);
      this.showAchievementNotification(newAchievements);
    }
  }

  showAchievementNotification(achievementIds) {
    achievementIds.forEach(id => {
      const achievement = this.achievements[id];
      if (achievement) {
        // Simple notification (could be enhanced with a proper toast system)
        setTimeout(() => {
          alert(`🏆 Achievement Unlocked!\n\n${achievement.icon} ${achievement.name}\n${achievement.description}`);
        }, 1000);
      }
    });
  }

  getStats() {
    const progress = this.getProgress();
    return {
      lessonsCompleted: progress.totalLessons,
      aiInteractions: progress.aiInteractions,
      codeValidations: progress.codeValidations,
      filesSaved: progress.filesSaved,
      currentStreak: progress.currentStreak,
      longestStreak: progress.longestStreak,
      achievementsCount: progress.achievements.length,
      totalAchievements: Object.keys(this.achievements).length,
      achievements: progress.achievements.map(id => this.achievements[id])
    };
  }

  addTimeSpent(minutes) {
    const progress = this.getProgress();
    progress.timeSpent += minutes;
    this.saveProgress(progress);
  }

  isLessonCompleted(lessonId) {
    const progress = this.getProgress();
    return progress.lessonsCompleted.includes(lessonId);
  }

  exportProgress() {
    return this.getProgress();
  }

  importProgress(progressData) {
    try {
      this.saveProgress(progressData);
      return true;
    } catch (e) {
      console.error('Error importing progress:', e);
      return false;
    }
  }
}

// Initialize global progress tracker
const progressTracker = new ProgressTracker();