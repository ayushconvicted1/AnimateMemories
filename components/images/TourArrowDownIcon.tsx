import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

function TourArrowDownIcon(props: SvgProps) {
  const fillColor = props.color || props.fill || "#FFFFFF";
  return (
    <Svg width={24} height={12} viewBox="0 0 24 12" fill="none" {...props}>
      <Path d="M12 12L0 0H24L12 12Z" fill={fillColor} />
    </Svg>
  );
}

export default TourArrowDownIcon;
