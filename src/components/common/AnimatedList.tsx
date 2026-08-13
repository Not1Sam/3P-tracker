import React from 'react';
import { type ViewStyle } from 'react-native';
import Animated, {
  FadeIn,
  Layout,
} from 'react-native-reanimated';

interface AnimatedListItemProps {
  index: number;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function AnimatedListItem({ index, children, style }: AnimatedListItemProps) {
  return (
    <Animated.View
      entering={FadeIn.delay(index * 50).duration(300)}
      layout={Layout.springify()}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

interface AnimatedListProps {
  data: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  keyExtractor?: (item: any) => string;
  contentContainerStyle?: ViewStyle;
  style?: ViewStyle;
}

export function AnimatedList({
  data,
  renderItem,
  keyExtractor,
  contentContainerStyle,
  style,
}: AnimatedListProps) {
  return (
    <Animated.View style={style}>
      {data.map((item, index) => (
        <AnimatedListItem key={keyExtractor ? keyExtractor(item) : index} index={index}>
          {renderItem(item, index)}
        </AnimatedListItem>
      ))}
    </Animated.View>
  );
}
