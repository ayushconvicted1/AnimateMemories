import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

function AnimateMemoriesTabsLogo(props: SvgProps) {
  return (
    <Svg width={32} height={29} viewBox="0 0 32 29" fill="none" {...props}>
      <Path
        d="M30.792 28.607h-5.52a.562.562 0 01-.49-.29l-6.338-11.522a.56.56 0 00-.982 0l-1.294 2.354a.56.56 0 01-.982 0l-1.296-2.355a.56.56 0 00-.982 0L6.573 28.315a.563.563 0 01-.492.29H.561a.56.56 0 01-.491-.83L10 9.72l2.278-4.14L15.186.29a.56.56 0 01.982 0l2.91 5.29 2.276 4.138 9.93 18.057a.56.56 0 01-.492.83v.002zM27.097 8.512a4.256 4.256 0 100-8.512 4.256 4.256 0 000 8.512z"
        fill="#fff"
      />
    </Svg>
  );
}

export default AnimateMemoriesTabsLogo;
