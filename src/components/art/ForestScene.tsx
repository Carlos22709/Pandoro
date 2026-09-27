import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

export function ForestScene() {
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 390 760"
      preserveAspectRatio="xMidYMid slice"
    >
      <Defs>
        <LinearGradient id="scene-sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#DDF0F8" />
          <Stop offset="100%" stopColor="#C6E2EA" />
        </LinearGradient>
        <LinearGradient id="scene-far-hills" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#C7DDD6" />
          <Stop offset="100%" stopColor="#AFCBC1" />
        </LinearGradient>
        <LinearGradient id="scene-near-hills" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#A9C9AF" />
          <Stop offset="100%" stopColor="#8FB39A" />
        </LinearGradient>
        <LinearGradient id="scene-pond" x1="15%" y1="0%" x2="85%" y2="100%">
          <Stop offset="0%" stopColor="#B9DEDF" />
          <Stop offset="100%" stopColor="#91C9CD" />
        </LinearGradient>
        <LinearGradient id="scene-rock" x1="15%" y1="10%" x2="85%" y2="90%">
          <Stop offset="0%" stopColor="#CCC3C9" />
          <Stop offset="100%" stopColor="#A8A5B2" />
        </LinearGradient>
        <LinearGradient id="scene-grass-far" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#CADF95" />
          <Stop offset="100%" stopColor="#B7D083" />
        </LinearGradient>
        <LinearGradient id="scene-grass-near" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#B8D280" />
          <Stop offset="100%" stopColor="#A5C273" />
        </LinearGradient>
        <LinearGradient id="scene-bamboo" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#7DA77C" />
          <Stop offset="55%" stopColor="#6B9973" />
          <Stop offset="100%" stopColor="#5E8B69" />
        </LinearGradient>
      </Defs>

      <Rect width="390" height="760" fill="url(#scene-sky)" />

      <Path d="M0 277C38 238 69 251 99 226c28-23 52-11 75 15 29-50 66-67 96-44 26 19 38 40 50 61 29-39 52-39 70-16v190H0Z" fill="url(#scene-far-hills)" opacity=".72" />
      <Path d="M0 332c48-56 76-41 116-83 38-40 77 19 91 54 40-43 79-36 106 16 33-28 57-18 77 4v145H0Z" fill="url(#scene-near-hills)" opacity=".7" />
      <Path d="M32 292c39-24 68-10 93-34 25-23 48-10 67 14" fill="none" stroke="#DCE9E1" strokeWidth="12" strokeLinecap="round" opacity=".12" />

      <G fill="#80AB85" opacity=".88">
        <Circle cx="13" cy="366" r="52" /><Circle cx="52" cy="342" r="38" />
        <Circle cx="91" cy="370" r="51" /><Circle cx="133" cy="351" r="42" />
        <Circle cx="278" cy="356" r="52" /><Circle cx="329" cy="341" r="45" />
        <Circle cx="380" cy="369" r="58" />
      </G>
      <G fill="#A9C98E" opacity=".82">
        <Circle cx="21" cy="404" r="46" /><Circle cx="78" cy="398" r="54" />
        <Circle cx="132" cy="400" r="43" /><Circle cx="258" cy="401" r="43" />
        <Circle cx="313" cy="393" r="53" /><Circle cx="372" cy="408" r="45" />
      </G>

      <Path d="M218 409c52-30 124-27 172 12v146H186c-16-54-7-113 32-158Z" fill="url(#scene-pond)" />
      <Ellipse cx="303" cy="459" rx="76" ry="23" fill="#E6F3EE" opacity=".1" />
      <Path d="M211 437c59 20 111-25 179 0M213 474c53 17 118-22 177 4M215 516c47 8 111-14 175 7" fill="none" stroke="#E2F1EB" strokeWidth="5" strokeLinecap="round" opacity=".7" />
      <Path d="M246 451c26 5 51-8 77-7M275 489c20 3 42-5 64-3" fill="none" stroke="#F3F8EF" strokeWidth="2.5" strokeLinecap="round" opacity=".46" />
      <Ellipse cx="324" cy="458" rx="33" ry="8" fill="#82B58A" />
      <Ellipse cx="266" cy="497" rx="26" ry="7" fill="#89B987" />

      <G>
        <Ellipse cx="356" cy="410" rx="54" ry="30" fill="url(#scene-rock)" />
        <Path d="M322 407c13-16 39-22 60-12 8 4 14 9 19 15-25-7-49-4-79 8Z" fill="#DDD3D4" opacity=".38" />
        <Ellipse cx="375" cy="449" rx="42" ry="24" fill="#C9BDC0" />
        <Path d="M349 445c12-10 31-13 47-5-14 0-28 5-43 13Z" fill="#E1D6D5" opacity=".34" />
        <Ellipse cx="39" cy="486" rx="48" ry="34" fill="url(#scene-rock)" />
        <Path d="M4 480c15-20 42-27 64-14-22 0-42 7-61 23Z" fill="#D8D1D5" opacity=".34" />
        <Ellipse cx="78" cy="466" rx="27" ry="21" fill="#C8BCC1" />
      </G>

      <Path d="M0 489c72-29 129-5 183 8 56 14 129 23 207-9v272H0Z" fill="url(#scene-grass-far)" />
      <Path d="M0 562c70-24 132-8 191 10 65 19 124 10 199-11v199H0Z" fill="url(#scene-grass-near)" opacity=".94" />
      <Path d="M12 531c46-15 88-10 132 2M228 550c43 7 86 0 142-16M19 641c47-13 89-7 126 5M237 625c41 8 79 5 133-9" fill="none" stroke="#E2EDB9" strokeWidth="4" strokeLinecap="round" opacity=".2" />

      <G opacity=".94">
        <G fill="url(#scene-bamboo)">
          <Rect x="8" y="-16" width="18" height="413" rx="8" transform="rotate(-4 8 -16)" />
          <Rect x="41" y="-12" width="15" height="337" rx="7" transform="rotate(5 41 -12)" />
          <Rect x="72" y="-9" width="12" height="254" rx="6" transform="rotate(-8 72 -9)" />
        </G>
        <G fill="#D0DF9D" opacity=".18">
          <Rect x="13" y="-10" width="4" height="397" rx="2" transform="rotate(-4 13 -10)" />
          <Rect x="45" y="-8" width="3" height="323" rx="1.5" transform="rotate(5 45 -8)" />
        </G>
        <G fill="#B3CC83">
          <Rect x="11" y="54" width="17" height="7" rx="3" /><Rect x="8" y="135" width="18" height="7" rx="3" />
          <Rect x="5" y="220" width="18" height="7" rx="3" /><Rect x="43" y="80" width="15" height="6" rx="3" />
          <Rect x="45" y="165" width="15" height="6" rx="3" />
        </G>
        <G fill="#79A77E">
          <Ellipse cx="8" cy="33" rx="12" ry="39" transform="rotate(-45 8 33)" />
          <Ellipse cx="38" cy="27" rx="11" ry="38" transform="rotate(35 38 27)" fill="#84AF82" />
          <Ellipse cx="67" cy="66" rx="11" ry="38" transform="rotate(47 67 66)" />
          <Ellipse cx="18" cy="117" rx="12" ry="39" transform="rotate(-51 18 117)" fill="#86B083" />
          <Ellipse cx="65" cy="149" rx="11" ry="35" transform="rotate(49 65 149)" />
          <Ellipse cx="34" cy="229" rx="11" ry="37" transform="rotate(-48 34 229)" fill="#73A178" />
        </G>
      </G>

      <G fill="#6F9A6B" opacity=".9">
        <Path d="M0 611c9-39 17-57 23-74 6 31 1 55-4 82Z" />
        <Path d="M18 624c13-38 31-55 46-68-6 34-22 54-37 72Z" />
        <Path d="M390 604c-14-43-30-65-44-82 2 41 18 68 31 88Z" />
        <Path d="M368 624c-5-39-2-62 1-79 18 34 18 57 14 80Z" />
      </G>

      <G fill="#FFF7DF">
        <Circle cx="61" cy="569" r="7" /><Circle cx="50" cy="580" r="7" /><Circle cx="72" cy="580" r="7" /><Circle cx="61" cy="591" r="7" />
        <Circle cx="345" cy="577" r="7" /><Circle cx="334" cy="588" r="7" /><Circle cx="356" cy="588" r="7" /><Circle cx="345" cy="599" r="7" />
      </G>
      <G fill="#E9B672"><Circle cx="61" cy="580" r="5" /><Circle cx="345" cy="588" r="5" /></G>
    </Svg>
  );
}
