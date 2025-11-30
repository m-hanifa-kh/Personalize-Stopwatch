import { useState, useRef, useEffect } from 'react';
import { formatTime, formatDuration, getCurrentTimestamp } from '../utils/timeUtils';

export const useStopwatch = () => {
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [currentLaps, setCurrentLaps] = useState([]);
    const startTimeRef = useRef(null);
    const animationFrameRef = useRef(null);
    const elapsedRef = useRef(0);

    useEffect(() => {
        const update = () => {
            if (isRunning && startTimeRef.current != null) {
                const elapsed = Date.now() - startTimeRef.current;
                setTime(elapsed);
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

    const start = () => setIsRunning(true);

    const pause = () => {
        setIsRunning(false);
        elapsedRef.current = time;
    };

    const lap = () => {
        if (isRunning) {
            const currentTime = time;
            const lapIndex = currentLaps.length + 1;
            const defaultName = `Lap ${lapIndex}`;
            const formattedTime = formatTime(currentTime);

            const newLap = {
                id: Date.now(),
                name: defaultName,
                time: currentTime,
                formattedTime: formattedTime,
            };

            setCurrentLaps((prevLaps) => [...prevLaps, newLap]);
        }
    };

    const stop = () => {
        const actualElapsed = elapsedRef.current;

        // Calculate laps with final duration
        const lapsWithFinalDuration = currentLaps.map((lap, index) => {
            const previousTime = index === 0 ? 0 : currentLaps[index - 1].time;
            const duration = lap.time - previousTime;
            return {
                ...lap,
                duration: formatDuration(Math.floor(duration / 1000)),
            };
        });

        if (lapsWithFinalDuration.length === 0 && actualElapsed > 0) {
            lapsWithFinalDuration.push({
                id: Date.now(),
                name: 'Lap 1',
                time: actualElapsed,
                duration: formatDuration(Math.floor(actualElapsed / 1000)),
                timestamp: getCurrentTimestamp(),
            });
        } else if (lapsWithFinalDuration.length > 0) {
            const secondLastLapTime = lapsWithFinalDuration.length > 1
                ? lapsWithFinalDuration[lapsWithFinalDuration.length - 2].time
                : 0;
            const lastLapActualDuration = actualElapsed - secondLastLapTime;
            lapsWithFinalDuration[lapsWithFinalDuration.length - 1].duration =
                formatDuration(Math.floor(lastLapActualDuration / 1000));
        }

        const sessionData = {
            id: Date.now(),
            name: 'Untitled',
            time: formatDuration(Math.floor(actualElapsed / 1000)),
            timestamp: getCurrentTimestamp(),
            laps: lapsWithFinalDuration,
            isExpanded: false,
        };

        // Reset state
        setTime(0);
        elapsedRef.current = 0;
        setIsRunning(false);
        setCurrentLaps([]);

        return sessionData;
    };

    const updateLapName = (index, newName) => {
        const updatedLaps = [...currentLaps];
        updatedLaps[index].name = newName;
        setCurrentLaps(updatedLaps);
    };

    return {
        time,
        isRunning,
        currentLaps,
        start,
        pause,
        lap,
        stop,
        updateLapName,
    };
};
