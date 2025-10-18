import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ConfidenceRating } from "@/components/ConfidenceRating";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Question {
  id: string;
  question_type: string;
  question_text: string;
  options?: any;
  correct_answer: any;
  explanation?: string;
  paper_id: string;
  topic: string;
  subtopic: string;
}

interface UserProgress {
  question_id: string;
  mastery_score: number;
}

const MasteryMode = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [userProgress, setUserProgress] = useState<Record<string, UserProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadQuestionsAndProgress();
    }
  }, [user]);

  const loadQuestionsAndProgress = async () => {
    try {
      // Load questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .in("question_type", ["mcq", "true-false"]);

      if (questionsError) throw questionsError;

      // Load user progress
      const { data: progressData, error: progressError } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user!.id);

      if (progressError) throw progressError;

      // Create progress map
      const progressMap: Record<string, UserProgress> = {};
      progressData?.forEach((p) => {
        progressMap[p.question_id] = {
          question_id: p.question_id,
          mastery_score: Number(p.mastery_score),
        };
      });

      setUserProgress(progressMap);

      // Sort questions by mastery score (lowest first - adaptive learning!)
      const sortedQuestions = (questionsData || []).sort((a, b) => {
        const scoreA = progressMap[a.id]?.mastery_score || 0;
        const scoreB = progressMap[b.id]?.mastery_score || 0;
        return scoreA - scoreB;
      });

      setQuestions(sortedQuestions);
      setLoading(false);
    } catch (error: any) {
      toast.error("Failed to load questions");
      console.error(error);
      setLoading(false);
    }
  };

  const calculateMasteryChange = (isCorrect: boolean, confidenceLevel: number) => {
    // Adaptive mastery algorithm
    let change = 0;
    
    if (isCorrect) {
      // Correct answer: increase based on confidence
      // High confidence + correct = bigger boost
      change = 10 + (confidenceLevel * 3);
    } else {
      // Wrong answer: decrease based on confidence
      // High confidence + wrong = bigger penalty (overconfident)
      change = -(15 + (confidenceLevel * 2));
    }

    return change;
  };

  const handleSubmit = async () => {
    if (confidence === 0) {
      toast.error("Please rate your confidence level");
      return;
    }

    const question = questions[currentIndex];
    const isCorrect = selectedAnswer === question.correct_answer || 
      (typeof question.correct_answer === 'string' && selectedAnswer?.toString() === question.correct_answer);

    const currentMastery = userProgress[question.id]?.mastery_score || 0;
    const masteryChange = calculateMasteryChange(isCorrect, confidence);
    const newMastery = Math.max(0, Math.min(100, currentMastery + masteryChange));

    try {
      // Update user progress
      const { error } = await supabase.from("user_progress").upsert({
        user_id: user!.id,
        question_id: question.id,
        mastery_score: newMastery,
        total_attempts: (userProgress[question.id]?.["total_attempts" as any] || 0) + 1,
        correct_attempts: (userProgress[question.id]?.["correct_attempts" as any] || 0) + (isCorrect ? 1 : 0),
        last_answered_at: new Date().toISOString(),
        confidence_level: confidence,
      });

      if (error) throw error;

      // Update local state
      setUserProgress({
        ...userProgress,
        [question.id]: {
          question_id: question.id,
          mastery_score: newMastery,
        },
      });

      setShowResult(true);
      toast.success(
        isCorrect 
          ? `Correct! Mastery: ${Math.round(newMastery)}% (+${Math.round(masteryChange)})`
          : `Incorrect. Mastery: ${Math.round(newMastery)}% (${Math.round(masteryChange)})`
      );
    } catch (error: any) {
      toast.error("Failed to save progress");
      console.error(error);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setConfidence(0);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setConfidence(0);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-background">
        <Header />
        <div className="container mx-auto px-4 pt-24 text-center">
          <p className="text-muted-foreground">No questions available yet.</p>
        </div>
      </div>
    );
  }

  const question = questions[currentIndex];
  const currentMastery = userProgress[question.id]?.mastery_score || 0;
  const isCorrect = selectedAnswer === question.correct_answer ||
    (typeof question.correct_answer === 'string' && selectedAnswer?.toString() === question.correct_answer);

  // Calculate overall progress
  const totalMastery = Object.values(userProgress).reduce((sum, p) => sum + p.mastery_score, 0);
  const avgMastery = userProgress && Object.keys(userProgress).length > 0 
    ? totalMastery / Object.keys(userProgress).length 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-background">
      <Header />

      <main className="container mx-auto px-4 sm:px-6 pt-24 pb-12">
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
          {/* Mastery Header */}
          <div className="bg-card rounded-2xl shadow-medium p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-primary shadow-medium">
                  <Trophy className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Mastery Mode</h2>
                  <p className="text-sm text-muted-foreground">
                    Adaptive learning • Question {currentIndex + 1} of {questions.length}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Overall Progress</p>
                <p className="text-2xl font-bold text-primary">{Math.round(avgMastery)}%</p>
              </div>
            </div>

            {/* Current Question Mastery */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">This Question Mastery</span>
                <span className="text-lg font-bold text-primary">{Math.round(currentMastery)}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    currentMastery >= 85 ? "bg-green-500" : currentMastery >= 50 ? "bg-amber-500" : "bg-red-500"
                  }`}
                  style={{ width: `${currentMastery}%` }}
                />
              </div>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-card rounded-2xl shadow-strong p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span className="px-2 py-1 rounded bg-secondary">{question.paper_id}</span>
                <span className="px-2 py-1 rounded bg-secondary">{question.topic}</span>
                <span className="px-2 py-1 rounded bg-secondary">{question.subtopic}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                {question.question_text}
              </h2>
            </div>

            {/* MCQ Options */}
            {question.question_type === "mcq" && question.options && (
              <div className="space-y-3">
                {JSON.parse(question.options as any).map((option: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => !showResult && setSelectedAnswer(index)}
                    disabled={showResult}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                      selectedAnswer === index
                        ? "border-primary bg-secondary shadow-medium"
                        : "border-border hover:border-primary/50 hover:bg-secondary/50"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {/* True/False Options */}
            {question.question_type === "true-false" && (
              <div className="grid sm:grid-cols-2 gap-4">
                {[true, false].map((value) => (
                  <button
                    key={String(value)}
                    onClick={() => !showResult && setSelectedAnswer(value)}
                    disabled={showResult}
                    className={`p-6 rounded-xl border-2 text-center font-bold text-lg transition-all duration-300 ${
                      selectedAnswer === value
                        ? "border-primary bg-secondary shadow-medium"
                        : "border-border hover:border-primary/50 hover:bg-secondary/50"
                    }`}
                  >
                    {value ? "True" : "False"}
                  </button>
                ))}
              </div>
            )}

            {/* Confidence Rating - Show after selecting answer, before submitting */}
            {selectedAnswer !== null && !showResult && (
              <ConfidenceRating value={confidence} onChange={setConfidence} />
            )}

            {/* Explanation - Show after submitting */}
            {showResult && question.explanation && (
              <div className={`p-4 rounded-xl border-2 animate-scale-in ${
                isCorrect ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"
              }`}>
                <p className="text-sm font-medium mb-1">
                  {isCorrect ? "✓ Correct!" : "✗ Incorrect"}
                </p>
                <p className="text-sm text-foreground">{question.explanation}</p>
              </div>
            )}

            {/* Submit Button */}
            {!showResult && selectedAnswer !== null && confidence > 0 && (
              <Button
                onClick={handleSubmit}
                className="w-full bg-gradient-primary text-primary-foreground font-semibold py-3 px-6 rounded-xl shadow-medium hover:shadow-strong transition-all duration-300 hover:scale-[1.02]"
              >
                Submit Answer
              </Button>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              variant="outline"
              className="flex items-center gap-2 rounded-xl"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </Button>

            <Button
              onClick={handleNext}
              disabled={currentIndex === questions.length - 1 || !showResult}
              className="flex items-center gap-2 bg-gradient-primary rounded-xl"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MasteryMode;
