
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Heart, X } from 'tabler-icons-react';

interface HeartExplosionProps {
  x: number;
  y: number;
  color: string;
  type?: 'heart' | 'x';
  stroke?: number;
}

const HeartExplosion: React.FC<HeartExplosionProps> = ({ x, y, color, type = 'heart', stroke = 1.3 }) => {
  // Use useMemo to ensure random values are generated ONLY ONCE per explosion instance.
  // This prevents particles from "jumping" to new random positions if the parent component re-renders.
  const particles = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      // Random angle for dispersion
      angle: Math.random() * 360,
      // Random distance
      distance: 60 + Math.random() * 120,
      // Random size
      size: 10 + Math.random() * 14,
      // Random delay
      delay: Math.random() * 0.1,
    }));
  }, []); // Empty dependency array means this runs once on mount

  return (
    <div 
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-50 overflow-visible"
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, scale: 0, x: x, y: y }}
          animate={{
            opacity: 0,
            scale: p.size / 10,
            // Calculate X based on angle relative to origin x
            x: x + (Math.cos(p.angle * (Math.PI / 180)) * p.distance),
            // Calculate Y based on angle relative to origin y, subtract extra to make them "float up"
            y: y + (Math.sin(p.angle * (Math.PI / 180)) * p.distance) - 100, 
            rotate: Math.random() * 360
          }}
          transition={{ 
            duration: 1.2 + Math.random(), 
            ease: "easeOut", 
            delay: p.delay 
          }}
          className="absolute"
          style={{ color: color }}
        >
          {type === 'heart' ? (
             <Heart fill="currentColor" size={p.size} />
          ) : (
             <X size={p.size} strokeWidth={stroke} />
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default HeartExplosion;
