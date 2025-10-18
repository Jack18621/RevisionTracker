import { useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// Mock define questions
const mockTerms = [
  {
    id: 1,
    term: "Erosion",
    acceptableAnswers: [
      "The wearing away of rock and soil by natural forces",
      "Process of rock and soil being worn down",
      "Breakdown and removal of material by natural forces",
    ],
  },
  {
    id: 2,
    term: "Longshore Drift",
    acceptableAnswers: [
      "Movement of sediment along a coastline",
      "Transportation of material along the coast by waves",
      "Process where waves move sediment along the beach",
    ],
  },
];

const Define = () => {
  const [currentTerm, setCurrentTerm] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [markedCorrect, setMarkedCorrect] = useState(false);

  const term = mockTerms[currentTerm];
  const progress = ((currentTerm + 1) / mockTerms.length) * 100;

  const handleSubmit = () => {
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentTerm < mockTerms.length - 1) {
      setCurrentTerm(currentTerm + 1);
      setUserAnswer("");
      setShowResult(false);
      setMarkedCorrect(false);
    }
  };

  const handlePrevious = () => {
    if (currentTerm > 0) {
      setCurrentTerm(currentTerm - 1);
      setUserAnswer("");
      setShowResult(false);
      setMarkedCorrect(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 pt-24 pb-12">
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Term {currentTerm + 1} of {mockTerms.length}</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Term Card */}
          <div className="bg-card rounded-2xl shadow-strong p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground font-medium">Define the term:</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-primary">
                {term.term}
              </h2>
            </div>

            <Textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type your definition here..."
              className="min-h-[150px] text-base resize-none"
              disabled={showResult}
            />

            {/* Show Acceptable Answers */}
            {showResult && (
              <div className="space-y-4 animate-scale-in">
                <div className="p-4 rounded-xl bg-secondary border-2 border-primary/20">
                  <p className="text-sm font-medium text-muted-foreground mb-3">
                    Acceptable answers:
                  </p>
                  <ul className="space-y-2">
                    {term.acceptableAnswers.map((answer, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-foreground">{answer}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <p className="text-sm text-muted-foreground">
                    Was your answer correct?
                  </p>
                  <Button
                    onClick={() => setMarkedCorrect(!markedCorrect)}
                    variant={markedCorrect ? "default" : "outline"}
                    className={markedCorrect ? "bg-gradient-primary" : ""}
                  >
                    {markedCorrect ? "Marked Correct ✓" : "Mark as Correct"}
                  </Button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            {!showResult && userAnswer.trim() && (
              <Button
                onClick={handleSubmit}
                className="w-full bg-gradient-primary text-primary-foreground font-semibold py-3 px-6 rounded-xl shadow-medium hover:shadow-strong transition-all duration-300 hover:scale-[1.02]"
              >
                Check Answer
              </Button>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              onClick={handlePrevious}
              disabled={currentTerm === 0}
              variant="outline"
              className="flex items-center gap-2 rounded-xl"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={currentTerm === mockTerms.length - 1 || !showResult}
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

export default Define;
