import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

function HomeArrow(props: SvgProps) {
  return (
    <Svg width={31} height={14} viewBox="0 0 31 14" fill="none" {...props}>
      <Path
        d="M.347 8.968C3.87 5.558 14.42.108 28.451 5.588"
        stroke="#000"
        strokeDasharray="4 4"
      />
      <Path
        d="M24.282 8.835l4.963-2.713-2.713-4.964"
        stroke="#000"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default HomeArrow;
