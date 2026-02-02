import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StreakBadge } from '@/components/dashboard/StreakBadge';
import { ProgressBar } from '@/components/dashboard/ProgressBar';
import { StatCard } from '@/components/dashboard/StatCard';
import { 
  BookOpen, 
  Play, 
  Clock, 
  Target, 
  Trophy, 
  Flame,
  Sparkles,
  PenLine,
  Languages,
  BookA
} from 'lucide-react';

interface DashboardStats {
  totalSessions: number;
  totalMinutes: number;
  avgAccuracy: number;
  currentStreak: number;
  bestStreak: number;
  todayProgress: {
    sentenceDone: boolean;
    verbDone: boolean;
    grammarDone: boolean;
  };
  recentAchievements: Array<{ id: string; title: string; icon: string }>;
}

const Dashboard: React.FC = () => {
  const { profile, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalSessions: 0,
    totalMinutes: 0,
    avgAccuracy: 0,
    currentStreak: 0,
    bestStreak: 0,
    todayProgress: { sentenceDone: false, verbDone: false, grammarDone: false },
    recentAchievements: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        // Fetch study sessions summary
        const { data: sessions } = await supabase
          .from('study_sessions')
          .select('*')
          .eq('user_id', user.id);

        // Today's session
        const today = new Date().toISOString().split('T')[0];
        const todaySession = sessions?.find(s => s.date_iso === today);

        // Calculate stats
        const totalSessions = sessions?.length || 0;
        const totalMinutes = sessions?.reduce((sum, s) => sum + (s.minutes_spent || 0), 0) || 0;
        const avgAccuracy = totalSessions > 0
          ? (sessions?.reduce((sum, s) => sum + (s.accuracy || 0), 0) || 0) / totalSessions
          : 0;

        // Fetch recent achievements
        const { data: userAchievements } = await supabase
          .from('user_achievements')
          .select('*, achievements(*)')
          .eq('user_id', user.id)
          .order('unlocked_at', { ascending: false })
          .limit(3);

        setStats({
          totalSessions,
          totalMinutes,
          avgAccuracy,
          currentStreak: profile?.current_streak || 0,
          bestStreak: profile?.best_streak || 0,
          todayProgress: {
            sentenceDone: todaySession?.sentence_done || false,
            verbDone: todaySession?.verb_done || false,
            grammarDone: todaySession?.grammar_done || false,
          },
          recentAchievements: userAchievements?.map(ua => ({
            id: ua.achievement_id,
            title: (ua.achievements as any)?.title || '',
            icon: (ua.achievements as any)?.icon || '🏆',
          })) || [],
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    refreshProfile();
  }, [user, refreshProfile, profile?.current_streak, profile?.best_streak]);

  const todayModulesCompleted = 
    (stats.todayProgress.sentenceDone ? 1 : 0) +
    (stats.todayProgress.verbDone ? 1 : 0) +
    (stats.todayProgress.grammarDone ? 1 : 0);
  const todayProgressPercent = (todayModulesCompleted / 3) * 100;

  const focusModules = [
    { 
      icon: PenLine, 
      title: 'Sentence Builder', 
      desc: 'Susun kalimat S + V + O',
      done: stats.todayProgress.sentenceDone,
      color: 'bg-primary/10 text-primary'
    },
    { 
      icon: Languages, 
      title: 'Verb Drill', 
      desc: 'Latihan Verb 1/2/3',
      done: stats.todayProgress.verbDone,
      color: 'bg-secondary/10 text-secondary'
    },
    { 
      icon: BookA, 
      title: 'Grammar Quiz', 
      desc: 'is/am/are + a/an/the',
      done: stats.todayProgress.grammarDone,
      color: 'bg-accent/10 text-accent'
    },
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Sparkles className="mx-auto h-8 w-8 animate-pulse text-primary" />
          <p className="mt-2 text-muted-foreground">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
            Halo, {profile?.display_name || 'Learner'} 👋
          </h1>
          <p className="text-muted-foreground">Yuk lanjut belajar hari ini!</p>
        </div>
        <StreakBadge streak={stats.currentStreak} size="lg" />
      </div>

      {/* Today's Progress */}
      <Card className="mb-6 border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-primary" />
            Progress Hari Ini
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressBar 
            value={todayProgressPercent} 
            label={`${todayModulesCompleted}/3 modul selesai`}
            variant="success"
            size="lg"
          />
        </CardContent>
      </Card>

      {/* Today's Focus */}
      <div className="mb-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Focus Hari Ini</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {focusModules.map((module) => (
            <Card 
              key={module.title}
              className={`card-hover cursor-pointer border-border ${module.done ? 'opacity-60' : ''}`}
              onClick={() => !module.done && navigate('/app/session')}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${module.color}`}>
                  <module.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{module.title}</p>
                  <p className="text-xs text-muted-foreground">{module.desc}</p>
                </div>
                {module.done && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success text-success-foreground">
                    ✓
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Start Session Button */}
      <Button 
        size="lg" 
        className="mb-8 w-full gradient-primary text-primary-foreground shadow-lg hover:opacity-90"
        onClick={() => navigate('/app/session')}
      >
        <Play className="mr-2 h-5 w-5" />
        Mulai Sesi Belajar
      </Button>

      {/* Stats Grid */}
      <h2 className="mb-4 text-lg font-semibold text-foreground">Statistik</h2>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Sesi"
          value={stats.totalSessions}
          icon={BookOpen}
          variant="primary"
        />
        <StatCard
          title="Total Waktu"
          value={`${stats.totalMinutes}m`}
          icon={Clock}
          variant="accent"
        />
        <StatCard
          title="Rata-rata Akurasi"
          value={`${Math.round(stats.avgAccuracy)}%`}
          icon={Target}
          variant="success"
        />
        <StatCard
          title="Best Streak"
          value={stats.bestStreak}
          subtitle="hari"
          icon={Flame}
          variant="warning"
        />
      </div>

      {/* Recent Achievements */}
      {stats.recentAchievements.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Pencapaian Terbaru</h2>
          <div className="flex flex-wrap gap-3">
            {stats.recentAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-center gap-2 rounded-full bg-secondary/50 px-4 py-2"
              >
                <span className="text-xl">{achievement.icon}</span>
                <span className="text-sm font-medium text-foreground">{achievement.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
