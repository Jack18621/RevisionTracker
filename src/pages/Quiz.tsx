import { useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle, XCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";

// Mock quiz questions
const mockQuestions = [
  {
    id: 1,
    type: "mcq",
    question: "What is the main cause of coastal erosion?",
    options: ["Wave action", "Wind", "Rain", "Snow"],
    correctAnswer: 0,
    explanation: "Wave action is the primary force that causes coastal erosion through hydraulic action and abrasion.",
  },
  {
    id: 2,
    type: "true-false",
    question: "Climate change is causing sea levels to rise.",
    correctAnswer: true,
    explanation: "Global warming causes thermal expansion of water and melting of ice caps, leading to rising sea levels.",
  },
];

const Quiz = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const question = mockQuestions[currentQuestion];
  const isCorrect = selectedAnswer === question.correctAnswer;

  const handleSubmit = () => {
    setShowResult(true);
    if (isCorrect) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < mockQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const progress = ((currentQuestion + 1) / mockQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-background">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 pt-24 pb-12">
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Question {currentQuestion + 1} of {mockQuestions.length}</span>
              <span>Score: {score}/{mockQuestions.length}</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-card rounded-2xl shadow-strong p-6 sm:p-8 space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              {question.question}
            </h2>

            {/* MCQ Options */}
            {question.type === "mcq" && (
              <div className="space-y-3">
                {question.options?.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => !showResult && setSelectedAnswer(index)}
                    disabled={showResult}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                      selectedAnswer === index
                        ? "border-primary bg-secondary shadow-medium"
                        : "border-border hover:border-primary/50 hover:bg-secondary/50"
                    } ${showResult && index === question.correctAnswer ? "border-green-500 bg-green-50" : ""} ${
                      showResult && selectedAnswer === index && !isCorrect ? "border-red-500 bg-red-50" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{option}</span>
                      {showResult && index === question.correctAnswer && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                      {showResult && selectedAnswer === index && !isCorrect && (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* True/False Options */}
            {question.type === "true-false" && (
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
                    } ${showResult && value === question.correctAnswer ? "border-green-500 bg-green-50" : ""} ${
                      showResult && selectedAnswer === value && !isCorrect ? "border-red-500 bg-red-50" : ""
                    }`}
                  >
                    {value ? "True" : "False"}
                  </button>
                ))}
              </div>
            )}

            {/* Explanation */}
            {showResult && (
              <div className="p-4 rounded-xl bg-secondary border-2 border-primary/20 animate-scale-in">
                <p className="text-sm font-medium text-muted-foreground mb-1">Explanation:</p>
                <p className="text-foreground">{question.explanation}</p>
              </div>
            )}

            {/* Submit Button */}
            {!showResult && selectedAnswer !== null && (
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
              disabled={currentQuestion === 0}
              variant="outline"
              className="flex items-center gap-2 rounded-xl"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={currentQuestion === mockQuestions.length - 1 || !showResult}
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

export default Quiz;
