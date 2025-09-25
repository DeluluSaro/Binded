import { useThemeColors } from '@/hooks/use-theme-color';
import { Accelerometer } from 'expo-sensors';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface AsteroidDodgeProps {
  visible: boolean;
  onClose: () => void;
}

interface Asteroid {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  rotation: number;
  rotationSpeed: number;
}

const GAME_WIDTH = Dimensions.get('window').width * 0.9;
const GAME_HEIGHT = Dimensions.get('window').height * 0.6;
const SHIP_SIZE = 40;
const MIN_ASTEROID_SIZE = 30;
const MAX_ASTEROID_SIZE = 60;
const BASE_ASTEROID_SPEED = 2;
const GYROSCOPE_SENSITIVITY = 15;
const BACKGROUND_SPEED = 1;
const ASTEROID_SPAWN_RATE = 0.02; // Probability per frame

const AsteroidDodge: React.FC<AsteroidDodgeProps> = ({ visible, onClose }) => {
  const colors = useThemeColors();
  const [shipX, setShipX] = useState(GAME_WIDTH / 2 - SHIP_SIZE / 2);
  const [shipY, setShipY] = useState(GAME_HEIGHT - 80);
  const [backgroundOffset, setBackgroundOffset] = useState(0);
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState(1);
  const gameLoopRef = useRef<number | null>(null);
  const asteroidIdRef = useRef(0);
  const accelerometerSubscription = useRef<any>(null);
  const scoreRef = useRef(0);

  const startAccelerometer = useCallback(async () => {
    try {
      // Check if accelerometer is available
      const isAvailable = await Accelerometer.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          'Sensors Not Available',
          'This device does not support accelerometer sensors. The game will use touch controls instead.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Set update interval
      Accelerometer.setUpdateInterval(16); // 60 FPS
      
      // Add listener
      accelerometerSubscription.current = Accelerometer.addListener((accelerometerData: any) => {
        if (isPlaying && !gameOver) {
          // Use X-axis for horizontal movement (tilt left/right)
          const tiltX = accelerometerData.x * GYROSCOPE_SENSITIVITY;
          
          // Update ship position based on tilt
          setShipX(prevX => {
            const newX = prevX - tiltX; // Negative for natural tilt direction
            return Math.max(0, Math.min(GAME_WIDTH - SHIP_SIZE, newX));
          });
        }
      });
      
      console.log('Accelerometer started successfully');
    } catch (error) {
      console.log('Accelerometer error:', error);
      Alert.alert(
        'Sensor Error',
        'Could not access device sensors. The game will use touch controls instead.',
        [{ text: 'OK' }]
      );
    }
  }, [isPlaying, gameOver]);

  const stopAccelerometer = useCallback(() => {
    if (accelerometerSubscription.current) {
      accelerometerSubscription.current.remove();
      accelerometerSubscription.current = null;
    }
  }, []);

  const resetGame = () => {
    setShipX(GAME_WIDTH / 2 - SHIP_SIZE / 2);
    setShipY(GAME_HEIGHT - 80);
    setBackgroundOffset(0);
    setAsteroids([]);
    setScore(0);
    setGameOver(false);
    setIsPlaying(false);
    setGameStarted(false);
    setDifficulty(1);
    asteroidIdRef.current = 0;
    scoreRef.current = 0;
    console.log('Asteroid Dodge game reset - Ship at bottom center');
  };

  const generateAsteroid = useCallback((): Asteroid => {
    const size = Math.random() * (MAX_ASTEROID_SIZE - MIN_ASTEROID_SIZE) + MIN_ASTEROID_SIZE;
    const x = Math.random() * (GAME_WIDTH - size);
    const speed = BASE_ASTEROID_SPEED + (difficulty * 0.5) + (Math.random() * 2);
    
    return {
      id: asteroidIdRef.current++,
      x,
      y: -size,
      size,
      speed,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 10 // Random rotation speed
    };
  }, [difficulty]);

  const checkCollision = (shipX: number, shipY: number, asteroid: Asteroid): boolean => {
    const shipCenterX = shipX + SHIP_SIZE / 2;
    const shipCenterY = shipY + SHIP_SIZE / 2;
    const asteroidCenterX = asteroid.x + asteroid.size / 2;
    const asteroidCenterY = asteroid.y + asteroid.size / 2;
    
    const distance = Math.sqrt(
      Math.pow(shipCenterX - asteroidCenterX, 2) + 
      Math.pow(shipCenterY - asteroidCenterY, 2)
    );
    
    return distance < (SHIP_SIZE / 2 + asteroid.size / 2 - 5); // Small buffer for better gameplay
  };

  const updateGame = useCallback(() => {
    // Update background movement (upward scroll)
    setBackgroundOffset(prevOffset => prevOffset + BACKGROUND_SPEED);
    
    // Update score
    scoreRef.current += 1;
    setScore(scoreRef.current);
    
    // Increase difficulty every 500 points
    const newDifficulty = Math.floor(scoreRef.current / 500) + 1;
    if (newDifficulty !== difficulty) {
      setDifficulty(newDifficulty);
    }

    // Update asteroids
    setAsteroids(prevAsteroids => {
      let newAsteroids = prevAsteroids.map(asteroid => ({
        ...asteroid,
        y: asteroid.y + asteroid.speed,
        rotation: asteroid.rotation + asteroid.rotationSpeed
      })).filter(asteroid => asteroid.y < GAME_HEIGHT + asteroid.size);

      // Spawn new asteroids
      const spawnRate = ASTEROID_SPAWN_RATE * difficulty;
      if (Math.random() < spawnRate) {
        newAsteroids.push(generateAsteroid());
      }

      // Check collisions
      for (const asteroid of newAsteroids) {
        if (checkCollision(shipX, shipY, asteroid)) {
          console.log('Collision detected!');
          setGameOver(true);
          setIsPlaying(false);
          break;
        }
      }

      return newAsteroids;
    });
  }, [shipX, shipY, difficulty, generateAsteroid]);

  const startGame = () => {
    console.log('Game started!');
    if (!gameStarted) {
      setGameStarted(true);
      setIsPlaying(true);
    }
  };

  const handleTouchStart = (event: any) => {
    if (isPlaying && !gameOver) {
      const { locationX } = event.nativeEvent;
      const centerX = GAME_WIDTH / 2;
      
      // Move ship towards touch position
      if (locationX < centerX) {
        setShipX(prevX => Math.max(0, prevX - 20));
      } else {
        setShipX(prevX => Math.min(GAME_WIDTH - SHIP_SIZE, prevX + 20));
      }
    }
  };

  const handleTouchEnd = () => {
    // Touch ended, ship continues with current position
  };

  const renderAsteroids = () => {
    return asteroids.map(asteroid => (
      <View
        key={asteroid.id}
        style={[
          styles.asteroid,
          {
            position: 'absolute',
            left: asteroid.x,
            top: asteroid.y,
            width: asteroid.size,
            height: asteroid.size,
            backgroundColor: colors.tint,
            transform: [{ rotate: `${asteroid.rotation}deg` }]
          }
        ]}
      />
    ));
  };

  const renderStars = () => {
    const stars = [];
    const starOffset = backgroundOffset * 0.5;
    
    for (let i = 0; i < 20; i++) {
      const x = (i * 47) % GAME_WIDTH;
      const y = ((i * 73 + starOffset) % (GAME_HEIGHT + 100)) - 50;
      stars.push(
        <View
          key={i}
          style={[
            styles.star,
            {
              left: x,
              top: y,
              backgroundColor: colors.text,
              opacity: 0.6
            }
          ]}
        />
      );
    }
    return stars;
  };

  // Initialize game
  useEffect(() => {
    if (visible) {
      resetGame();
      startAccelerometer();
    } else {
      stopAccelerometer();
    }
    
    return () => {
      stopAccelerometer();
    };
  }, [visible, startAccelerometer, stopAccelerometer]);

  // Game loop
  useEffect(() => {
    if (isPlaying && !gameOver) {
      gameLoopRef.current = setInterval(() => {
        updateGame();
      }, 16); // 60 FPS
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [isPlaying, gameOver, updateGame]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.gameContainer, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>Asteroid Dodge</Text>
            <View style={styles.scoreContainer}>
              <Text style={[styles.score, { color: colors.tint }]}>Score: {score}</Text>
              <Text style={[styles.difficulty, { color: colors.text }]}>Level: {difficulty}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeText, { color: colors.text }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Game Area */}
          <TouchableOpacity 
            style={[styles.gameArea, { backgroundColor: '#000814' }]}
            onPress={startGame}
            onPressIn={handleTouchStart}
            onPressOut={handleTouchEnd}
            activeOpacity={1}
          >
            {/* Background Stars */}
            {renderStars()}
            
            {/* Spaceship */}
            <View
              style={[
                styles.ship,
                {
                  position: 'absolute',
                  left: shipX,
                  top: shipY,
                  width: SHIP_SIZE,
                  height: SHIP_SIZE,
                }
              ]}
            >
              {/* Ship body */}
              <View style={[styles.shipBody, { backgroundColor: colors.tint }]} />
              {/* Ship wings */}
              <View style={[styles.shipWingLeft, { backgroundColor: colors.tint }]} />
              <View style={[styles.shipWingRight, { backgroundColor: colors.tint }]} />
              {/* Ship exhaust */}
              {isPlaying && (
                <View style={[styles.exhaust, { backgroundColor: '#ff6b35' }]} />
              )}
            </View>
            
            {/* Asteroids */}
            {renderAsteroids()}

            {/* Game Status */}
            {gameOver && (
              <View style={styles.gameOverContainer}>
                <Text style={[styles.gameOverText, { color: colors.text }]}>Game Over!</Text>
                <Text style={[styles.finalScore, { color: colors.tint }]}>Final Score: {score}</Text>
                <Text style={[styles.finalLevel, { color: colors.text }]}>Level Reached: {difficulty}</Text>
                <TouchableOpacity 
                  style={[styles.restartButton, { backgroundColor: colors.tint }]}
                  onPress={resetGame}
                >
                  <Text style={styles.restartText}>Play Again</Text>
                </TouchableOpacity>
              </View>
            )}

            {!gameStarted && !gameOver && (
              <View style={styles.startContainer}>
                <Text style={[styles.startText, { color: colors.text }]}>Tap to Launch!</Text>
                <Text style={[styles.instructionText, { color: colors.text }]}>Tilt your phone or tap left/right to dodge asteroids</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Instructions */}
          <View style={[styles.instructionsContainer, { borderTopColor: colors.border }]}>
            <Text style={[styles.instructionText, { color: colors.text }]}>
              🚀 Tilt your phone or tap to steer your ship • Avoid falling asteroids • Survive as long as possible!
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameContainer: {
    width: GAME_WIDTH,
    height: Dimensions.get('window').height * 0.8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'Outfit_700Bold',
  },
  scoreContainer: {
    alignItems: 'center',
  },
  score: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Outfit_400Regular',
  },
  difficulty: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Outfit_400Regular',
    opacity: 0.8,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  closeText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  gameArea: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
  },
  ship: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  shipBody: {
    width: 20,
    height: 30,
    borderRadius: 10,
    position: 'absolute',
  },
  shipWingLeft: {
    width: 8,
    height: 15,
    borderRadius: 4,
    position: 'absolute',
    left: -6,
    top: 10,
  },
  shipWingRight: {
    width: 8,
    height: 15,
    borderRadius: 4,
    position: 'absolute',
    right: -6,
    top: 10,
  },
  exhaust: {
    width: 6,
    height: 12,
    borderRadius: 3,
    position: 'absolute',
    bottom: -8,
  },
  asteroid: {
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  gameOverContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -120 }, { translateY: -80 }],
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 25,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  gameOverText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    fontFamily: 'Outfit_700Bold',
  },
  finalScore: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
    fontFamily: 'Outfit_400Regular',
  },
  finalLevel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 20,
    fontFamily: 'Outfit_400Regular',
    opacity: 0.8,
  },
  restartButton: {
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 10,
  },
  restartText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
  },
  startContainer: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: [{ translateX: -120 }, { translateY: -40 }],
    alignItems: 'center',
  },
  startText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'Outfit_700Bold',
  },
  instructionText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: 'Outfit_400Regular',
    lineHeight: 20,
  },
  instructionsContainer: {
    padding: 15,
    alignItems: 'center',
    borderTopWidth: 1,
  },
});

export default AsteroidDodge;