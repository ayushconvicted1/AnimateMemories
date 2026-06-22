import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

function LegalIcon(props: SvgProps) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none" {...props}>
      <Path
        d="M5.625 2.5h8.75a1.25 1.25 0 011.25 1.25v12.5a1.25 1.25 0 01-1.25 1.25H5.625a1.25 1.25 0 01-1.25-1.25V3.75a1.25 1.25 0 011.25-1.25z"
        stroke="#282828"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6.875 6.25h6.25M6.875 10h6.25M6.875 13.75h4.375"
        stroke="#282828"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default LegalIcon;


