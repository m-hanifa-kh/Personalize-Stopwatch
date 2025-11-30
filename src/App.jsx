import { gapi } from 'gapi-script';
import React, { useState, useEffect } from 'react';
import { initGoogleAPI } from './services/googleAuth';
import logo from '/logo.png';
import './App.css';
import { useStopwatch } from './hooks/useStopwatch';
import {
  uploadHistoryToDrive,
  downloadHistoryFromDrive,
} from './services/googleDriveService';
import StopwatchDisplay from './components/StopwatchDisplay';
import Controls from './components/Controls';
import LapList from './components/LapList';
import HistoryList from './components/HistoryList';
import ConflictModal from './components/ConflictModal';
import SettingsModal from './components/SettingsModal';
import { formatTime } from './utils/timeUtils';
import { FaCog } from 'react-icons/fa';

function App() {
  const {
    time,
    isRunning,
    currentLaps,
    start,
    pause,
    lap,
    stop,
    updateLapName,
  } = useStopwatch();

  const [history, setHistory] = useState([]);
  const [expandedHistoryItem, setExpandedHistoryItem] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [editingLapId, setEditingLapId] = useState(null);
  const [showHistory, setShowHistory] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [conflictModalVisible, setConflictModalVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [fileToKeep, setFileToKeep] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initGoogleAPI();
  }, []);

  // 1. Load history when app starts
  useEffect(() => {
    const savedHistory = localStorage.getItem('stopwatch-history');
    if (savedHistory) {
      const parsedHistory = JSON.parse(savedHistory);
      // Ensure each history item has a laps array for consistency
      const historyWithLaps = parsedHistory.map((item) => ({
        ...item,
        laps: item.laps || [], // Add empty laps array if missing
        isExpanded: item.isExpanded || false, // Add isExpanded flag if missing
      }));
      setHistory(historyWithLaps);
    }
  }, []);

  // 2. Save history every time it changes
  useEffect(() => {
    localStorage.setItem('stopwatch-history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (isRunning) {
      document.title = formatTime(time, false);
    } else {
      document.title = 'Tarot Insight';
    }
  }, [isRunning, time]);

  const handleStop = () => {
    const sessionData = stop();
    setHistory((prev) => [...prev, sessionData]);
    setEditingId(null);
    setEditingText('');
  };

  const handleLogin = async () => {
    const auth = gapi.auth2.getAuthInstance();
    setLoading(true);
    try {
      const user = await auth.signIn();
      setUser(user.getBasicProfile());
      setIsSignedIn(true);
      await handleDownloadHistory(); // download after login
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await handleUploadHistory(); // Save history before logout
    const auth = gapi.auth2.getAuthInstance();
    auth.signOut();
    setUser(null);
    setIsSignedIn(false);
  };

  const handleUploadHistory = async () => {
    setLoading(true);
    try {
      await uploadHistoryToDrive(history);
    } catch {
      alert('Failed to upload history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadHistory = async () => {
    setLoading(true);
    try {
      const result = await downloadHistoryFromDrive();
      if (result.status === 'success') {
        const historyWithLaps = result.data.map((item) => ({
          ...item,
          laps: item.laps || [],
          isExpanded: item.isExpanded || false,
        }));
        setHistory(historyWithLaps);
        console.log('History loaded from Drive!');
      } else if (result.status === 'conflict') {
        setConflictModalVisible(true);
        setFileToKeep({ file1: result.files[0], file2: result.files[1] });
      } else if (result.status === 'no_file') {
        console.log('No history file found in Drive.');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert(`Failed to download history: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveConflict = async (keepFile) => {
    const parseAndSetHistory = (content) => {
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        } else {
          console.error('Invalid history file: not an array');
          alert('Error: Invalid history file format.');
        }
      } catch (e) {
        console.error('Failed to parse history file', e);
        alert('Error: Failed to load history file.');
      }
    };

    if (keepFile === 'file1') {
      parseAndSetHistory(fileToKeep.file1.content);
    } else {
      parseAndSetHistory(fileToKeep.file2.content);
    }

    setConflictModalVisible(false);
    await handleUploadHistory();
  };

  const toggleHistoryItem = (id) => {
    setExpandedHistoryItem(expandedHistoryItem === id ? null : id);
  };

  const deleteHistoryItem = (id) => {
    setHistory((prevHistory) => prevHistory.filter((item) => item.id !== id));
  };

  const updateHistoryName = (id, newName) => {
    const updated = history.map((item) =>
      item.id === id ? { ...item, name: newName } : item
    );
    setHistory(updated);
    setEditingId(null);
  };

  const updateHistoryLapName = (historyId, lapId, newName) => {
    const updatedHistory = history.map((item) =>
      item.id === historyId
        ? {
          ...item,
          laps: item.laps.map((l) =>
            l.id === lapId ? { ...l, name: newName } : l
          ),
        }
        : item
    );
    setHistory(updatedHistory);
  };

  return (
    <>
      <div className={`App-container ${isDarkMode ? 'dark' : ''}`}>
        <img src={logo} alt="Logo" className="brandlogo" />
        <div className="App">
          <h1>Tarot Insight</h1>
          <h2 className="subtitle"> Psychological Tarot Reading</h2>
          <p className="description">
            Mengungkap pesan semesta <br /> by @mhanifakh
          </p>
          <div className="toggle-theme">
            <button
              onClick={() => setIsDarkMode((prev) => !prev)}
              className="theme-toggle"
              aria-label="Toggle Theme"
            >
              {' '}
              {isDarkMode ? '🌞' : '🌙'}
            </button>
            <button
              onClick={() => setSettingsVisible(true)}
              className="settings-toggle"
              aria-label="Open Settings"
            >
              <FaCog />
            </button>
          </div>

          <StopwatchDisplay displayTime={time} />

          <Controls
            isRunning={isRunning}
            time={time}
            onStart={start}
            onPause={pause}
            onStop={handleStop}
            onLap={lap}
            onResume={start}
          />

          <LapList
            laps={currentLaps}
            editingLapId={editingLapId}
            onEditLap={setEditingLapId}
            onUpdateLapName={updateLapName}
            onBlurLap={() => setEditingLapId(null)}
          />

          <HistoryList
            history={history}
            showHistory={showHistory}
            toggleHistory={() => setShowHistory((prev) => !prev)}
            expandedHistoryItem={expandedHistoryItem}
            onToggleHistoryItem={toggleHistoryItem}
            editingId={editingId}
            setEditingId={setEditingId}
            editingText={editingText}
            setEditingText={setEditingText}
            onUpdateHistoryName={updateHistoryName}
            onDeleteHistoryItem={deleteHistoryItem}
            editingLapId={editingLapId}
            setEditingLapId={setEditingLapId}
            onUpdateHistoryLapName={updateHistoryLapName}
            loading={loading}
          />
        </div>
        <ConflictModal
          visible={conflictModalVisible}
          onResolve={handleResolveConflict}
          onCancel={() => setConflictModalVisible(false)}
        />
        <SettingsModal
          visible={settingsVisible}
          onClose={() => setSettingsVisible(false)}
          isSignedIn={isSignedIn}
          user={user}
          onLogin={handleLogin}
          onLogout={handleLogout}
          onDownload={handleDownloadHistory}
          onUpload={handleUploadHistory}
          loading={loading}
        />
      </div>
    </>
  );
}

export default App;
