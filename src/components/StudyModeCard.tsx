import { LucideIcon } from "lucide-react";

interface StudyModeCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  gradient?: string;
}

export const StudyModeCard = ({
  icon: Icon,
  title,
  description,
  onClick,
}: StudyModeCardProps) => {
  return (
    <button
      onClick={onClick}
      className="group relative w-full bg-card hover:bg-gradient-card rounded-2xl p-6 sm:p-8 shadow-soft hover:shadow-strong transition-all duration-300 hover:scale-[1.02] border-2 border-transparent hover:border-primary/20 text-left"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 sm:p-4 rounded-xl bg-gradient-primary shadow-medium group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">{title}</h3>
          <p className="text-sm sm:text-base text-muted-foreground">{description}</p>
        </div>
      </div>
    </button>
  );
};
