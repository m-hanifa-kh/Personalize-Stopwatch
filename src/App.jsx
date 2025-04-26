
import { gapi } from 'gapi-script';
import React, { useState, useEffect } from 'react';
import { initGoogleAPI } from './googleLogin';
import './App.css';
import logo from '/logo.png';
import { FaHistory, FaTrash } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useRef } from 'react';



function getCurrentTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const day = now.getDate();
  const month = now.toLocaleString('default', { month: 'long' });
  const time = now.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return `${year}, ${day} ${month} - ${time.toLowerCase()}`;
}

function formatDuration(time) {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;

  let display = '';
  if (minutes > 0) display += `${minutes}m `;
  if (seconds > 0 || minutes === 0) display += `${seconds}s`;

  return display.trim();
}


function App() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [showHistory, setShowHistory] = useState(true);
  const startTimeRef = useRef(null);
  const animationFrameRef = useRef(null);
  const elapsedRef = useRef(0);
  const [displayTime, setDisplayTime] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState(null);
  const handleLogin = async () => {
    const auth = gapi.auth2.getAuthInstance();
    try {
      const user = await auth.signIn();
      setUser(user.getBasicProfile());
      setIsSignedIn(true);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = () => {
    const auth = gapi.auth2.getAuthInstance();
    auth.signOut();
    setUser(null);
    setIsSignedIn(false);
  };


  useEffect(() => {
    initGoogleAPI();
  }, []);




  // 1. Load history when app starts
  useEffect(() => {
    const savedHistory = localStorage.getItem('stopwatch-history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // 2. Save history every time it changes
  useEffect(() => {
    localStorage.setItem('stopwatch-history', JSON.stringify(history));
  }, [history]);
  
  
  useEffect(() => {
    const update = () => {
      if (isRunning && startTimeRef.current != null) {
        const elapsed = Date.now() - startTimeRef.current;
        setTime(elapsed);
        setDisplayTime(elapsed);
        elapsedRef.current = elapsed;
        animationFrameRef.current = requestAnimationFrame(update);
      }
    };

    if (isRunning) {
      startTimeRef.current = Date.now() - time; // resume from paused time
      animationFrameRef.current = requestAnimationFrame(update);
    }

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isRunning]);


  
  const formatTime = (time) => {
    const totalSeconds = Math.floor(time / 1000);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const hours = Math.floor(totalSeconds / 3600);

    const getSeconds = `0${seconds}`.slice(-2);
    const getMinutes = `0${minutes}`.slice(-2);
    const getHours = `0${hours}`.slice(-2);

    return `${getHours}:${getMinutes}:${getSeconds}`;
  };



  useEffect(() => {
    let intervalId;

    if (isRunning) {
      // Instantly update the title without waiting
      const elapsed = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
      document.title = formatTime(elapsed);

      intervalId = setInterval(() => {
        const elapsed = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
        document.title = formatTime(elapsed);
      }, 1000);
    } else {
      document.title = 'Tarot Insight';
    }

    return () => {
      clearInterval(intervalId);
    };
  }, [isRunning]);




  const deleteHistoryItem = (id) => {
    setHistory((prevHistory) => prevHistory.filter(item => item.id !== id));
  };

  return (
    <><div className={`App-container ${isDarkMode ? 'dark' : ''}`}>
        <img src={logo} alt="Logo" className="brandlogo"/>
        <div className="App">

          <div className="google-login-section">
            {!isSignedIn ? (
              <button onClick={handleLogin} className="login-btn">Login with Google</button>
            ) : (
              <div>
                <p>Welcome, {user?.getName()}!</p>
                <button onClick={handleLogout} className="logout-btn">Logout</button>
              </div>
            )}
          </div>

          
        <h1>Tarot Insight</h1>
        <h2 className="subtitle"> Psychological Tarot Reading</h2>
        <p className="description">
          Mengungkap pesan semesta <br />
           by @mhanifakh
        </p>

        <div className="toggle-theme">
          <button
            onClick={() => setIsDarkMode(prev => !prev)}
            className="theme-toggle"
            aria-label="Toggle Theme"
          >
            {isDarkMode ? '🌞' : '🌙'}
          </button>
        </div>



          <h2>{formatTime(displayTime)}</h2>
          <div>
              {!isRunning && time === 0 && (
                  <button 
                     className="start-btn"
                    onClick={() => setIsRunning(true)}>Start</button>
              )}
              {isRunning && (
              <button 
                className="pause-btn" 
                onClick={() => {
                setIsRunning(false);
                elapsedRef.current = time; // save elapsed time
              }}>
                Pause
              </button>
              )}
          {!isRunning && time !== 0 && (
           <button  className="start-btn" onClick={() => setIsRunning(true)}>Resume</button>
              )}
            {time !== 0 && (
      <button
        className="reset-btn"
        onClick={() => {
          const now = Date.now();
          const actualElapsed = now - (startTimeRef.current ?? now);


          setHistory(prev => [
            ...prev,
            {
              id: Date.now(),
              name: 'Untitled',
              time: formatDuration(Math.floor(actualElapsed / 1000)),
              timestamp: getCurrentTimestamp(),
            },
          ]);
          setTime(0);
          setDisplayTime(0);
          elapsedRef.current = 0;
          setIsRunning(false);
          setEditingId(null);
          setEditingText('');
        }}
      >
        Reset
      </button>

            )}

          <div className="history-section">
            <div className="history-toggle">
               <h3 style={{ margin: 0 }}>History</h3>
                <button
                  onClick={() => setShowHistory(prev => !prev)}
                  className={showHistory ? '' : 'rotate'}
                  aria-label="Toggle History"
                >
                  <FaHistory />
                </button>
            </div>

            <AnimatePresence>
                {showHistory && (
                  <motion.ul
                    className="history-list"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden', marginTop: '1rem' }}
                  >
                    {history.map((entry) => (
                      <li key={entry.id} className="history-item-container">
                        {/* History entry code Start here */}
                        {editingId === entry.id ? (
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onBlur={() => {
                              const updated = history.map((item) =>
                                item.id === entry.id ? { ...item, name:  editingText } : item
                              );
                              setHistory(updated);
                              setEditingId(null);
                            }}
                            autoFocus
                          />
                        ) : (
                          <div
                            className="history-item"
                            onDoubleClick={() => {
                              setEditingId(entry.id);
                              setEditingText(entry.name);
                            }}
                          >
                            <div className="history-text">
                              <strong>{entry.name}</strong> — {entry.time}
                              <br />
                              <span>{entry.timestamp}</span>
                            </div>
                            <button
                              onClick={() => deleteHistoryItem(entry.id)}
                              className="delete-btn"
                              aria-label="Delete History Item"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                    {/* history entry code End*/}
                  </motion.ul>
                 )}
              </AnimatePresence> {/* Ends the animation */}
            </div> {/* Ends .history-section */}
          </div> {/* This one closes the buttons wrapper */}
        </div> {/* This one closes the .App inner */}
      </div> {/* This one closes the .App-container */}
    </>
  );
}

export default App;
