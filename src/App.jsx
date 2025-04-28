import { gapi } from "gapi-script";
import React, { useState, useEffect } from "react";
import { initGoogleAPI } from "../googleLogin";
import { FaHistory, FaTrash, FaGoogle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useRef } from "react";
import logo from "/logo.png";
import "./App.css";

function getCurrentTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const day = now.getDate();
  const month = now.toLocaleString("default", { month: "long" });
  const time = now.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${year}, ${day} ${month} - ${time.toLowerCase()}`;
}

function formatDuration(time) {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;

  let display = "";
  if (minutes > 0) display += `${minutes}m `;
  if (seconds > 0 || minutes === 0) display += `${seconds}s`;

  return display.trim();
}

function App() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [showHistory, setShowHistory] = useState(true);
  const startTimeRef = useRef(null);
  const animationFrameRef = useRef(null);
  const elapsedRef = useRef(0);
  const [displayTime, setDisplayTime] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [conflictModalVisible, setConflictModalVisible] = useState(false);
  const [fileToKeep, setFileToKeep] = useState(null); // Track which file to keep
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const auth = gapi.auth2.getAuthInstance();
    setLoading(true); // start spinner
    try {
      const user = await auth.signIn();
      setUser(user.getBasicProfile());
      setIsSignedIn(true);

      await downloadHistoryFromDrive(); // download after login
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Please try again.");
    } finally {
      setLoading(false); // stop spinner
    }
  };

  const handleLogout = async () => {
    await uploadHistoryToDrive(); // Save history before logout
    const auth = gapi.auth2.getAuthInstance();
    auth.signOut();
    setUser(null);
    setIsSignedIn(false);
  };

  // Add conflict resolution for download
  const handleFileConflict = (file1, file2) => {
    const date1 = new Date(file1.modifiedTime);
    const date2 = new Date(file2.modifiedTime);

    // Show the conflict modal when the modification times differ
    setConflictModalVisible(true);
    // Set the conflicting files for the user to choose from
    setFileToKeep({ file1, file2 });
  };

  // Update the history based on the selected file
  const handleResolveConflict = async (keepFile) => {
    const parseAndSetHistory = (content) => {
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        } else {
          console.error("Invalid history file: not an array");
          alert("Error: Invalid history file format.");
        }
      } catch (e) {
        console.error("Failed to parse history file", e);
        alert("Error: Failed to load history file.");
      }
    };

    if (keepFile === "file1") {
      parseAndSetHistory(fileToKeep.file1.content);
    } else {
      parseAndSetHistory(fileToKeep.file2.content);
    }

    setConflictModalVisible(false);

    // ⬇️ Upload the resolved file
    await uploadHistoryToDrive();
  };

  // Modal for conflict resolution
  const ConflictResolutionModal = () => {
    if (!conflictModalVisible) return null;

    return (
      <div className="modal">
        <div className="modal-content">
          <h2>Conflict Detected</h2>
          <p>
            Two history files were found with different modification times.
            Which one would you like to keep?
          </p>
          <div className="modal-buttons">
            <button
              onClick={() => handleResolveConflict("file1")}
              className="modal-btn"
            >
              Keep File 1
            </button>
            <button
              onClick={() => handleResolveConflict("file2")}
              className="modal-btn"
            >
              Keep File 2
            </button>
            <button
              onClick={() => setConflictModalVisible(false)}
              className="cancel-btn"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    initGoogleAPI();
  }, []);

  // 1. Load history when app starts
  useEffect(() => {
    const savedHistory = localStorage.getItem("stopwatch-history");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // 2. Save history every time it changes
  useEffect(() => {
    localStorage.setItem("stopwatch-history", JSON.stringify(history));
  }, [history]);

  // upload history to drive
  const uploadHistoryToDrive = async () => {
    setLoading(true);
    try {
      const fileContent = JSON.stringify(history);
      const file = new Blob([fileContent], { type: "application/json" });

      const metadata = {
        name: "stopwatch-history.json",
        parents: ["appDataFolder"],
        mimeType: "application/json",
      };

      const accessToken = gapi.auth2
        .getAuthInstance()
        .currentUser.get()
        .getAuthResponse().access_token;

      const searchResponse = await fetch(
        "https://www.googleapis.com/drive/v3/files?q=name=\"stopwatch-history.json\" and trashed=false and 'appDataFolder' in parents",
        {
          headers: new Headers({ Authorization: "Bearer " + accessToken }),
        }
      );
      const searchData = await searchResponse.json();

      let url =
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id";
      let method = "POST";

      if (searchData.files && searchData.files.length > 0) {
        const fileId = searchData.files[0].id;
        url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart&fields=id`;
        method = "PATCH";
      }

      const form = new FormData();
      form.append(
        "metadata",
        new Blob([JSON.stringify(metadata)], { type: "application/json" })
      );
      form.append("file", file);

      await fetch(url, {
        method: method,
        headers: new Headers({ Authorization: "Bearer " + accessToken }),
        body: form,
      });

      console.log("History uploaded to Drive!");
    } catch (error) {
      console.error("Error uploading history:", error);
      alert("Failed to upload history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Download history from Drive with conflict resolution
  const downloadHistoryFromDrive = async () => {
    const accessToken = gapi.auth2
      .getAuthInstance()
      .currentUser.get()
      .getAuthResponse().access_token;

    try {
      const response = await fetch(
        'https://www.googleapis.com/drive/v3/files?q=name="stopwatch-history.json" and trashed=false and ' +
          `'appDataFolder' in parents`,
        {
          headers: new Headers({ Authorization: "Bearer " + accessToken }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      const files = data.files;

      if (files.length === 2) {
        // If 2 files found, resolve conflict
        const downloadFile = async (file) => {
          const res = await fetch(
            `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
            {
              headers: new Headers({ Authorization: "Bearer " + accessToken }),
            }
          );
          const content = await res.text();
          return { ...file, content };
        };

        const fullFile1 = await downloadFile(files[0]);
        const fullFile2 = await downloadFile(files[1]);

        handleFileConflict(fullFile1, fullFile2);
      } else if (files.length === 1) {
        // If only 1 file, simply download it
        const downloadResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files/${files[0].id}?alt=media`,
          {
            headers: new Headers({ Authorization: "Bearer " + accessToken }),
          }
        );
        const fileContent = await downloadResponse.json();
        setHistory(fileContent);
        console.log("History loaded from Drive!");
      } else {
        // No file found
        console.log("No history file found in Drive.");
      }
    } catch (error) {
      console.error("Error fetching history from Drive:", error);
      alert("Failed to download history. Please check your connection.");
    }
  };

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
  }, [isRunning, time]);

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
      const elapsed = startTimeRef.current
        ? Date.now() - startTimeRef.current
        : 0;
      document.title = formatTime(elapsed);

      intervalId = setInterval(() => {
        const elapsed = startTimeRef.current
          ? Date.now() - startTimeRef.current
          : 0;
        document.title = formatTime(elapsed);
      }, 1000);
    } else {
      document.title = "Tarot Insight";
    }

    return () => {
      clearInterval(intervalId);
    };
  }, [isRunning]);

  const deleteHistoryItem = (id) => {
    setHistory((prevHistory) => prevHistory.filter((item) => item.id !== id));
  };

  return (
    <>
      <div className={`App-container ${isDarkMode ? "dark" : ""}`}>
        <img src={logo} alt="Logo" className="brandlogo" />
        <div className="App">
          <h1>Tarot Insight</h1>
          <h2 className="subtitle"> Psychological Tarot Reading</h2>
          <p className="description">
            Mengungkap pesan semesta <br />
            by @mhanifakh
          </p>
          <div className="toggle-theme">
            <button
              onClick={() => setIsDarkMode((prev) => !prev)}
              className="theme-toggle"
              aria-label="Toggle Theme"
            >
              {isDarkMode ? "🌞" : "🌙"}
            </button>
          </div>
          <h2>{formatTime(displayTime)}</h2>
          <div>
            {!isRunning && time === 0 && (
              <button className="start-btn" onClick={() => setIsRunning(true)}>
                Start
              </button>
            )}
            {isRunning && (
              <button
                className="pause-btn"
                onClick={() => {
                  setIsRunning(false);
                  elapsedRef.current = time; // save elapsed time
                }}
              >
                Pause
              </button>
            )}
            {!isRunning && time !== 0 && (
              <button className="start-btn" onClick={() => setIsRunning(true)}>
                Resume
              </button>
            )}
            {time !== 0 && (
              <button
                className="reset-btn"
                onClick={() => {
                  const now = Date.now();
                  const actualElapsed = now - (startTimeRef.current ?? now);

                  setHistory((prev) => [
                    ...prev,
                    {
                      id: Date.now(),
                      name: "Untitled",
                      time: formatDuration(Math.floor(actualElapsed / 1000)),
                      timestamp: getCurrentTimestamp(),
                    },
                  ]);
                  setTime(0);
                  setDisplayTime(0);
                  elapsedRef.current = 0;
                  setIsRunning(false);
                  setEditingId(null);
                  setEditingText("");
                }}
              >
                Reset
              </button>
            )}
            <div className="history-section">
              <div className="history-toggle">
                <h3 style={{ margin: 0 }}>History</h3>
                <button
                  onClick={() => setShowHistory((prev) => !prev)}
                  className={showHistory ? "" : "rotate"}
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
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    style={{ overflow: "hidden", marginTop: "1rem" }}
                  >
                    {history.map((entry) => (
                      <motion.li
                        key={entry.id}
                        className="history-item-container"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        {/* History entry code Start here */}
                        {editingId === entry.id ? (
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onBlur={() => {
                              const updated = history.map((item) =>
                                item.id === entry.id
                                  ? { ...item, name: editingText }
                                  : item
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
                      </motion.li>
                    ))}
                    {/* history entry code End*/}
                  </motion.ul>
                )}
              </AnimatePresence>{" "}
              {/* Ends the animation */}
              {/* Download / Upload History Buttons */}
              <div className="history-buttons">
                <button
                  onClick={downloadHistoryFromDrive}
                  className="download-btn"
                >
                  Download History
                </button>
                <button onClick={uploadHistoryToDrive} className="upload-btn">
                  Upload History
                </button>
              </div>
              <div className="google-login-section">
                {!isSignedIn ? (
                  <button onClick={handleLogin} className="login-btn">
                    <FaGoogle /> Login with Google
                  </button>
                ) : (
                  <div>
                    <div className="google-profile">
                      <img
                        src={user?.getImageUrl()}
                        alt={`${user?.getName()}'s profile picture`}
                        className="profile-pic"
                      />
                      <p>Welcome, {user?.getName()}!</p>
                    </div>

                    <button onClick={handleLogout} className="logout-btn">
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>{" "}
            {/* Ends .history-section */}
          </div>{" "}
          {/* This one closes the buttons wrapper */}
        </div>{" "}
        {/* This one closes the .App inner */}
        {loading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        )}
        {conflictModalVisible && <ConflictResolutionModal />}
      </div>
      {/* This one closes the .App-container */}
    </>
  );
}

export default App;
