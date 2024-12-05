import React from 'react';

interface GemProps {
  src: string;
  onClick: () => void;
  style: React.CSSProperties;
}

const Gem: React.FC<GemProps> = ({ src, onClick, style }) => {
  return (
    <img
      src={src}
      alt="Gem"
      onClick={onClick}
      style={style}
      className="gem"
    />
  );
};

export default Gem; 