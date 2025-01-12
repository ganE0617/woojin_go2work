import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import characterImg from './character.PNG';
import obstacleImg from './obstacle1.PNG';
import obstacle2Img from './obstacle2.png';

function App() {
  const [characterPosition, setCharacterPosition] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [obstaclePosition, setObstaclePosition] = useState(600);
  const [currentObstacle, setCurrentObstacle] = useState(obstacleImg);
  const [jumpSound] = useState(() => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    audio.volume = 0.5;
    return audio;
  });
  const [speed, setSpeed] = useState(5);

  // 랜덤 장애물 선택
  const getRandomObstacle = useCallback(() => {
    return Math.random() < 0.5 ? obstacleImg : obstacle2Img;
  }, []);

  // 점수 증가 로직
  useEffect(() => {
    if (!gameOver) {
      const scoreInterval = setInterval(() => {
        setScore(prevScore => prevScore + 1);
      }, 100);
      return () => clearInterval(scoreInterval);
    }
  }, [gameOver]);

  // 점수에 따른 속도 증가 로직
  useEffect(() => {
    if (!gameOver) {
      // 100점마다 속도 증가
      const newSpeed = 5 + Math.floor(score / 100);
      setSpeed(Math.min(newSpeed, 15)); // 최대 속도는 15로 제한
    }
  }, [score, gameOver]);

  // 충돌 감지 로직
  const checkCollision = useCallback(() => {
    const characterBottom = characterPosition;
    const characterLeft = 50;
    const characterRight = characterLeft + 80;
    
    const obstacleLeft = obstaclePosition;
    const obstacleRight = obstaclePosition + 40;

    if (characterBottom > 100) {
      return false;
    }

    if (characterRight < obstacleLeft + 20 || characterLeft > obstacleRight - 20) {
      return false;
    }

    return true;
  }, [characterPosition, obstaclePosition]);

  // 장애물 움직임 로직
  useEffect(() => {
    if (!gameOver) {
      const obstacleInterval = setInterval(() => {
        setObstaclePosition(prevPosition => {
          if (prevPosition <= -50) {
            setCurrentObstacle(getRandomObstacle());
            return 600;
          }
          return prevPosition - speed;
        });

        if (checkCollision()) {
          setGameOver(true);
        }
      }, 20);
      return () => clearInterval(obstacleInterval);
    }
  }, [gameOver, checkCollision, getRandomObstacle, speed]);

  // 점프 로직
  const jump = useCallback(() => {
    if (!isJumping && !gameOver) {
      setIsJumping(true);
      setCharacterPosition(200);
      
      try {
        jumpSound.currentTime = 0;
        const playPromise = jumpSound.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log('Audio play failed:', error);
          });
        }
      } catch (error) {
        console.log('Audio play error:', error);
      }

      setTimeout(() => {
        setCharacterPosition(0);
        setIsJumping(false);
      }, 600);
    }
  }, [isJumping, gameOver, jumpSound]);

  // 키보드 이벤트 처리
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.code === 'Space' && !event.repeat) {
        event.preventDefault();
        jump();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [jump]);

  // 클릭 이벤트 처리
  const handleClick = useCallback(() => {
    if (!isJumping) {
      jump();
    }
  }, [isJumping, jump]);

  return (
    <div className="game-container" onClick={handleClick}>
      <h1 className="game-title">우진이의 출근길</h1>
      <div className="score">Score: {score}</div>
      <img
        src={characterImg}
        alt="character"
        className="character"
        style={{ bottom: `${characterPosition}px` }}
      />
      <img
        src={currentObstacle}
        alt="obstacle"
        className="obstacle"
        style={{ left: `${obstaclePosition}px` }}
      />
      <div className="ground" />
      {gameOver && (
        <div className="game-over">
          Game Over!
          <div className="final-score">Final Score: {score}</div>
          <button onClick={() => window.location.reload()}>
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
