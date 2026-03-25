import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

export const Card = ({ className, children, hoverable = false, ...props }: React.HTMLAttributes<HTMLDivElement> & { hoverable?: boolean }) => {
  const Comp = hoverable ? motion.div : 'div';
  const hoverProps = hoverable ? { whileHover: { y: -4 }, transition: { duration: 0.2 } } : {};
  
  return (
    <Comp
      className={cn("glass-panel rounded-2xl p-6 transition-all duration-300", className)}
      {...hoverProps}
      {...(props as any)}
    >
      {children}
    </Comp>
  );
};
