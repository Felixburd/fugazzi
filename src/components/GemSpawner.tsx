"use client";

import React, { useState, useEffect, useCallback, WheelEvent, useRef, MouseEvent } from 'react';
import Image from 'next/image';

interface GemConfig {
  src: string;
  baseCost: number;
  riskTier: 'low' | 'medium' | 'high' | 'jackpot' | 'diamond';
  rewardMultiplier?: number;
  isFake?: boolean;
}

const gemConfigs: GemConfig[] = [
  { src: '/gems/gem1.png', baseCost: 10, riskTier: 'low' as const },
  { src: '/gems/gem2.png', baseCost: 15, riskTier: 'low' as const },
  { src: '/gems/gem3.png', baseCost: 20, riskTier: 'low' as const },
  { src: '/gems/gem4.png', baseCost: 25, riskTier: 'low' as const },
  { src: '/gems/gem5.png', baseCost: 35, riskTier: 'medium' as const },
  { src: '/gems/gem6.png', baseCost: 45, riskTier: 'medium' as const },
  { src: '/gems/gem8.png', baseCost: 65, riskTier: 'medium' as const },
  { src: '/gems/gem10.png', baseCost: 100, riskTier: 'high' as const },
  { src: '/gems/gem11.png', baseCost: 125, riskTier: 'high' as const },
  { src: '/gems/gem14.png', baseCost: 250, riskTier: 'jackpot' as const },
  { src: '/gems/gem16.png', baseCost: 400, riskTier: 'jackpot' as const }
].map(config => {
  let fakeChance: number;
  let minReturn: number;
  let maxReturn: number;

  switch (config.riskTier) {
    case 'low':
      fakeChance = 0.20;
      minReturn = 1.05;
      maxReturn = 1.15;
      break;
    case 'medium':
      fakeChance = 0.35;
      minReturn = 1.20;
      maxReturn = 1.40;
      break;
    case 'high':
      fakeChance = 0.50;
      minReturn = 1.50;
      maxReturn = 2.00;
      break;
    case 'jackpot':
      fakeChance = 0.65;
      minReturn = 2.50;
      maxReturn = 5.00;
      break;
    default:
      fakeChance = 0;
      minReturn = 1;
      maxReturn = 1;
  }

  return {
    ...config,
    rewardMultiplier: minReturn + Math.random() * (maxReturn - minReturn),
    isFake: Math.random() < fakeChance
  };
});

// Diamond configurations
const diamondConfigs: GemConfig[] = [
  { src: '/gems/diamond1.png', baseCost: 1, riskTier: 'diamond' as const },
  { src: '/gems/diamond2.png', baseCost: 5, riskTier: 'diamond' as const }
].map(config => ({
  ...config,
  rewardMultiplier: 1.1 + Math.random() * 0.2, // 1.1x to 1.3x returns
  isFake: Math.random() < 0.15 // 15% chance to be fake
}));

/* eslint-disable @typescript-eslint/no-unused-vars */
const PADDING = 10; // % from edges
const MAX_GEMS = 7;
/* eslint-enable @typescript-eslint/no-unused-vars */

interface Position {
  x: number;
  y: number;
}

const getRandomPosition = (existingPositions: { x: number; y: number }[]): { x: number; y: number } => {
  const edgePadding = 15; // Padding from edges
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    const x = Math.random() * (100 - 2 * edgePadding) + edgePadding;
    const y = Math.random() * (100 - 2 * edgePadding) + edgePadding;

    // Check distance from all existing gems
    const isFarEnough = existingPositions.every(pos => {
      const dx = pos.x - x;
      const dy = pos.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance >= 25;
    });

    if (isFarEnough || attempts === maxAttempts - 1) {
      return { x, y };
    }

    attempts++;
  }

  return {
    x: Math.random() * 80 + 10,
    y: Math.random() * 80 + 10
  };
};

interface Gem extends Omit<GemConfig, 'rewardMultiplier' | 'isFake'> {
  position: Position;
  isFake: boolean;
  rotation: number;
  scale: number;
  rewardMultiplier: number;
}

const formatCurrency = (amount: number, showCents: boolean = true): string => {
  return showCents ? `$${amount.toFixed(2)}` : `$${Math.floor(amount)}`;
};

const formatPercentage = (multiplier: number): string => {
  return `+${((multiplier - 1) * 100).toFixed(1)}%`;
};

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.3334 4L6.00008 11.3333L2.66675 8" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4L4 12M4 4L12 12" stroke="#ff4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const getRandomGems = (count: number) => {
  // First, get random diamonds (6-10)
  const diamondCount = Math.floor(Math.random() * 5) + 6; // 6-10 diamonds
  const diamonds = Array(diamondCount).fill(null).map(() => {
    const diamondConfig = diamondConfigs[Math.floor(Math.random() * diamondConfigs.length)];
    return {
      ...diamondConfig,
      baseCost: Math.floor(Math.random() * 9) + 1, // Random cost between 1-10
      scale: 0.6, // Diamonds are 60% the size of regular gems
      rotation: Math.random() * 360,
      isFake: Math.random() < 0.15,
      rewardMultiplier: 1.1 + Math.random() * 0.2, // Ensure rewardMultiplier is set
    };
  });

  // Then get the regular gems
  const remainingCount = count - diamondCount;
  const lowRisk = Math.floor(remainingCount * 0.4);
  const mediumRisk = Math.floor(remainingCount * 0.3);
  const highRisk = Math.floor(remainingCount * 0.2);
  const jackpot = Math.max(1, remainingCount - lowRisk - mediumRisk - highRisk);

  const shuffled = [...gemConfigs].sort(() => Math.random() - 0.5);
  const gems = [
    ...shuffled.filter(g => g.riskTier === 'low').slice(0, lowRisk),
    ...shuffled.filter(g => g.riskTier === 'medium').slice(0, mediumRisk),
    ...shuffled.filter(g => g.riskTier === 'high').slice(0, highRisk),
    ...shuffled.filter(g => g.riskTier === 'jackpot').slice(0, jackpot)
  ].map(gem => ({
    ...gem,
    scale: 1, // Regular gems maintain their original size
    rotation: Math.random() * 360,
    rewardMultiplier: gem.rewardMultiplier || 1, // Ensure rewardMultiplier is set
    isFake: gem.isFake || false, // Ensure isFake is set
  }));

  // Combine diamonds and gems, then assign positions
  const allItems = [...diamonds, ...gems];
  const positions: Position[] = [];

  return allItems.map(item => {
    const position = getRandomPosition(positions);
    positions.push(position);
    return {
      ...item,
      position
    } as Gem;
  });
};

const DollarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{
    filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.5))',
  }}>
    <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" 
      stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ResetIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 10C2 10 4.5 7.5 7 5C9.5 2.5 14 2.5 16.5 5C19 7.5 19 12 16.5 14.5C14 17 9.5 17 7 14.5" 
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 4V10H8" 
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DiceIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2"/>
    <circle cx="9" cy="9" r="1.5" fill="currentColor"/>
    <circle cx="15" cy="15" r="1.5" fill="currentColor"/>
    <circle cx="15" cy="9" r="1.5" fill="currentColor"/>
    <circle cx="9" cy="15" r="1.5" fill="currentColor"/>
  </svg>
);

const RerollIcon = () => (
  <DiceIcon />
);

const BACKGROUND_COLOR = 'rgba(23, 23, 23, 0.87)';

const generateRandomUsername = () => {
  const adjectives = ['Lucky', 'Wild', 'Crypto', 'Diamond', 'Golden', 'Moon', 'Rocket', 'Rich', 'Based', 'Degen'];
  const nouns = ['Trader', 'Wolf', 'Whale', 'King', 'Master', 'Ape', 'Hunter', 'Boss', 'Chad', 'Guru'];
  const numbers = Math.floor(Math.random() * 9999).toString().padStart(2, '0');
  
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${numbers}`;
};

const generateRandomTransaction = () => {
  const isWin = Math.random() > 0.3;
  const amount = isWin 
    ? Math.floor(Math.random() * 900) + 100 // Win between 100-1000
    : Math.floor(Math.random() * 90) + 10;  // Loss between 10-100
  
  // 5% chance for huge win
  const isHugeWin = isWin && Math.random() < 0.05;
  const finalAmount = isHugeWin ? amount * 10 : amount;

  return {
    username: generateRandomUsername(),
    amount: finalAmount,
    isWin,
    timestamp: new Date(),
  };
};

const getRandomInterval = () => {
  // Base interval between 4 and 7 seconds
  const baseInterval = Math.random() * 3000 + 4000;
  
  // 20% chance to add an additional 2-4 seconds
  const extraDelay = Math.random() > 0.8 ? Math.random() * 2000 + 2000 : 0;
  
  return baseInterval + extraDelay;
};

const TransactionLog = () => {
  const [transactions, setTransactions] = useState<Array<{
    username: string;
    amount: number;
    isWin: boolean;
    timestamp: Date;
    id: string;
  }>>([]);
  
  const logContentRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const scheduleNextTransaction = useCallback(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const interval = getRandomInterval();
    timeoutRef.current = setTimeout(() => {
      setTransactions(prev => {
        const newTransaction = {
          ...generateRandomTransaction(),
          id: Math.random().toString(36).substring(7),
        };
        const updated = [newTransaction, ...prev.slice(0, 19)];
        
        if (logContentRef.current) {
          logContentRef.current.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        }
        
        // Schedule next transaction after state update
        Promise.resolve().then(() => scheduleNextTransaction());
        
        return updated;
      });
    }, interval);
  }, []);

  useEffect(() => {
    // Initialize with some transactions
    const initial = Array(10).fill(null).map(() => ({
      ...generateRandomTransaction(),
      id: Math.random().toString(36).substring(7),
    }));
    setTransactions(initial);

    // Start scheduling transactions
    scheduleNextTransaction();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [scheduleNextTransaction]);

  return (
    <div className="transaction-log" style={{
      background: BACKGROUND_COLOR,
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      padding: '16px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      overflow: 'hidden',
    }}>
      <div style={{
        fontSize: '1.2rem',
        fontWeight: 500,
        color: '#fff',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '12px',
      }}>
        Live Transactions
      </div>
      <div 
        ref={logContentRef}
        className="transaction-log-content"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="transaction-item"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.9rem',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ fontWeight: 500 }}>{tx.username}</div>
              <div style={{ 
                fontSize: '0.8rem', 
                opacity: 0.7 
              }}>
                {tx.timestamp.toLocaleTimeString()}
              </div>
            </div>
            <div style={{
              color: tx.isWin ? '#4ade80' : '#ff4444',
              fontWeight: 500,
              fontFamily: 'var(--font-geist-mono)',
            }}>
              {tx.isWin ? '+' : '-'}${tx.amount.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const getTagStyles = (position: Position) => {
  const baseStyles = {
    position: 'absolute' as const,
    background: BACKGROUND_COLOR,
    padding: '4px 8px',
    borderRadius: '6px',
    color: '#fff',
    fontSize: 'clamp(0.7rem, 2vw, 0.9rem)',
    whiteSpace: 'nowrap' as const,
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
    opacity: 0,
    transition: 'opacity 0.2s ease',
    pointerEvents: 'none',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  };

  // Position tag based on gem's position on screen
  if (position.y < 30) {
    return {
      ...baseStyles,
      bottom: '-40px',
      left: '50%',
      transform: 'translateX(-50%)',
    };
  } else {
    return {
      ...baseStyles,
      top: '-40px',
      left: '50%',
      transform: 'translateX(-50%)',
    };
  }
};

const GemSpawner: React.FC = () => {
  const [gems, setGems] = useState<Gem[]>([]);
  const [selectedGemIndex, setSelectedGemIndex] = useState<number | null>(null);
  const [balance, setBalance] = useState(200);
  const [lastReward, setLastReward] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [flashState, setFlashState] = useState<'success' | 'fail' | null>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = useCallback((e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    setZoom(prevZoom => {
      const newZoom = prevZoom - (e.deltaY * 0.001);
      const container = containerRef.current;
      if (!container) return prevZoom;
      
      const minZoom = 1;
      const maxZoom = 3;
      return Math.min(Math.max(newZoom, minZoom), maxZoom);
    });
  }, []);

  const handleMouseDown = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only left click
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    const deltaX = e.clientX - lastMousePosRef.current.x;
    const deltaY = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    setPosition(prev => {
      const container = containerRef.current;
      if (!container) return prev;

      const containerRect = container.getBoundingClientRect();
      const maxOffset = (zoom - 1) * containerRect.width / 2;

      const newX = Math.max(Math.min(prev.x + deltaX, maxOffset), -maxOffset);
      const newY = Math.max(Math.min(prev.y + deltaY, maxOffset), -maxOffset);

      return { x: newX, y: newY };
    });
  }, [zoom]);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  useEffect(() => {
    // Reset position when zoom changes
    setPosition({ x: 0, y: 0 });
  }, [zoom]);

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseUp);
    
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [handleMouseUp]);

  const initializeGems = useCallback(() => {
    const selectedGems = getRandomGems(7); // Always spawn 7 gems with balanced risk distribution
    const positions: Position[] = [];
    const newGems = selectedGems.map(config => {
      const position = getRandomPosition(positions);
      positions.push(position);
      return {
        ...config,
        position,
        rotation: Math.random() * 360,
        scale: config.riskTier === 'diamond' ? 0.6 : 1,
      } as Gem;
    });
    setGems(newGems);
  }, []);

  useEffect(() => {
    initializeGems();
  }, [initializeGems]);

  const handleGemClick = (index: number) => {
    if (balance < gems[index].baseCost) {
      setLastReward(`Insufficient funds! Need ${formatCurrency(gems[index].baseCost, false)}`);
      return;
    }
    setSelectedGemIndex(index);
  };

  // Save balance to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('gameBalance', balance.toString());
  }, [balance]);

  const handleConfirm = (index: number) => {
    const clickedGem = gems[index];
    
    // Deduct cost first
    setBalance(prev => prev - clickedGem.baseCost);

    if (!clickedGem.isFake) {
      // Correct real gem - add reward
      const reward = Math.floor(clickedGem.baseCost * clickedGem.rewardMultiplier);
      setBalance(prev => prev + reward);
      setLastReward(`+${formatCurrency(reward, true)}`);
      setFlashState('success');
      
      // Remove the gem
      const newGems = [...gems];
      newGems.splice(index, 1);
      setGems(newGems);
    } else {
      // Wrong call on Fugazzi - game over
      setGameOver(true);
      setFlashState('fail');
    }
    
    setSelectedGemIndex(null);
  };

  const handleCancel = () => {
    setSelectedGemIndex(null);
  };

  const handleRestart = () => {
    setGameOver(false);
    setLastReward(null);
    initializeGems();
  };

  const handleResetBalance = () => {
    setBalance(200);
    setLastReward(null);
  };

  // Color coding for different risk tiers
  const getRiskColor = (riskTier: string) => {
    switch (riskTier) {
      case 'low': return '#4ade80';     // Green
      case 'medium': return '#facc15';   // Yellow
      case 'high': return '#fb923c';     // Orange
      case 'jackpot': return '#f87171';  // Red
      default: return '#ffffff';
    }
  };

  const handleFugazziCall = (index: number) => {
    const clickedGem = gems[index];
    
    // Deduct cost first
    setBalance(prev => prev - clickedGem.baseCost);

    if (clickedGem.isFake) {
      // Correct Fugazzi call - reward double
      const reward = clickedGem.baseCost * 2;
      setBalance(prev => prev + reward);
      setLastReward(`+${formatCurrency(reward, true)} (Fugazzi Bonus!)`);
      setFlashState('success');
      
      // Remove the gem
      const newGems = [...gems];
      newGems.splice(index, 1);
      setGems(newGems);
    } else {
      // Wrong Fugazzi call - game over
      setGameOver(true);
      setFlashState('fail');
    }
    
    setSelectedGemIndex(null);
  };

  return (
    <div style={{ 
      width: '100%', 
      maxWidth: '80rem', 
      margin: '0 auto',
    }}>
      <div className="play-canvas-wrapper">
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            marginBottom: '10px',
            background: BACKGROUND_COLOR,
            borderRadius: '12px',
            color: '#fff',
            height: '48px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: 'clamp(1rem, 3vw, 1.5rem)',
              position: 'relative',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                opacity: 0.7,
              }}>
                <DollarIcon />
              </div>
              <div style={{ marginRight: '4px' }}>
                {formatCurrency(balance, true).replace('$', '')}
              </div>
              <button
                onClick={handleResetBalance}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  color: '#fff',
                  opacity: 0.4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  marginLeft: '-4px',
                  width: '20px',
                  height: '20px',
                }}
                title="Reset Balance"
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.8';
                  e.currentTarget.style.transform = 'rotate(180deg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0.4';
                  e.currentTarget.style.transform = 'rotate(0deg)';
                }}
              >
                <ResetIcon />
              </button>
            </div>

            {lastReward && (
              <div style={{
                fontSize: 'clamp(0.9rem, 2.5vw, 1.2rem)',
                color: lastReward.startsWith('+') ? '#4ade80' : '#ff4444',
                minWidth: '100px',
                textAlign: 'right',
              }}>
                {lastReward}
              </div>
            )}
          </div>
          <div 
            ref={containerRef}
            className={`play-canvas ${flashState === 'success' ? 'success' : flashState === 'fail' ? 'fail' : ''}`}
            style={{ 
              position: 'relative', 
              width: '100%', 
              border: '2px solid var(--foreground)',
              borderRadius: '8px',
              overflow: 'hidden',
              cursor: isDraggingRef.current ? 'grabbing' : 'grab',
            }}
          >
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
              transformOrigin: 'center',
              transition: 'transform 0.1s ease-out'
            }}>
              <Image
                src="/Texturelabs_Fabric_159M (1).jpg"
                alt="Fabric Background"
                fill
                style={{
                  objectFit: 'cover',
                  filter: 'brightness(1.5) saturate(0.85) contrast(1.1)',
                }}
                priority
              />
            </div>

            <button
              onClick={initializeGems}
              style={{
                position: 'absolute',
                bottom: '16px',
                right: '16px',
                background: BACKGROUND_COLOR,
                border: 'none',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                zIndex: 1000,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
              }}
            >
              <RerollIcon />
            </button>

            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                transformOrigin: 'center',
                transition: 'transform 0.1s ease-out',
                willChange: 'transform'
              }}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
            >
              {gems.map((gem, index) => {
                const isSelected = selectedGemIndex === index;
                
                return (
                  <div
                    key={`${gem.src}-${index}`}
                    style={{
                      position: 'absolute',
                      left: `${gem.position.x}%`,
                      top: `${gem.position.y}%`,
                      transform: `translate(-50%, -50%)`,
                      width: '60px',
                      height: '60px',
                      cursor: balance >= gem.baseCost ? 'pointer' : 'not-allowed',
                      zIndex: isSelected ? 50 : 1,
                    }}
                    onClick={() => handleGemClick(index)}
                  >
                    <div style={{
                      transform: `scale(${gem.scale})`,
                      width: '100%',
                      height: '100%',
                    }}>
                      <Image
                        src={gem.src}
                        alt="Gem"
                        width={60}
                        height={60}
                        style={{
                          transform: `rotate(${gem.rotation}deg)`,
                          transition: 'transform 0.3s ease',
                        }}
                      />
                    </div>
                    <div
                      className="price-tag"
                      style={{
                        ...getTagStyles(gem.position),
                        opacity: isSelected ? 1 : 0,
                        pointerEvents: isSelected ? 'auto' : 'none',
                      }}
                    >
                      <div>{formatCurrency(gem.baseCost, false)}</div>
                      <div style={{ 
                        color: getRiskColor(gem.riskTier),
                        fontSize: '0.8em',
                        fontWeight: 500,
                      }}>
                        {formatPercentage(gem.rewardMultiplier)}
                      </div>
                      <div style={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        marginTop: '2px',
                        padding: '2px 0'
                      }}>
                        <div style={{
                          display: 'flex',
                          gap: '12px',
                          justifyContent: 'center'
                        }}>
                          <div 
                            style={{ 
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                              background: 'rgba(74, 222, 128, 0.1)',
                              transition: 'all 0.2s ease',
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirm(index);
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(74, 222, 128, 0.2)';
                              e.currentTarget.style.transform = 'scale(1.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(74, 222, 128, 0.1)';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            <CheckIcon />
                          </div>
                          <div 
                            style={{ 
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                              background: 'rgba(255, 68, 68, 0.1)',
                              transition: 'all 0.2s ease',
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancel();
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 68, 68, 0.2)';
                              e.currentTarget.style.transform = 'scale(1.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 68, 68, 0.1)';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            <XIcon />
                          </div>
                        </div>
                        <div 
                          style={{ 
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: 'rgba(236, 72, 153, 0.1)',
                            color: '#fff',
                            fontSize: '0.7em',
                            fontWeight: 600,
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            transition: 'all 0.2s ease',
                            width: '100%',
                            textAlign: 'center',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFugazziCall(index);
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(236, 72, 153, 0.2)';
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(236, 72, 153, 0.1)';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          Fugazzi
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {gameOver && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: BACKGROUND_COLOR,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  gap: '20px',
                  padding: '20px',
                  textAlign: 'center',
                  scale: `${1/zoom}`,
                  transformOrigin: 'center',
                  zIndex: 1000,
                }}>
                  <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', margin: 0 }}>Game Over</h2>
                  <p style={{ fontSize: 'clamp(1rem, 4vw, 1.2rem)', margin: 0 }}>
                    You bought a Fugazzi!<br />
                    Final Balance: {formatCurrency(balance, true)}
                  </p>
                  <button
                    onClick={handleRestart}
                    style={{
                      padding: 'clamp(8px, 2vw, 10px) clamp(16px, 4vw, 20px)',
                      fontSize: 'clamp(0.9rem, 3vw, 1.1rem)',
                      background: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: '#000',
                    }}
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: flashState === 'success' ? 'rgba(74, 222, 128, 0.2)' : 
                         flashState === 'fail' ? 'rgba(255, 68, 68, 0.2)' : 
                         'transparent',
              transition: 'background-color 0.3s ease',
              pointerEvents: 'none',
              zIndex: 20,
            }} />
          </div>
        </div>
        
        <TransactionLog />
      </div>
    </div>
  );
};

export default GemSpawner; 