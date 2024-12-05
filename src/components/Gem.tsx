import Image from 'next/image';
import React from 'react';

interface GemProps {
  src: string;
  alt?: string;
  size?: number;
  className?: string;
}

const Gem: React.FC<GemProps> = ({ src, alt = "Gem", size = 60, className = "" }) => {
  return (
    <div className={className} style={{ position: 'relative', width: size, height: size }}>
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        style={{ objectFit: 'contain' }}
      />
    </div>
  );
};

export default Gem; 