import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import yossimarImg from './assets/yossimar.png';
import treeImg from './assets/tree.jpg';
import rockImg from './assets/rock.jpg';
import yetiImg from './assets/yeti.jpg';

const PLAYER_SIZE = 40;
const OBSTACLE_SIZE = 50;
const YETI_SIZE = 80;
const MAX_SPEED = 15;
const YETI_SPAWN_SCORE = 2000;

export default function App() {
  const [gameState, setGameState] = useState('menu'); // menu, playing, gameover
  const [score, setScore] = useState(0);
  
  // Game state refs for the game loop (avoids re-renders for every frame)
  const playerRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight * 0.2, vx: 0, vy: 5, status: 'skiing' });
  const obstaclesRef = useRef([]);
  const yetiRef = useRef(null);
  const scoreRef = useRef(0);
  const frameRef = useRef(null);
  const keys = useRef({ ArrowLeft: false, ArrowRight: false, ArrowDown: false });

  // For rendering
  const [renderPlayer, setRenderPlayer] = useState({ ...playerRef.current });
  const [renderObstacles, setRenderObstacles] = useState([]);
  const [renderYeti, setRenderYeti] = useState(null);

  const startGame = () => {
    playerRef.current = { x: window.innerWidth / 2, y: window.innerHeight * 0.2, vx: 0, vy: 5, status: 'skiing' };
    obstaclesRef.current = [];
    yetiRef.current = null;
    scoreRef.current = 0;
    setScore(0);
    setGameState('playing');
  };

  const spawnObstacle = useCallback(() => {
    const isTree = Math.random() > 0.3;
    obstaclesRef.current.push({
      id: Math.random().toString(),
      type: isTree ? 'tree' : 'rock',
      x: Math.random() * window.innerWidth,
      y: window.innerHeight + OBSTACLE_SIZE,
      width: OBSTACLE_SIZE,
      height: OBSTACLE_SIZE
    });
  }, []);

  const spawnYeti = useCallback(() => {
    if (!yetiRef.current) {
      yetiRef.current = {
        x: window.innerWidth / 2,
        y: -YETI_SIZE,
        width: YETI_SIZE,
        height: YETI_SIZE,
        vx: 0,
        vy: 0
      };
    }
  }, []);

  const checkCollision = (rect1, rect2) => {
    const margin = 10;
    return (
      rect1.x < rect2.x + rect2.width - margin &&
      rect1.x + PLAYER_SIZE > rect2.x + margin &&
      rect1.y < rect2.y + rect2.height - margin &&
      rect1.y + PLAYER_SIZE > rect2.y + margin
    );
  };

  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return;

    const p = playerRef.current;
    
    if (p.status === 'crashed') {
      // Recover after a bit
      setTimeout(() => {
        if (playerRef.current.status === 'crashed') {
          playerRef.current.status = 'skiing';
          playerRef.current.vy = 5;
        }
      }, 1000);
    } else if (p.status === 'eaten') {
      setGameState('gameover');
      return;
    } else {
      // Movement
      if (keys.current.ArrowLeft) p.vx = -7;
      else if (keys.current.ArrowRight) p.vx = 7;
      else p.vx = 0;

      if (keys.current.ArrowDown) p.vy = Math.min(p.vy + 0.5, MAX_SPEED);
      else p.vy = 5; // Base speed

      p.x = Math.max(0, Math.min(window.innerWidth - PLAYER_SIZE, p.x + p.vx));
      
      scoreRef.current += Math.floor(p.vy / 2);
      setScore(scoreRef.current);
    }

    // Spawn obstacles
    if (Math.random() < 0.05 + (scoreRef.current / 50000)) {
      spawnObstacle();
    }

    // Spawn Yeti
    if (scoreRef.current > YETI_SPAWN_SCORE) {
      spawnYeti();
    }

    // Move obstacles (they move UP relative to the player's downward speed)
    const currentSpeed = p.status === 'skiing' ? p.vy : 0;
    
    obstaclesRef.current = obstaclesRef.current.filter(obs => {
      obs.y -= currentSpeed;
      return obs.y > -OBSTACLE_SIZE;
    });

    // Move Yeti
    const yeti = yetiRef.current;
    if (yeti) {
      // Yeti chases player
      const dx = p.x - yeti.x;
      const dy = p.y - yeti.y;
      
      yeti.vx = dx > 0 ? 3 : -3;
      yeti.vy = dy > 0 ? (currentSpeed + 2) : (currentSpeed - 1); // Yeti is faster
      
      yeti.x += yeti.vx;
      yeti.y += yeti.vy - currentSpeed; // Relative movement

      if (checkCollision(p, yeti)) {
        p.status = 'eaten';
      }
    }

    // Check obstacle collisions
    if (p.status === 'skiing') {
      for (let obs of obstaclesRef.current) {
        if (checkCollision(p, obs)) {
          p.status = 'crashed';
          p.vy = 0;
          break;
        }
      }
    }

    // Update React State for rendering
    setRenderPlayer({ ...p });
    setRenderObstacles([...obstaclesRef.current]);
    if (yeti) setRenderYeti({ ...yeti });

    frameRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, spawnObstacle, spawnYeti]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown'].includes(e.key)) {
        keys.current[e.key] = true;
      }
    };
    const handleKeyUp = (e) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown'].includes(e.key)) {
        keys.current[e.key] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (gameState === 'playing') {
      frameRef.current = requestAnimationFrame(gameLoop);
    }
    return () => cancelAnimationFrame(frameRef.current);
  }, [gameState, gameLoop]);

  return (
    <div className="fixed inset-0 bg-white overflow-hidden font-sans select-none touch-none">
      
      {/* MENU */}
      {gameState === 'menu' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md z-50">
          <h1 className="text-6xl font-black text-white uppercase italic mb-8">
            YOSSI <span className="text-amber-400">FREE</span>
          </h1>
          <p className="text-white mb-8 max-w-md text-center">
            Esquiva los árboles y las rocas. Usa las <b>flechas Izquierda/Derecha</b> para moverte y la <b>flecha Abajo</b> para acelerar. ¡Cuidado con el Yeti!
          </p>
          <button
            onClick={startGame}
            className="px-8 py-4 bg-amber-400 text-black font-black uppercase text-xl rounded-xl hover:scale-105 transition-transform"
          >
            Jugar
          </button>
        </div>
      )}

      {/* GAME OVER */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/90 backdrop-blur-md z-50">
          <h1 className="text-6xl font-black text-white uppercase italic mb-4">
            ¡TE COMIÓ EL YETI!
          </h1>
          <p className="text-3xl text-amber-400 font-bold mb-8">Distancia: {score}m</p>
          <button
            onClick={startGame}
            className="px-8 py-4 bg-white text-black font-black uppercase text-xl rounded-xl hover:scale-105 transition-transform"
          >
            Intentar de nuevo
          </button>
        </div>
      )}

      {/* GAME UI */}
      {gameState === 'playing' && (
        <div className="absolute top-4 right-4 text-3xl font-black text-slate-800 z-40 bg-white/50 p-2 rounded">
          {score}m
        </div>
      )}

      {/* GAME WORLD */}
      <div className="relative w-full h-full">
        {/* PLAYER */}
        {(gameState === 'playing' || gameState === 'gameover') && (
          <div
            style={{
              position: 'absolute',
              left: renderPlayer.x,
              top: renderPlayer.y,
              width: PLAYER_SIZE,
              height: PLAYER_SIZE,
              transform: `rotate(${renderPlayer.vx * 2}deg)`,
              filter: renderPlayer.status === 'crashed' ? 'grayscale(100%)' : 'none'
            }}
            className="z-20 flex flex-col items-center"
          >
            <div className="w-full h-full rounded-full overflow-hidden border-2 border-slate-800 bg-slate-200">
              <img src={yossimarImg} alt="Player" className="w-full h-full object-cover" />
            </div>
            {renderPlayer.status === 'crashed' && <span className="absolute -top-6 text-xl">💥</span>}
          </div>
        )}

        {/* OBSTACLES */}
        {(gameState === 'playing' || gameState === 'gameover') && renderObstacles.map(obs => (
          <div
            key={obs.id}
            style={{
              position: 'absolute',
              left: obs.x,
              top: obs.y,
              width: obs.width,
              height: obs.height,
            }}
            className="z-10"
          >
            <img src={obs.type === 'tree' ? treeImg : rockImg} alt={obs.type} className="w-full h-full object-cover rounded shadow-md mix-blend-multiply" />
          </div>
        ))}

        {/* YETI */}
        {(gameState === 'playing' || gameState === 'gameover') && renderYeti && (
          <div
            style={{
              position: 'absolute',
              left: renderYeti.x,
              top: renderYeti.y,
              width: renderYeti.width,
              height: renderYeti.height,
            }}
            className="z-30"
          >
            <img src={yetiImg} alt="Yeti" className="w-full h-full object-cover rounded mix-blend-multiply" />
          </div>
        )}
      </div>

    </div>
  );
}