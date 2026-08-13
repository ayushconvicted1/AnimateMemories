import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

function BlogIcon(props: SvgProps) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none" {...props}>
      <Path
        d="M3.75 5.5A1.75 1.75 0 015.5 3.75h9a1.75 1.75 0 011.75 1.75v10a1.75 1.75 0 01-1.75 1.75h-9a1.75 1.75 0 01-1.75-1.75v-10z"
        stroke={props.color || "#282828"}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6.25 7.5h7.5M6.25 10.75h7.5M6.25 14h4.375"
        stroke={props.color || "#282828"}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default BlogIcon;
