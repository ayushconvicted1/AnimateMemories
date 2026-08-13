import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

/**
 * Search / magnifying-glass icon.
 * Path sourced from Heroicons (MIT) — heroicons.com
 * viewBox="0 0 24 24" stroke outline variant
 */
function SearchIcon({ color = "#9ca3af", width = 18, height = 18, strokeWidth = 1.8, ...props }: SvgProps & { color?: string; strokeWidth?: number }) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <Path
        d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default SearchIcon;
