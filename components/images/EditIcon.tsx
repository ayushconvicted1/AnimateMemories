import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

function EditIcon(props: SvgProps) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none" {...props}>
      {/* Classic edit/pencil icon - clear diagonal shape with tip */}
      <Path
        d="M11.5 2.5L13.5 4.5L5.5 12.5H3.5V10.5L11.5 2.5Z"
        stroke="currentColor"
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner detail line showing pencil tip */}
      <Path
        d="M9.5 4.5L11.5 6.5"
        stroke="currentColor"
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default EditIcon;
