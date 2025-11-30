import React from 'react';
import { FaGoogle, FaTimes, FaCloudDownloadAlt, FaCloudUploadAlt, FaSpinner } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import './SettingsModal.css';

const SettingsModal = ({
    visible,
    onClose,
    isSignedIn,
    user,
    onLogin,
    onLogout,
    onDownload,
    onUpload,
    loading,
}) => {
    return (
        <AnimatePresence>
            {visible && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="settings-backdrop"
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    />

                    {/* Slide-in Panel */}
                    <motion.div
                        className="settings-panel"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    >
                        <div className="settings-header">
                            <h2>Settings</h2>
                            <button onClick={onClose} className="settings-close-btn" aria-label="Close Settings">
                                <FaTimes />
                            </button>
                        </div>

                        <div className="settings-content">
                            {/* Account Section */}
                            <div className="settings-section">
                                <h3>Account</h3>
                                {!isSignedIn ? (
                                    <button onClick={onLogin} className="settings-login-btn" disabled={loading}>
                                        {loading ? (
                                            <FaSpinner className="spinner-icon" />
                                        ) : (
                                            <FaGoogle />
                                        )}
                                        <span>{loading ? 'Signing in...' : 'Sign in with Google'}</span>
                                    </button>
                                ) : (
                                    <div className="settings-profile">
                                        <img
                                            src={user?.getImageUrl()}
                                            alt={`${user?.getName()}'s profile`}
                                            className="settings-profile-pic"
                                        />
                                        <div className="settings-profile-info">
                                            <p className="settings-profile-name">{user?.getName()}</p>
                                            <p className="settings-profile-email">{user?.getEmail()}</p>
                                        </div>
                                        <button onClick={onLogout} className="settings-logout-btn" disabled={loading}>
                                            {loading ? 'Signing out...' : 'Sign Out'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Data Sync Section */}
                            <div className="settings-section">
                                <h3>Data Sync</h3>
                                <p className="settings-description">
                                    Backup and restore your stopwatch history using Google Drive
                                </p>
                                <div className="settings-sync-buttons">
                                    <button
                                        onClick={onDownload}
                                        className="settings-sync-btn download"
                                        disabled={!isSignedIn || loading}
                                    >
                                        {loading ? (
                                            <FaSpinner className="spinner-icon" />
                                        ) : (
                                            <FaCloudDownloadAlt />
                                        )}
                                        <span>{loading ? 'Downloading...' : 'Download from Drive'}</span>
                                    </button>
                                    <button
                                        onClick={onUpload}
                                        className="settings-sync-btn upload"
                                        disabled={!isSignedIn || loading}
                                    >
                                        {loading ? (
                                            <FaSpinner className="spinner-icon" />
                                        ) : (
                                            <FaCloudUploadAlt />
                                        )}
                                        <span>{loading ? 'Uploading...' : 'Upload to Drive'}</span>
                                    </button>
                                </div>
                                {!isSignedIn && (
                                    <p className="settings-note">Sign in to enable sync features</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default SettingsModal;
