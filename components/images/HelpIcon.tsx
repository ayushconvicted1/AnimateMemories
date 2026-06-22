import * as React from "react";
import Svg, { Path, Circle, SvgProps } from "react-native-svg";

function HelpIcon(props: SvgProps) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none" {...props}>
      <Circle
        cx="10"
        cy="10"
        r="7.5"
        stroke="#282828"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 14.375v-.625a3.125 3.125 0 100-6.25"
        stroke="#282828"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 15.625h.009"
        stroke="#282828"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default HelpIcon;


