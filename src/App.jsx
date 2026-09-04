import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import mayrinImg from './assets/image.png';

export default function App() {
  const [score, setScore] = useState(0);
  const [pos, setPos] = useState({ x: 50, y: 300 });
  const [message, setMessage] = useState('mayrins fea');
  const [gameStatus, setGameStatus] = useState('setup');
  const [timeLeft, setTimeLeft] = useState(60);
  const [numPlayers, setNumPlayers] = useState(1);
  const [players, setPlayers] = useState([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);

  const avatars = [
    { icon: '🤡', name: 'Payaso' },
    { icon: '👹', name: 'Ogro' },
    { icon: '👽', name: 'Alien' },
    { icon: '🧟', name: 'Zombie' },
    { icon: '🧛', name: 'Vampiro' },
    { icon: '🐖', name: 'Cerdito' }
  ];

  // Dificultad extrema
  const currentWidth = Math.max(45, 130 - (score * 0.8));
  const currentInterval = Math.max(130, 600 - (score * 7));

  // Configuración de niveles
  const levels = [
    { threshold: 0, bg: 'bg-slate-950', msg: 'mayrins fea' },
    { threshold: 15, bg: 'bg-rose-900', msg: '¡Qué súper fea eres!' },
    { threshold: 30, bg: 'bg-purple-900', msg: '¡Qué horripilante!' },
    { threshold: 45, bg: 'bg-orange-900', msg: '¡DIOS MÍO QUÉ ASCO!' },
    { threshold: 60, bg: 'bg-red-800', msg: '¡PELIGRO DE FEALDAD!' },
    { threshold: 80, bg: 'bg-blue-900', msg: '¡Casi llegas a 100!' },
    { threshold: 100, bg: 'bg-black', msg: '🔥 MÁXIMA FEALDAD 🔥' },
    { threshold: 130, bg: 'bg-zinc-900', msg: '¡YA CASI!' }
  ];

  const currentLevel = [...levels].reverse().find(l => score >= l.threshold) || levels[0];
  const levelNumber = levels.findIndex(l => l.threshold === currentLevel.threshold) + 1;

  const moveCard = useCallback(() => {
    if (gameStatus !== 'playing') return;
    const maxX = window.innerWidth - currentWidth - 20;
    const maxY = window.innerHeight - currentWidth - 180;
    const randomX = Math.max(10, Math.random() * maxX);
    const randomY = Math.max(180, Math.random() * maxY);
    setPos({ x: randomX, y: randomY });
  }, [currentWidth, gameStatus]);

  useEffect(() => {
    if (gameStatus !== 'playing') return;

    if (score >= 150) {
      finishPlayerTurn();
    } else {
      setMessage(currentLevel.msg);
    }
  }, [score, currentLevel.msg, gameStatus]);

  // Timer Logic
  useEffect(() => {
    if (gameStatus !== 'playing') return;

    if (timeLeft <= 0) {
      finishPlayerTurn();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, gameStatus]);

  useEffect(() => {
    if (gameStatus !== 'playing') return;
    const interval = setInterval(moveCard, currentInterval);
    return () => clearInterval(interval);
  }, [moveCard, currentInterval, gameStatus]);

  const handleTouch = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (gameStatus !== 'playing') return;
    setScore(s => s + 1);
    moveCard();
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setGameStatus('playing');
    setPos({ x: window.innerWidth / 2 - 50, y: window.innerHeight / 2 });
  };

  const finishPlayerTurn = () => {
    const updatedPlayers = [...players];
    updatedPlayers[currentPlayerIndex] = {
      ...updatedPlayers[currentPlayerIndex],
      score,
      level: levelNumber,
      phrase: currentLevel.msg
    };
    setPlayers(updatedPlayers);

    if (currentPlayerIndex < numPlayers - 1) {
      setGameStatus('finished'); // Show summary for this player
    } else {
      // All players finished, go to leaderboard
      const sorted = [...updatedPlayers].sort((a, b) => b.score - a.score);
      setLeaderboard(sorted);
      setGameStatus('leaderboard');
    }
  };

  const nextPlayer = () => {
    setCurrentPlayerIndex(prev => prev + 1);
    setScore(0);
    setTimeLeft(60);
    setGameStatus('playing');
  };

  const resetGame = () => {
    setGameStatus('setup');
    setPlayers([]);
    setCurrentPlayerIndex(0);
  };

  const startRegistration = (count) => {
    const n = Math.max(1, Math.min(20, parseInt(count) || 1));
    setNumPlayers(n);
    setPlayers(Array(n).fill(null).map((_, i) => ({
      name: `Jugador ${i + 1}`,
      score: 0,
      level: 1,
      phrase: '',
      avatar: avatars[i % avatars.length]
    })));
    setGameStatus('registration');
  };

  const handleNameChange = (index, name) => {
    const updatedPlayers = [...players];
    updatedPlayers[index].name = name;
    setPlayers(updatedPlayers);
  };

  const handleAvatarChange = (index, avatar) => {
    const updatedPlayers = [...players];
    updatedPlayers[index].avatar = avatar;
    setPlayers(updatedPlayers);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`fixed inset-0 ${['finished', 'leaderboard'].includes(gameStatus) ? 'bg-black' : currentLevel.bg} transition-colors duration-500 overflow-hidden font-sans select-none touch-none`}>

      {gameStatus === 'setup' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center h-full text-center p-6 bg-slate-950/80 backdrop-blur-md z-[100]"
        >
          <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter mb-8">
            ¿Cuántos van a <span className="text-amber-400">jugar</span>?
          </h1>
          <div className="flex flex-col gap-6 w-full max-w-xs">
            <div className="flex bg-white/10 p-2 rounded-2xl border border-white/20">
              <input
                type="number"
                defaultValue={1}
                onChange={(e) => setNumPlayers(e.target.value)}
                className="w-full bg-transparent text-white font-black text-3xl text-center outline-none"
                min="1"
                max="20"
              />
            </div>
            <button
              onClick={() => startRegistration(numPlayers)}
              className="py-4 bg-amber-400 text-black font-black text-xl rounded-2xl hover:scale-105 transition-all shadow-lg"
            >
              Continuar
            </button>
            <div className="grid grid-cols-4 gap-2 border-t border-white/10 pt-4">
              {[1, 2, 3, 5].map(n => (
                <button
                  key={n}
                  onClick={() => startRegistration(n)}
                  className="py-2 bg-white/5 border border-white/10 text-white font-bold rounded-lg hover:bg-white/20"
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {gameStatus === 'registration' && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col items-center justify-center h-full text-center p-6 bg-slate-950/80 backdrop-blur-md z-[100]"
        >
          <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-8">
            Personaliza a tus <span className="text-amber-400">victimas</span>
          </h1>
          <div className="flex flex-col gap-6 w-full max-w-sm mb-8 overflow-y-auto max-h-[60vh] px-4 py-2">
            {players.map((p, i) => (
              <div key={i} className="flex flex-col gap-3 p-4 bg-white/5 border border-white/10 rounded-3xl">
                <div className="flex items-center gap-4">
                  <div className="text-4xl p-2 bg-white/10 rounded-2xl shadow-inner">
                    {p.avatar.icon}
                  </div>
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => handleNameChange(i, e.target.value)}
                    className="w-full bg-transparent border-b border-white/20 py-2 text-white font-bold focus:border-amber-400 outline-none"
                    placeholder={`Nombre ${i + 1}`}
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {avatars.map((av, avIdx) => (
                    <button
                      key={avIdx}
                      onClick={() => handleAvatarChange(i, av)}
                      className={`text-2xl p-2 rounded-xl border transition-all ${p.avatar.icon === av.icon ? 'bg-amber-400 border-amber-500' : 'bg-white/5 border-white/10'
                        }`}
                    >
                      {av.icon}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={startGame}
            className="px-12 py-5 bg-amber-400 text-black font-black uppercase text-sm tracking-widest rounded-full hover:scale-110 active:scale-95 transition-transform shadow-[0_0_30px_rgba(251,191,36,0.4)]"
          >
            Empezar Destrucción
          </button>
        </motion.div>
      )}

      {gameStatus === 'playing' && (
        <>
          {/* Marcador superior */}
          <div className="absolute top-10 left-0 w-full text-center z-50 pointer-events-none">
            <div className="absolute top-[-2rem] left-0 w-full flex justify-center">
              <span className="bg-amber-400 text-black px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl">
                <span className="text-base">{players[currentPlayerIndex]?.avatar?.icon}</span>
                Turno de: {players[currentPlayerIndex]?.name}
              </span>
            </div>
            <div className="flex justify-between px-10 items-start">
              <div className="text-left">
                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] mb-1">
                  Tiempo
                </p>
                <p className="text-4xl font-black text-white italic">
                  {formatTime(timeLeft)}
                </p>
                <div className="w-24 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                  <motion.div
                    className="h-full bg-amber-400"
                    initial={{ width: "100%" }}
                    animate={{ width: `${(timeLeft / 60) * 100}%` }}
                    transition={{ duration: 1, ease: "linear" }}
                  />
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] mb-1">
                  Puntos
                </p>
                <motion.div
                  key={score}
                  initial={{ scale: 1.4, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="text-6xl font-black text-white italic"
                >
                  {score}
                </motion.div>
              </div>
            </div>

            <div className="mt-4">
              <AnimatePresence mode="wait">
                <motion.p
                  key={message}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.5 }}
                  className="text-amber-400 font-black text-lg uppercase tracking-widest px-4 italic drop-shadow-md"
                >
                  {message}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          {/* La Card "Indomable" */}
          <motion.div
            animate={{
              x: pos.x,
              y: pos.y,
              width: currentWidth,
              rotate: [0, -10, 10, -5, 5, 0]
            }}
            transition={{
              x: { type: "tween", duration: 0.1, ease: "linear" },
              y: { type: "tween", duration: 0.1, ease: "linear" },
              rotate: { repeat: Infinity, duration: 0.2 }
            }}
            onPointerDown={handleTouch}
            className="absolute cursor-pointer p-1.5 bg-white rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.8)] flex flex-col items-center border-4 border-white/40 active:brightness-75"
            style={{ width: currentWidth }}
          >
            <div className="w-full aspect-square rounded-xl overflow-hidden mb-1.5 bg-slate-100">
              <img
                src={mayrinImg}
                alt="Mayrin"
                className="w-full h-full object-cover grayscale brightness-125"
              />
            </div>
            <div className="text-center overflow-hidden whitespace-nowrap px-0.5">
              <h1 className="font-black text-slate-900 uppercase tracking-tighter leading-none" style={{ fontSize: currentWidth * 0.15 }}>
                FEA
              </h1>
            </div>
          </motion.div>
        </>
      )}

      {gameStatus === 'finished' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center h-full text-center p-6 z-[100]"
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="mb-8 p-4 bg-white rounded-[3rem] shadow-[0_0_50px_rgba(255,255,255,0.3)]"
          >
            <img src={mayrinImg} alt="Mayrin" className="w-32 h-32 object-cover rounded-[2rem]" />
          </motion.div>

          <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none mb-8">
            RESULTADOS
          </h1>

          <div className="grid grid-cols-2 gap-8 mb-12 w-full max-w-sm">
            <div className="bg-white/5 border border-white/10 p-4 rounded-3xl backdrop-blur-sm">
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Nivel</p>
              <p className="text-4xl font-black text-amber-400 italic">{levelNumber}</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-3xl backdrop-blur-sm">
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Puntos</p>
              <p className="text-4xl font-black text-white italic">{score}</p>
            </div>
          </div>

          <div className="mb-12">
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] mb-2 flex items-center justify-center gap-2">
              <span className="text-lg">{players[currentPlayerIndex]?.avatar?.icon}</span>
              Sentencia para {players[currentPlayerIndex]?.name}
            </p>
            <p className="text-2xl font-black text-white uppercase italic tracking-tighter">
              "{currentLevel.msg}"
            </p>
          </div>

          <button
            onClick={nextPlayer}
            className="px-12 py-4 bg-amber-400 text-black font-black uppercase text-sm tracking-widest rounded-full hover:scale-110 active:scale-95 transition-transform"
          >
            Siguiente Jugador
          </button>
        </motion.div>
      )}

      {gameStatus === 'leaderboard' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center h-full text-center p-6 z-[100]"
        >
          <h1 className="text-6xl font-black text-white uppercase italic tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/20">
            RANKING <span className="text-amber-400">FEA</span>
          </h1>

          <div className="w-full max-w-sm flex flex-col gap-3 mb-12">
            {leaderboard.map((p, i) => (
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={i}
                className={`flex items-center justify-between p-4 rounded-2xl backdrop-blur-md border ${i === 0 ? 'bg-amber-400 border-amber-500 text-black' : 'bg-white/5 border-white/10 text-white'
                  }`}
              >
                <div className="flex items-center gap-4">
                  <span className={`text-2xl font-black ${i === 0 ? 'text-black' : 'text-amber-400'}`}>#{i + 1}</span>
                  <div className="text-3xl p-1 bg-black/10 rounded-lg">{p.avatar.icon}</div>
                  <div className="text-left">
                    <p className="font-black uppercase tracking-tighter leading-none">{p.name}</p>
                    <p className={`text-[10px] font-bold uppercase opacity-60`}>Lvl {p.level}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black italic">{p.score}</p>
                  <p className="text-[8px] uppercase font-bold opacity-60">Puntos</p>
                </div>
              </motion.div>
            ))}
          </div>

          <button
            onClick={resetGame}
            className="px-12 py-4 bg-white text-black font-black uppercase text-sm tracking-widest rounded-full hover:scale-110 active:scale-95 transition-transform shadow-2xl"
          >
            Jugar de nuevo
          </button>
        </motion.div>
      )}

      {/* Rastro de glitch de fondo apenas visible */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

      <style dangerouslySetInnerHTML={{
        __html: `
        body { margin: 0; background-color: #000; overflow: hidden; touch-action: none; }
        * { -webkit-tap-highlight-color: transparent; }
      `}} />
    </div>
  );
}