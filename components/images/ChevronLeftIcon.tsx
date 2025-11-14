import React from "react";
import Svg, { Path } from "react-native-svg";

interface ChevronLeftIconProps {
  size?: number;
  color?: string;
}

const ChevronLeftIcon: React.FC<ChevronLeftIconProps> = ({ 
  size = 24, 
  color = "#fff" 
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18l-6-6 6-6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default ChevronLeftIcon;