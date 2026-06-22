import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

function PrivacyIcon(props: SvgProps) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none" {...props}>
      <Path
        d="M10 2.5L3.75 5.625v4.375a6.25 6.25 0 0012.5 0V5.625L10 2.5z"
        stroke="#282828"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 10v3.75"
        stroke="#282828"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default PrivacyIcon;


