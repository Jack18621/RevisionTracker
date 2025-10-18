import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, FileText, ClipboardCheck, Settings, Trophy } from "lucide-react";
import { Header } from "@/components/Header";
import { PaperSelector } from "@/components/PaperSelector";
import { StudyModeCard } from "@/components/StudyModeCard";
import { SettingsModal } from "@/components/SettingsModal";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [selectedPaper, setSelectedPaper] = useState("paper1");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedSubtopic, setSelectedSubtopic] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const topics = ["Climate Change", "Coastal Landscapes", "River Landscapes"];
  const subtopics = ["Introduction", "Case Studies", "Management"];

  return (
    <div className="min-h-screen bg-gradient-background">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 pt-24 pb-12">
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          {/* Welcome Section */}
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
              Geography GCSE
            </h1>
            <p className="text-lg text-muted-foreground">
              Edexab Exam Board
            </p>
          </div>

          {/* Paper Selection */}
          <div className="space-y-4">
            <PaperSelector
              selectedPaper={selectedPaper}
              onPaperChange={setSelectedPaper}
            />
          </div>

          {/* Topic & Subtopic Selection */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Topic</label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full p-3 rounded-xl bg-card border-2 border-input hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary shadow-soft"
              >
                <option value="">Select a topic</option>
                {topics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Subtopic</label>
              <select
                value={selectedSubtopic}
                onChange={(e) => setSelectedSubtopic(e.target.value)}
                className="w-full p-3 rounded-xl bg-card border-2 border-input hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary shadow-soft"
                disabled={!selectedTopic}
              >
                <option value="">Select a subtopic</option>
                {subtopics.map((subtopic) => (
                  <option key={subtopic} value={subtopic}>
                    {subtopic}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Study Modes */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Study Modes</h2>
            
            <div className="space-y-4">
              <StudyModeCard
                icon={Brain}
                title="Quiz"
                description="Test your knowledge with multiple choice, true/false, and more"
                onClick={() => navigate("/quiz")}
              />
              
              <StudyModeCard
                icon={FileText}
                title="Define"
                description="Learn key terms and definitions"
                onClick={() => navigate("/define")}
              />
              
              <StudyModeCard
                icon={ClipboardCheck}
                title="Exam"
                description="Practice exam-style questions with manual marking"
                onClick={() => navigate("/exam")}
              />

              <StudyModeCard
                icon={Trophy}
                title="Mastery Mode"
                description="Adaptive learning that focuses on your weak areas"
                onClick={() => navigate("/mastery")}
              />
            </div>
          </div>

          {/* Settings Button */}
          <div className="flex justify-center pt-8">
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-6 py-3 bg-card hover:bg-secondary rounded-xl shadow-soft hover:shadow-medium transition-all duration-300 hover:scale-105"
            >
              <Settings className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">Settings</span>
            </button>
          </div>
        </div>
      </main>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
};

export default Dashboard;
