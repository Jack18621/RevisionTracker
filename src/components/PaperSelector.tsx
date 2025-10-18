import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface PaperSelectorProps {
  selectedPaper: string;
  onPaperChange: (paper: string) => void;
}

const papers = [
  { id: "paper1", name: "Paper 1", description: "The Physical Environment" },
  { id: "paper2", name: "Paper 2", description: "The Human Environment" },
  { id: "paper3", name: "Paper 3", description: "Geographical Applications" },
];

export const PaperSelector = ({ selectedPaper, onPaperChange }: PaperSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const selected = papers.find((p) => p.id === selectedPaper);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-card hover:bg-gradient-card shadow-soft hover:shadow-medium rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] border-2 border-transparent hover:border-primary/20"
      >
        <div className="flex items-center justify-between">
          <div className="text-left">
            <p className="text-sm text-muted-foreground font-medium mb-1">Select Paper</p>
            <h3 className="text-2xl font-bold text-foreground">{selected?.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{selected?.description}</p>
          </div>
          <ChevronDown
            className={`w-6 h-6 text-primary transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-card rounded-2xl shadow-strong border border-border overflow-hidden animate-scale-in">
          {papers.map((paper) => (
            <button
              key={paper.id}
              onClick={() => {
                onPaperChange(paper.id);
                setIsOpen(false);
              }}
              className={`w-full p-4 text-left hover:bg-secondary transition-colors duration-200 ${
                paper.id === selectedPaper ? "bg-secondary" : ""
              }`}
            >
              <h4 className="font-bold text-foreground">{paper.name}</h4>
              <p className="text-sm text-muted-foreground">{paper.description}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
