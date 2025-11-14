import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

function NotificationsIcon(props: SvgProps) {
  return (
    <Svg width={19} height={22} viewBox="0 0 19 22" fill="none" {...props}>
      <Path
        d="M3.798 8.25c0-4 3-5 5.5-5 4.5 0 5.5 3.5 5.5 5s0 7 2 8.5c1.6 1.2.333 1.5-.5 1.5h-13c-1.5 0-3.5.5-2-1s2.5-5 2.5-9zM7.798 3.25c-.167-.833-.1-2.5 1.5-2.5s1.666 1.667 1.5 2.5M3.798 2.75c-1.167.833-3.4 3.4-3 7M14.798 2.75c1.166.833 3.4 3.4 3 7"
        stroke="#282828"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6.298 18.25c0 .833.6 2.5 3 2.5s3-1.667 3-2.5"
        stroke="#282828"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default NotificationsIcon;
