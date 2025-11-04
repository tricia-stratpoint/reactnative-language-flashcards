declare module "react-native-flip-card" {
  import { Component } from "react";
  import { StyleProp, ViewStyle } from "react-native";

  interface FlipCardProps {
    style?: StyleProp<ViewStyle>;
    flip?: boolean;
    friction?: number;
    perspective?: number;
    flipHorizontal?: boolean;
    flipVertical?: boolean;
    clickable?: boolean;
    useNativeDriver?: boolean;
    onFlipStart?: (isFlipStart: boolean) => void;
    onFlipEnd?: (isFlipEnd: boolean) => void;
    alignHeight?: boolean;
    alignWidth?: boolean;
    children?: React.ReactNode;
  }

  export default class FlipCard extends Component<FlipCardProps> {}
}
