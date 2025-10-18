interface MasteryIndicatorProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export const MasteryIndicator = ({ score, size = "md", showLabel = true }: MasteryIndicatorProps) => {
  const getColor = () => {
    if (score >= 85) return "text-green-600 bg-green-100 border-green-300";
    if (score >= 50) return "text-amber-600 bg-amber-100 border-amber-300";
    return "text-red-600 bg-red-100 border-red-300";
  };

  const getGradientColor = () => {
    if (score >= 85) return "from-green-500 to-green-600";
    if (score >= 50) return "from-amber-500 to-amber-600";
    return "from-red-500 to-red-600";
  };

  const getLabel = () => {
    if (score >= 85) return "Mastered";
    if (score >= 50) return "Learning";
    return "Needs Work";
  };

  const sizeClasses = {
    sm: "w-16 h-16 text-xs",
    md: "w-20 h-20 text-sm",
    lg: "w-28 h-28 text-base",
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`${sizeClasses[size]} relative`}>
        {/* Background circle */}
        <svg className="transform -rotate-90 w-full h-full">
          <circle
            cx="50%"
            cy="50%"
            r="40%"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-secondary"
          />
          {/* Progress circle */}
          <circle
            cx="50%"
            cy="50%"
            r="40%"
            stroke="url(#gradient)"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 40}`}
            strokeDashoffset={`${2 * Math.PI * 40 * (1 - score / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" className={getGradientColor().split(" ")[0]} stopColor="currentColor" />
              <stop offset="100%" className={getGradientColor().split(" ")[1]} stopColor="currentColor" />
            </linearGradient>
          </defs>
        </svg>

        {/* Percentage text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold ${getColor()}`}>{Math.round(score)}%</span>
        </div>
      </div>

      {showLabel && (
        <span className={`font-medium px-3 py-1 rounded-full border-2 ${getColor()}`}>
          {getLabel()}
        </span>
      )}
    </div>
  );
};
