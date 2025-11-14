import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

function FilterIcon(props: SvgProps) {
  return (
    <Svg width={18} height={16} viewBox="0 0 18 16" fill="none" {...props}>
      <Path
        d="M17.74 0H0l7.096 8.39v5.801l3.547 1.774V8.391L17.74 0z"
        fill="#fff"
      />
    </Svg>
  );
}

export default FilterIcon;
