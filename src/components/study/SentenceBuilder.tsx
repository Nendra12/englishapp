import React, { useState, useMemo } from 'react';
import { sentenceTemplates, subjects, verbs, objects, shuffleArray } from '@/data/studyData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SentenceBuilderProps {
  onComplete: (correct: number, wrong: number) => void;
}

export const SentenceBuilder: React.FC<SentenceBuilderProps> = ({ onComplete }) => {
  const questions = useMemo(() => shuffleArray(sentenceTemplates, true).slice(0, 10), []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedVerb, setSelectedVerb] = useState<string | null>(null);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });

  const currentQuestion = questions[currentIndex];

  const checkAnswer = () => {
    const correct = 
      selectedSubject === currentQuestion.subject &&
      selectedVerb === currentQuestion.verb &&
      selectedObject === currentQuestion.object;
    
    setIsCorrect(correct);
    setShowResult(true);
    
    if (correct) {
      setScore(prev => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setScore(prev => ({ ...prev, wrong: prev.wrong + 1 }));
    }
  };

  const nextQuestion = () => {
    if (currentIndex + 1 >= questions.length) {
      onComplete(score.correct + (isCorrect ? 0 : 0), score.wrong);
      return;
    }
    
    setCurrentIndex(prev => prev + 1);
    setSelectedSubject(null);
    setSelectedVerb(null);
    setSelectedObject(null);
    setShowResult(false);
    setIsCorrect(false);
  };

  const resetSelection = () => {
    setSelectedSubject(null);
    setSelectedVerb(null);
    setSelectedObject(null);
  };

  // Pastikan jawaban yang benar selalu ada di pilihan
  const shuffledSubjects = useMemo(() => {
    const correctSubject = currentQuestion.subject;
    const otherSubjects = subjects.filter(s => s !== correctSubject);
    const randomOthers = shuffleArray(otherSubjects).slice(0, 5);
    return shuffleArray([correctSubject, ...randomOthers]);
  }, [currentIndex]);

  const shuffledVerbs = useMemo(() => {
    const correctVerb = currentQuestion.verb;
    const otherVerbs = verbs.filter(v => v !== correctVerb);
    const randomOthers = shuffleArray(otherVerbs).slice(0, 7);
    return shuffleArray([correctVerb, ...randomOthers]);
  }, [currentIndex]);

  const shuffledObjects = useMemo(() => {
    const correctObject = currentQuestion.object;
    const otherObjects = objects.filter(o => o !== correctObject);
    const randomOthers = shuffleArray(otherObjects).slice(0, 5);
    return shuffleArray([correctObject, ...randomOthers]);
  }, [currentIndex]);

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-sm">
          Soal {currentIndex + 1} / {questions.length}
        </Badge>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-success">✓ {score.correct}</span>
          <span className="text-destructive">✗ {score.wrong}</span>
        </div>
      </div>

      {/* Question */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Terjemahkan ke Bahasa Inggris:</p>
          <p className="mt-2 text-xl font-semibold text-foreground">{currentQuestion.translation}</p>
        </CardContent>
      </Card>

      {/* Answer Preview */}
      <div className="flex items-center justify-center gap-2 rounded-lg bg-muted p-4">
        <Badge variant={selectedSubject ? 'default' : 'outline'} className="text-base">
          {selectedSubject || 'Subject'}
        </Badge>
        <span className="text-muted-foreground">+</span>
        <Badge variant={selectedVerb ? 'secondary' : 'outline'} className="text-base">
          {selectedVerb || 'Verb'}
        </Badge>
        <span className="text-muted-foreground">+</span>
        <Badge variant={selectedObject ? 'default' : 'outline'} className="bg-accent text-accent-foreground text-base">
          {selectedObject || 'Object'}
        </Badge>
        <Button size="icon" variant="ghost" onClick={resetSelection} className="ml-2">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Chips Selection */}
      {!showResult && (
        <div className="space-y-4">
          {/* Subject */}
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">Subject (Subjek):</p>
            <div className="flex flex-wrap gap-2">
              {shuffledSubjects.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={selectedSubject === s ? 'default' : 'outline'}
                  onClick={() => setSelectedSubject(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>

          {/* Verb */}
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">Verb (Kata Kerja):</p>
            <div className="flex flex-wrap gap-2">
              {shuffledVerbs.map((v) => (
                <Button
                  key={v}
                  size="sm"
                  variant={selectedVerb === v ? 'secondary' : 'outline'}
                  onClick={() => setSelectedVerb(v)}
                  className={selectedVerb === v ? 'bg-secondary text-secondary-foreground' : ''}
                >
                  {v}
                </Button>
              ))}
            </div>
          </div>

          {/* Object */}
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">Object (Objek):</p>
            <div className="flex flex-wrap gap-2">
              {shuffledObjects.map((o) => (
                <Button
                  key={o}
                  size="sm"
                  variant={selectedObject === o ? 'default' : 'outline'}
                  onClick={() => setSelectedObject(o)}
                  className={selectedObject === o ? 'bg-accent text-accent-foreground' : ''}
                >
                  {o}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {showResult && (
        <Card className={cn(
          'border-2',
          isCorrect ? 'border-success bg-success/10' : 'border-destructive bg-destructive/10'
        )}>
          <CardContent className="flex items-center gap-4 p-4">
            {isCorrect ? (
              <CheckCircle2 className="h-8 w-8 text-success" />
            ) : (
              <XCircle className="h-8 w-8 text-destructive" />
            )}
            <div>
              <p className="font-semibold text-foreground">
                {isCorrect ? 'Benar! 🎉' : 'Salah!'}
              </p>
              <p className="text-sm text-muted-foreground">
                Jawaban: {currentQuestion.subject} {currentQuestion.verb} {currentQuestion.object}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!showResult ? (
          <Button
            className="flex-1"
            onClick={checkAnswer}
            disabled={!selectedSubject || !selectedVerb || !selectedObject}
          >
            Cek Jawaban
          </Button>
        ) : (
          <Button className="flex-1" onClick={nextQuestion}>
            {currentIndex + 1 >= questions.length ? 'Selesai' : 'Soal Berikutnya'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
