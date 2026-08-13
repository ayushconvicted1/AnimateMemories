import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

function MenuIcon(props: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M3 6H21M3 12H21M3 18H21"
        stroke={props.color || "#0F172A"}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default MenuIcon;
