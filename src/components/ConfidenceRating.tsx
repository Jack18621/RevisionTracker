import { Star } from "lucide-react";

interface ConfidenceRatingProps {
  value: number;
  onChange: (value: number) => void;
}

export const ConfidenceRating = ({ value, onChange }: ConfidenceRatingProps) => {
  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-secondary rounded-xl">
      <p className="text-sm font-medium text-muted-foreground">
        How confident are you in this answer?
      </p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            onClick={() => onChange(rating)}
            className="transition-transform duration-200 hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${
                rating <= value
                  ? "fill-amber-400 text-amber-400"
                  : "text-border"
              }`}
            />
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {value === 0 && "Select your confidence level"}
        {value === 1 && "Not confident"}
        {value === 2 && "Slightly confident"}
        {value === 3 && "Moderately confident"}
        {value === 4 && "Very confident"}
        {value === 5 && "Extremely confident"}
      </p>
    </div>
  );
};
