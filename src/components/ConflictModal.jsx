import React from 'react';

const ConflictModal = ({ visible, onResolve, onCancel }) => {
    if (!visible) return null;

    return (
        <div className="modal">
            <div className="modal-content">
                <h2>Conflict Detected</h2>
                <p>
                    Two history files were found with different modification times.
                    Which one would you like to keep?
                </p>
                <div className="modal-buttons">
                    <button onClick={() => onResolve('file1')} className="modal-btn">
                        Keep File 1
                    </button>
                    <button onClick={() => onResolve('file2')} className="modal-btn">
                        Keep File 2
                    </button>
                    <button onClick={onCancel} className="cancel-btn">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConflictModal;
