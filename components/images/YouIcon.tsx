import * as React from "react";
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  SvgProps,
} from "react-native-svg";

function YouIcon(props: SvgProps) {
  return (
    <Svg width={24} height={27} viewBox="0 0 24 27" fill="none" {...props}>
      <Path
        d="M12.587 0c.545.117 1.103.189 1.631.357 3.134.994 5.227 4.047 4.971 7.214-.272 3.371-2.722 6.039-6.036 6.57-4.09.658-7.892-2.227-8.313-6.308C4.44 3.957 7.3.458 11.208.046c.069-.007.137-.03.205-.046h1.174z"
        fill={props.color || "url(#paint0_linear_182_1258)"}
      />
      <Path
        d="M12.001 27H.964C.29 27-.01 26.7 0 26.031c.068-5.004 3.986-9.728 9-10.53a11.35 11.35 0 011.5-.12c1.155-.017 2.19-.011 3.345 0 4.645.045 8.556 3.616 9.777 8.049.236.86.364 1.734.378 2.625.01.633-.3.945-.935.945H12.001z"
        fill={props.color || "url(#paint1_linear_182_1258)"}
      />
      <Defs>
        <LinearGradient
          id="paint0_linear_182_1258"
          x1={21.6694}
          y1={-6.29947}
          x2={6.63552}
          y2={17.8893}
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset={0.142356} stopColor="#D229FF" />
          <Stop offset={1} stopColor="#28D4FA" />
        </LinearGradient>
        <LinearGradient
          id="paint1_linear_182_1258"
          x1={28.0964}
          y1={10.866}
          x2={20.9837}
          y2={35.1278}
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset={0.142356} stopColor="#D229FF" />
          <Stop offset={1} stopColor="#28D4FA" />
        </LinearGradient>
      </Defs>
    </Svg>
  );
}

export default YouIcon;
