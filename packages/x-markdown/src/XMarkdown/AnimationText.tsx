import React, { useMemo, useRef } from 'react';
import { AnimationConfig } from './interface';

export interface AnimationTextProps {
  text: string;
  animationConfig?: AnimationConfig;
}

const AnimationText = React.memo<AnimationTextProps>((props) => {
  const { text, animationConfig } = props;
  const { fadeDuration = 200, easing = 'ease-in-out' } = animationConfig || {};
  const prevTextRef = useRef('');
  const chunksRef = useRef<string[]>([]);

  if (text !== prevTextRef.current) {
    if (!(prevTextRef.current && text.indexOf(prevTextRef.current) === 0)) {
      chunksRef.current = [text];
    } else {
      const newText = text.slice(prevTextRef.current.length);
      if (newText) {
        chunksRef.current = [...chunksRef.current, newText];
      }
    }
    prevTextRef.current = text;
  }

  const animationStyle = useMemo(
    () => ({
      animation: `x-markdown-fade-in ${fadeDuration}ms ${easing} forwards`,
      color: 'inherit',
    }),
    [fadeDuration, easing],
  );

  return (
    <>
      {chunksRef.current.map((text, index) => (
        <span style={animationStyle} key={`animation-text-${index}`}>
          {text}
        </span>
      ))}
    </>
  );
});

export default AnimationText;
