import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

function PointerIcon(props: SvgProps) {
  const fillColor = props.color || props.fill || "#FFFFFF";
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" {...props}>
      <Path d="M7 2l12 11.2-5.8.5 3.3 7.3-2.3 1-3.2-7.4-4.4 4.8z" fill={fillColor} />
    </Svg>
  );
}

export default PointerIcon;
