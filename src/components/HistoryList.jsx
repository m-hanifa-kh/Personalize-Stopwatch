import React from 'react';
import { FaHistory, FaTrash, FaChevronDown, FaGoogle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { formatTime } from '../utils/timeUtils';

const HistoryList = ({
    history,
    showHistory,
    toggleHistory,
    expandedHistoryItem,
    onToggleHistoryItem,
    editingId,
    setEditingId,
    editingText,
    setEditingText,
    onUpdateHistoryName,
    onDeleteHistoryItem,
    editingLapId,
    setEditingLapId,
    onUpdateHistoryLapName,
    loading
}) => {
    return (
        <div className="history-section">
            <div className="history-toggle">
                <h3 style={{ margin: 0 }}>History</h3>
                <button
                    onClick={toggleHistory}
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
                            <motion.li
                                key={entry.id}
                                className="history-item-container"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.4 }}
                            >
                                <div
                                    className="history-item"
                                    onClick={() =>
                                        editingId !== entry.id && onToggleHistoryItem(entry.id)
                                    }
                                    onDoubleClick={() => setEditingId(entry.id)}
                                >
                                    {editingId === entry.id ? (
                                        <input
                                            type="text"
                                            value={editingText}
                                            onChange={(e) => setEditingText(e.target.value)}
                                            onBlur={() => onUpdateHistoryName(entry.id, editingText)}
                                            autoFocus
                                        />
                                    ) : (
                                        <>
                                            <button
                                                className={`history-toggle-arrow ${expandedHistoryItem === entry.id ? 'rotate-icon' : ''
                                                    }`}
                                                aria-label="Toggle Laps"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onToggleHistoryItem(entry.id);
                                                }}
                                            >
                                                <FaChevronDown />
                                            </button>
                                            <div
                                                className="history-text"
                                                onDoubleClick={() => setEditingText(entry.name)}
                                            >
                                                <strong>{entry.name}</strong>— {entry.time}
                                                <br />
                                                <span>{entry.timestamp}</span>
                                            </div>
                                            <button
                                                onClick={() => onDeleteHistoryItem(entry.id)}
                                                className="delete-btn"
                                                aria-label="Delete History Item"
                                            >
                                                <FaTrash />
                                            </button>
                                        </>
                                    )}
                                </div>
                                {expandedHistoryItem === entry.id &&
                                    entry.laps &&
                                    entry.laps.length > 0 && (
                                        <ul className="lap-list">
                                            {entry.laps.map((lap) => (
                                                <li key={lap.id} className="lap-item">
                                                    <>
                                                        {editingLapId === lap.id ? (
                                                            <input
                                                                type="text"
                                                                value={lap.name}
                                                                onChange={(e) =>
                                                                    onUpdateHistoryLapName(
                                                                        entry.id,
                                                                        lap.id,
                                                                        e.target.value
                                                                    )
                                                                }
                                                                onBlur={() => setEditingLapId(null)}
                                                                autoFocus
                                                            />
                                                        ) : (
                                                            <span
                                                                onDoubleClick={() => setEditingLapId(lap.id)}
                                                            >
                                                                {lap.name} : {formatTime(lap.time, false)}
                                                            </span>
                                                        )}
                                                    </>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                            </motion.li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>

            <div className="history-buttons">
                {/* Buttons moved to Settings */}
            </div>
            <div className="google-login-section">
                {/* Login moved to Settings */}
            </div>
            {loading && (
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading...</p>
                </div>
            )}
        </div>
    );
};

export default HistoryList;
