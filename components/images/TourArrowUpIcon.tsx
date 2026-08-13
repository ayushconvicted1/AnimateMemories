import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

function TourArrowUpIcon(props: SvgProps) {
  const fillColor = props.color || props.fill || "#FFFFFF";
  return (
    <Svg width={24} height={12} viewBox="0 0 24 12" fill="none" {...props}>
      <Path d="M12 0L24 12H0L12 0Z" fill={fillColor} />
    </Svg>
  );
}

export default TourArrowUpIcon;
