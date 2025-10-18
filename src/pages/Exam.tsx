import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

// Mock exam questions
const mockExamQuestions = [
  {
    id: 1,
    question: "Explain how wave action causes coastal erosion.",
    marks: 4,
    image: null,
  },
  {
    id: 2,
    question: "Describe and explain the formation of a waterfall.",
    marks: 6,
    image: null,
  },
  {
    id: 3,
    question: "Using a named example, explain how coastal management can reduce erosion.",
    marks: 9,
    image: null,
  },
];

const Exam = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [markedPoints, setMarkedPoints] = useState<number[]>([]);

  const question = mockExamQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / mockExamQuestions.length) * 100;
  const totalMarks = markedPoints.length;

  const handleNext = () => {
    if (currentQuestion < mockExamQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setUserAnswer("");
      setMarkedPoints([]);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setUserAnswer("");
      setMarkedPoints([]);
    }
  };

  const toggleMark = (index: number) => {
    if (markedPoints.includes(index)) {
      setMarkedPoints(markedPoints.filter((m) => m !== index));
    } else {
      setMarkedPoints([...markedPoints, index]);
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
              <span>Question {currentQuestion + 1} of {mockExamQuestions.length}</span>
              <span>Marks: {totalMarks}/{question.marks}</span>
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
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground flex-1">
                  {question.question}
                </h2>
                <span className="text-lg font-bold text-primary shrink-0">
                  [{question.marks} marks]
                </span>
              </div>
            </div>

            {/* Answer Area */}
            <Textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Write your answer here..."
              className="min-h-[250px] text-base resize-none"
            />

            {/* Manual Marking */}
            <div className="p-4 rounded-xl bg-secondary border-2 border-border space-y-3">
              <p className="text-sm font-medium text-foreground">Mark your answer:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Array.from({ length: question.marks }, (_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-card transition-colors"
                  >
                    <Checkbox
                      id={`mark-${i}`}
                      checked={markedPoints.includes(i)}
                      onCheckedChange={() => toggleMark(i)}
                    />
                    <label
                      htmlFor={`mark-${i}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      Point {i + 1}
                    </label>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-border">
                <p className="text-lg font-bold text-primary">
                  Total: {totalMarks} / {question.marks}
                </p>
              </div>
            </div>
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
              disabled={currentQuestion === mockExamQuestions.length - 1}
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

export default Exam;
