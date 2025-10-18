import { X, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const [shuffle, setShuffle] = useState(true);
  const [questionsPerSession, setQuestionsPerSession] = useState(10);
  const [soundEffects, setSoundEffects] = useState(true);

  useEffect(() => {
    const savedSettings = localStorage.getItem("studySettings");
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setShuffle(settings.shuffle ?? true);
      setQuestionsPerSession(settings.questionsPerSession ?? 10);
      setSoundEffects(settings.soundEffects ?? true);
    }
  }, [isOpen]);

  const saveSettings = () => {
    const settings = { shuffle, questionsPerSession, soundEffects };
    localStorage.setItem("studySettings", JSON.stringify(settings));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm animate-fade-in">
      <div className="bg-card rounded-2xl shadow-strong max-w-md w-full animate-scale-in border border-border">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-foreground">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="shuffle" className="text-base font-medium">
              Shuffle Questions
            </Label>
            <Switch
              id="shuffle"
              checked={shuffle}
              onCheckedChange={setShuffle}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="questions" className="text-base font-medium">
              Questions per Session
            </Label>
            <Input
              id="questions"
              type="number"
              min="1"
              max="50"
              value={questionsPerSession}
              onChange={(e) => setQuestionsPerSession(Number(e.target.value))}
              className="max-w-[120px]"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-muted-foreground" />
              <Label htmlFor="sound" className="text-base font-medium">
                Sound Effects
              </Label>
            </div>
            <Switch
              id="sound"
              checked={soundEffects}
              onCheckedChange={setSoundEffects}
            />
          </div>
        </div>

        <div className="p-6 border-t border-border">
          <button
            onClick={saveSettings}
            className="w-full bg-gradient-primary text-primary-foreground font-semibold py-3 px-6 rounded-xl shadow-medium hover:shadow-strong transition-all duration-300 hover:scale-[1.02]"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
