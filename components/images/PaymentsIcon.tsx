import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

function PaymentsIcon(props: SvgProps) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none" {...props}>
      <Path
        d="M2.5 6.25h15M2.5 6.25v8.75a1.25 1.25 0 001.25 1.25h12.5a1.25 1.25 0 001.25-1.25V6.25M2.5 6.25a1.25 1.25 0 011.25-1.25h12.5a1.25 1.25 0 011.25 1.25"
        stroke="#282828"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6.25 10h7.5"
        stroke="#282828"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default PaymentsIcon;


