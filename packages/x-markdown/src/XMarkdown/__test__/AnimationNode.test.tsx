import { render, screen } from '@testing-library/react';
import React from 'react';
import AnimationNode, { AnimationText } from '../AnimationNode';

describe('AnimationText Component', () => {
  it('should render text without animation when no change', () => {
    const { container } = render(<AnimationText text="test" />);
    expect(container.textContent).toBe('test');
  });

  it('should apply custom animation config', () => {
    const customConfig = {
      fadeDuration: 300,
      opacity: 0.3,
    };
    render(<AnimationText text="test" animationConfig={customConfig} />);
    expect(screen.getByText('test')).toBeInTheDocument();
  });

  it('should handle text animation with fade effect', () => {
    const { container, rerender } = render(
      <AnimationText text="Hello" animationConfig={{ fadeDuration: 100, opacity: 0.5 }} />,
    );

    expect(container.textContent).toBe('Hello');

    // Test text update with animation
    rerender(
      <AnimationText text="Hello World" animationConfig={{ fadeDuration: 100, opacity: 0.5 }} />,
    );
    expect(container.textContent).toContain('Hello');
  });

  it('should use default animation values when config is not provided', () => {
    const { container } = render(<AnimationText text="test" />);
    expect(container.textContent).toBe('test');
  });
});

describe('AnimationNode Component', () => {
  it('should create element with correct tag', () => {
    render(<AnimationNode nodeTag="p" data-testid="test-node" />);
    const node = screen.getByTestId('test-node');
    expect(node.tagName).toBe('P');
  });

  it('should render string children with AnimationText', () => {
    render(
      <AnimationNode nodeTag="p" data-testid="test-node">
        test string
      </AnimationNode>,
    );
    expect(screen.getByText('test string')).toBeInTheDocument();
  });

  it('should render ReactNode children directly', () => {
    render(
      <AnimationNode nodeTag="p" data-testid="test-node">
        <span data-testid="child">child</span>
      </AnimationNode>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should handle array of children', () => {
    const { container } = render(
      <AnimationNode nodeTag="p">{['text1', 'text2', <span key="3">text3</span>]}</AnimationNode>,
    );
    expect(container.textContent).toContain('text1');
    expect(container.textContent).toContain('text2');
    expect(container.textContent).toContain('text3');
  });

  it('should pass through all props to created element', () => {
    render(
      <AnimationNode
        nodeTag="p"
        data-testid="test-node"
        className="test-class"
        style={{ color: 'red' }}
      />,
    );
    const node = screen.getByTestId('test-node');
    expect(node).toHaveClass('test-class');
    expect(node).toHaveStyle('color: red');
  });
});
