import { Loader2 } from "lucide-react";

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  refreshing: boolean;
}

const PullToRefreshIndicator = ({ pullDistance, refreshing }: PullToRefreshIndicatorProps) => {
  if (pullDistance === 0 && !refreshing) return null;

  const opacity = Math.min(pullDistance / 80, 1);
  const scale = Math.min(0.5 + (pullDistance / 80) * 0.5, 1);

  return (
    <div
      className="flex items-center justify-center transition-all duration-150"
      style={{
        height: refreshing ? 48 : pullDistance,
        opacity: refreshing ? 1 : opacity,
      }}
    >
      <div
        className="transition-transform"
        style={{ transform: `scale(${refreshing ? 1 : scale})` }}
      >
        <Loader2
          className={`w-6 h-6 text-primary ${refreshing ? "animate-spin" : ""}`}
          style={{
            transform: refreshing ? undefined : `rotate(${pullDistance * 3}deg)`,
          }}
        />
      </div>
    </div>
  );
};

export default PullToRefreshIndicator;
