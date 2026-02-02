import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
}

interface UserAchievement {
  achievement_id: string;
  unlocked_at: string;
}

const AchievementsPage: React.FC = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAchievements = async () => {
      if (!user) return;

      try {
        // Fetch all achievements
        const { data: allAchievements } = await supabase
          .from('achievements')
          .select('*')
          .order('created_at', { ascending: true });

        // Fetch user's unlocked achievements
        const { data: userUnlocked } = await supabase
          .from('user_achievements')
          .select('achievement_id, unlocked_at')
          .eq('user_id', user.id);

        setAchievements(allAchievements as Achievement[] || []);
        setUserAchievements(new Set(userUnlocked?.map(ua => ua.achievement_id) || []));
      } catch (error) {
        console.error('Error fetching achievements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, [user]);

  const unlockedCount = userAchievements.size;
  const totalCount = achievements.length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Memuat pencapaian...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-warning/20">
            <Trophy className="h-8 w-8 text-warning" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Pencapaian</h1>
          <p className="text-muted-foreground">
            {unlockedCount} dari {totalCount} pencapaian terbuka
          </p>
        </div>

        {/* Achievement Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((achievement) => {
            const isUnlocked = userAchievements.has(achievement.id);
            
            return (
              <Card
                key={achievement.id}
                className={cn(
                  'border-border transition-all duration-300',
                  isUnlocked 
                    ? 'bg-warning/5 border-warning/30' 
                    : 'bg-muted/30 opacity-60'
                )}
              >
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <div
                    className={cn(
                      'mb-4 flex h-16 w-16 items-center justify-center rounded-full text-3xl',
                      isUnlocked ? 'bg-warning/20' : 'bg-muted'
                    )}
                  >
                    {isUnlocked ? (
                      <span>{achievement.icon}</span>
                    ) : (
                      <Lock className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <h3 className={cn(
                    'mb-1 font-semibold',
                    isUnlocked ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {achievement.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {achievement.description}
                  </p>
                  {isUnlocked && (
                    <div className="mt-3 flex items-center gap-1 text-xs text-success">
                      <span>✓</span>
                      <span>Terbuka</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Motivational Message */}
        {unlockedCount < totalCount && (
          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              Terus belajar untuk membuka lebih banyak pencapaian! 🚀
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AchievementsPage;
