import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

function SearchIcon(props: SvgProps) {
  return (
    <Svg width={17} height={17} viewBox="0 0 17 17" fill="none" {...props}>
      <Path
        d="M7.602 14.36a6.758 6.758 0 100-13.515 6.758 6.758 0 000 13.515zM16.05 16.05l-3.675-3.675"
        stroke="#979797"
        strokeWidth={1.68944}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default SearchIcon;
