import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HeatmapGrid } from '@/components/progress/HeatmapGrid';
import { StatCard } from '@/components/dashboard/StatCard';
import { 
  TrendingUp, 
  Clock, 
  Target, 
  Flame, 
  BookOpen,
  Calendar
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface ProgressStats {
  totalSessions: number;
  totalMinutes: number;
  avgAccuracy: number;
  currentStreak: number;
  bestStreak: number;
}

interface HeatmapData {
  date: string;
  value: number;
  label: string;
}

interface WeeklyData {
  day: string;
  accuracy: number;
  sessions: number;
}

const ProgressPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<ProgressStats>({
    totalSessions: 0,
    totalMinutes: 0,
    avgAccuracy: 0,
    currentStreak: 0,
    bestStreak: 0,
  });
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgressData = async () => {
      if (!user) return;

      try {
        // Fetch all sessions
        const { data: sessions } = await supabase
          .from('study_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('date_iso', { ascending: false });

        if (sessions) {
          // Calculate stats
          const totalSessions = sessions.length;
          const totalMinutes = sessions.reduce((sum, s) => sum + (s.minutes_spent || 0), 0);
          const avgAccuracy = totalSessions > 0
            ? sessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) / totalSessions
            : 0;

          setStats({
            totalSessions,
            totalMinutes,
            avgAccuracy,
            currentStreak: profile?.current_streak || 0,
            bestStreak: profile?.best_streak || 0,
          });

          // Generate heatmap data (last 30 days)
          const heatmap: HeatmapData[] = [];
          const today = new Date();
          
          for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const daySession = sessions.find(s => s.date_iso === dateStr);
            let value = 0;
            let label = 'Tidak belajar';
            
            if (daySession) {
              const modulesCompleted = 
                (daySession.sentence_done ? 1 : 0) +
                (daySession.verb_done ? 1 : 0) +
                (daySession.grammar_done ? 1 : 0);
              
              value = modulesCompleted + 1; // 1-4 based on modules
              label = `${modulesCompleted} modul, ${daySession.minutes_spent}m`;
            }
            
            heatmap.push({ date: dateStr, value, label });
          }
          setHeatmapData(heatmap);

          // Generate weekly chart data (last 7 days)
          const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
          const weekly: WeeklyData[] = [];
          
          for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayName = days[date.getDay()];
            
            const daySession = sessions.find(s => s.date_iso === dateStr);
            weekly.push({
              day: dayName,
              accuracy: daySession?.accuracy || 0,
              sessions: daySession ? 1 : 0,
            });
          }
          setWeeklyData(weekly);
        }
      } catch (error) {
        console.error('Error fetching progress:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, [user, profile]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Memuat progress...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-2xl font-bold text-foreground">Progress Belajar</h1>
        <p className="mb-6 text-muted-foreground">Pantau perkembangan belajarmu</p>

        {/* Stats Grid */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Total Sesi"
            value={stats.totalSessions}
            icon={BookOpen}
            variant="primary"
          />
          <StatCard
            title="Total Waktu"
            value={`${stats.totalMinutes} menit`}
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
            title="Streak Saat Ini"
            value={`${stats.currentStreak} hari`}
            icon={Flame}
            variant="warning"
          />
          <StatCard
            title="Best Streak"
            value={`${stats.bestStreak} hari`}
            icon={TrendingUp}
            variant="secondary"
          />
        </div>

        {/* Heatmap */}
        <Card className="mb-6 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Aktivitas 30 Hari Terakhir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HeatmapGrid data={heatmapData} days={30} />
          </CardContent>
        </Card>

        {/* Weekly Chart */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Akurasi Mingguan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis domain={[0, 100]} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value.toFixed(0)}%`, 'Akurasi']}
                  />
                  <Bar 
                    dataKey="accuracy" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProgressPage;
