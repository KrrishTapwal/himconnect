import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RotatingText({ items, interval = 2200, className = '' }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex(i => (i + 1) % items.length), interval);
    return () => clearInterval(t);
  }, [items.length, interval]);

  return (
    <span className={`inline-block relative ${className}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ y: 24, opacity: 0, filter: 'blur(6px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: -24, opacity: 0, filter: 'blur(6px)' }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block"
        >
          {items[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
