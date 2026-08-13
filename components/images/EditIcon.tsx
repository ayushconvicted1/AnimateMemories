import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

/**
 * Pencil-square / custom-prompt icon.
 * Path sourced from Heroicons (MIT) — heroicons.com — pencil-square outline variant
 * viewBox="0 0 24 24"
 */
function EditIcon({ color = "#9B59B6", width = 22, height = 22, strokeWidth = 1.6, ...props }: SvgProps & { color?: string; strokeWidth?: number }) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      {/* Square body */}
      <Path
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19.5 7.125M15 6l3 3"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default EditIcon;
