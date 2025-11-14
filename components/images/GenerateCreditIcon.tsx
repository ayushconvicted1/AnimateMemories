import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

function GenerateCreditIcon(props: SvgProps) {
  return (
    <Svg width={9} height={10} viewBox="0 0 9 10" fill="none" {...props}>
      <Path
        d="M3.55 0h.165c.141.078.29.146.423.235 1.335.88 1.965 2.09 1.882 3.634-.002.049-.006.098-.011.175.235-.24.408-.479.555-.737.128-.222.355-.255.539-.074 1.028 1.01 1.42 2.212 1.145 3.59-.429 2.142-2.69 3.547-4.94 3.091C.777 9.402-.663 6.84.3 4.567a3.97 3.97 0 011.48-1.77c.877-.59 1.398-1.386 1.532-2.401.023-.172.059-.317.237-.396z"
        fill={props.color || "#fff"}
      />
    </Svg>
  );
}

export default GenerateCreditIcon;
