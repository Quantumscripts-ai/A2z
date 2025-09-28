import React from "react";

interface TimelineSegmentProps {
  id: number;
  startTime: number;
  endTime: number;
  text: string;
  speaker?: number;
  isActive: boolean;
  speakerColor: string;
  speakerName: string;
  onClick: () => void;
  videoLength: number;
}

const TimelineSegment: React.FC<TimelineSegmentProps> = ({
  id,
  startTime,
  endTime,
  text,
  speaker,
  isActive,
  speakerColor,
  speakerName,
  onClick,
  videoLength,
}) => {
  // Calculate position and width as percentages of video length
  const startPercent = (startTime / videoLength) * 100;
  const durationPercent = ((endTime - startTime) / videoLength) * 100;

  return (
    <div
      className={`absolute h-full rounded-md transition-all duration-150 cursor-pointer hover:opacity-90 ${
        isActive ? "ring-2 ring-white ring-opacity-70" : ""
      }`}
      style={{
        left: `${startPercent}%`,
        width: `${Math.max(0.5, durationPercent)}%`,
        backgroundColor: speakerColor || "#4285F4",
      }}
      onClick={onClick}
    >
      <div className="absolute bottom-full mb-1 text-xs font-medium text-white truncate bg-black bg-opacity-50 px-1 rounded max-w-[150px]">
        {speakerName}: {text.length > 20 ? text.substring(0, 20) + "..." : text}
      </div>
    </div>
  );
};

export default TimelineSegment;
