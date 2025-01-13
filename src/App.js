import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import characterImg from './assets/character.PNG';
import obstacle1Img from './assets/obstacle1.PNG';
import obstacle2Img from './assets/obstacle2.png';

function App() {
  const [characterPosition, setCharacterPosition] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [obstacles, setObstacles] = useState([]);
  const [currentObstacle, setCurrentObstacle] = useState(obstacle1Img);
  const [jumpSound] = useState(() => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    audio.volume = 0.5;
    return audio;
  });
  const [speed, setSpeed] = useState(5);
  const [nickname, setNickname] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);

  // 리더보드 가져오기
  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/leaderboard');
      const data = await response.json();
      setLeaderboard(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  // 컴포넌트 마운트 시 리더보드 가져오기
  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // 닉네임 등록
  const registerPlayer = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('http://localhost:5001/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nickname }),
      });
      
      if (response.ok) {
        setIsRegistered(true);
        // 카운트다운 시작
        setCountdown(3);
      } else {
        const data = await response.json();
        if (response.status === 400) {
          setError('이미 사용 중인 닉네임입니다. 다른 닉네임을 선택해주세요.');
        } else {
          setError(data.message || '알 수 없는 오류가 발생했습니다.');
        }
      }
    } catch (error) {
      setError('서버 연결에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 카운트다운 효과
  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown === 0) {
      setGameStarted(true);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  // 게임 시작 시 점수 초기화
  useEffect(() => {
    if (gameStarted) {
      setScore(0);
      setGameOver(false);
      setObstacles([]);
    }
  }, [gameStarted]);

  // 랜덤 장애물 생성 함수
  const createObstacle = useCallback(() => {
    return {
      id: Date.now(),  // 고유 ID
      position: 800,   // 게임 창 너비
      type: Math.random() < 0.5 ? obstacle1Img : obstacle2Img
    };
  }, []);

  // 장애물 움직임 및 생성 로직
  useEffect(() => {
    if (!gameOver && gameStarted) {
      const moveInterval = setInterval(() => {
        setObstacles(prevObstacles => {
          // 화면 밖으로 나간 장애물 제거
          const filteredObstacles = prevObstacles.filter(obs => obs.position > -50);
          
          // 새로운 장애물 생성 여부 결정
          const lastObstacle = filteredObstacles[filteredObstacles.length - 1];
          const shouldAddObstacle = !lastObstacle || 
            (lastObstacle.position < 600 && Math.random() < 0.02); // 2% 확률로 새 장애물 생성

          // 새 장애물 추가
          if (shouldAddObstacle) {
            return [...filteredObstacles, createObstacle()];
          }

          // 장애물 이동
          return filteredObstacles.map(obs => ({
            ...obs,
            position: obs.position - speed
          }));
        });

        // 충돌 감지
        obstacles.forEach(obstacle => {
          if (checkCollision(obstacle.position)) {
            setGameOver(true);
          }
        });
      }, 20);

      return () => clearInterval(moveInterval);
    }
  }, [gameOver, gameStarted, speed, createObstacle, obstacles]);

  // 충돌 감지 로직 수정
  const checkCollision = useCallback((obstaclePosition) => {
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
  }, [characterPosition]);

  // 게임 재시작 로직 수정
  const restartGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setObstacles([]);  // 장애물 초기화
    setCharacterPosition(0);
  };

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

  // 게임 오버 시 점수 저장
  useEffect(() => {
    if (gameOver && isRegistered) {
      const saveScore = async () => {
        try {
          await fetch('http://localhost:5001/api/scores', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nickname, score }),
          });
          fetchLeaderboard(); // 리더보드 업데이트
        } catch (error) {
          console.error('Error saving score:', error);
        }
      };
      saveScore();
    }
  }, [gameOver, score, nickname, isRegistered]);

  if (!isRegistered) {
    return (
      <div className="registration-container">
        <h1 className="game-title">우진이의 출근길</h1>
        <form onSubmit={registerPlayer} className="registration-form">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임을 입력하세요"
            required
          />
          {error && <div className="error-message">{error}</div>}
          <button type="submit">게임 시작</button>
        </form>
      </div>
    );
  }

  if (countdown !== null && !gameStarted) {
    return (
      <div className="countdown-container">
        <h1 className="game-title">우진이의 출근길</h1>
        <div className="countdown">{countdown}</div>
      </div>
    );
  }

  return (
    <div className="game-container" onClick={handleClick}>
      <h1 className="game-title">우진이의 출근길</h1>
      {countdown !== null && !gameStarted ? (
        <div className="countdown-container">
          <div className="countdown">{countdown}</div>
        </div>
      ) : (
        <>
          <div className="score">Score: {score}</div>
          <div className="game-area">
            <img
              src={characterImg}
              alt="Character"
              className="character"
              style={{ bottom: `${characterPosition}px` }}
            />
            {obstacles.map(obstacle => (
              <img
                key={obstacle.id}
                src={obstacle.type}
                alt="Obstacle"
                className="obstacle"
                style={{ left: `${obstacle.position}px` }}
              />
            ))}
            <div className="ground" />
          </div>
          {gameOver && (
            <div className="game-over">
              <h2>Game Over!</h2>
              <p>Score: {score}</p>
              <button onClick={restartGame}>다시 시작</button>
            </div>
          )}
          <div className="leaderboard">
            <h2>Leaderboard</h2>
            <ul>
              {leaderboard.map((entry, index) => (
                <li key={index}>
                  {entry.nickname}: {entry.highScore}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
