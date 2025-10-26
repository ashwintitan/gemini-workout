import React, { useState, useEffect, useRef, useCallback } from 'react';
import './index.css';

// --- CONFIGURATION CONSTANTS ---
const MAX_ROUNDS = 15;
const MAX_TIME = 120;
const WORK_INCREMENT = 15;
const REST_INCREMENT = 5;
const PREP_TIME = 5;
const HOLD_INTERVAL_MS = 100; // Time between repeating increments (fast)

// --- WORKOUT STATE ENUM ---
const WORKOUT_STATES = {
    SETUP: 'SETUP',
    PREP: 'PREP',
    WORK: 'WORK',
    REST: 'REST',
    COMPLETE: 'COMPLETE'
};

// --- HELPER FUNCTIONS ---

const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const playHighPitchedNoise = () => {
    try {
        const audio = new Audio('/chime.mp3'); 
        audio.volume = 0.8;
        audio.play().catch(e => console.error("Audio playback error:", e));
    } catch (e) {
        console.error("Browser audio API issue:", e);
    }
};

// --- FAST INPUT COMPONENT (Press-and-Hold - Stable Version) ---
const FastInput = React.memo(({ label, value, max, increment, min, onChange }) => {
    const intervalRef = useRef(null);

    const changeValue = useCallback((direction, currentValue) => {
        let newValue;
        if (direction === 'up') {
            newValue = Math.min(currentValue + increment, max);
        } else {
            newValue = Math.max(currentValue - increment, min);
        }
        return newValue;
    }, [increment, max, min]); 
    
    const applyChange = useCallback((direction) => {
        onChange(prevValue => {
            return changeValue(direction, prevValue);
        });
    }, [onChange, changeValue]);

    const handleMouseDown = (direction) => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        // 1. Apply the change once on the initial click
        applyChange(direction);

        // Check if we are stuck at a boundary after the first click
        const nextValue = changeValue(direction, value);
        if (nextValue === value) {
            return;
        }

        // 2. Start repeating interval
        intervalRef.current = setInterval(() => {
            applyChange(direction);
        }, HOLD_INTERVAL_MS);
    };

    const handleMouseUp = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    return (
        <div className="input-group">
            <label className="input-label">{label}</label>
            <div className="input-controls">
                <button 
                    onMouseDown={() => handleMouseDown('down')} 
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp} 
                    onTouchStart={() => handleMouseDown('down')}
                    onTouchEnd={handleMouseUp}
                    className="control-btn minus" 
                    disabled={value === min}
                >
                    -
                </button>
                <span className="input-value">{value}</span>
                <button 
                    onMouseDown={() => handleMouseDown('up')} 
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={() => handleMouseDown('up')}
                    onTouchEnd={handleMouseUp}
                    className="control-btn plus" 
                    disabled={value === max}
                >
                    +
                </button>
            </div>
        </div>
    );
});


// --- MAIN APP COMPONENT ---

function App() {
    const [settings, setSettings] = useState({ rounds: 5, workTime: 60, restTime: 30 });
    const [timerState, setTimerState] = useState(WORKOUT_STATES.SETUP);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [currentRound, setCurrentRound] = useState(1);
    const intervalRef = useRef(null);

    // Logic to handle state transitions
    const handleNextState = useCallback(() => {
        if (timerState === WORKOUT_STATES.PREP) {
            setTimerState(WORKOUT_STATES.WORK);
            setTimeRemaining(settings.workTime);

        } else if (timerState === WORKOUT_STATES.WORK) {
            if (currentRound < settings.rounds) {
                setTimerState(WORKOUT_STATES.REST);
                setTimeRemaining(settings.restTime);
            } else {
                setTimerState(WORKOUT_STATES.COMPLETE);
            }

        } else if (timerState === WORKOUT_STATES.REST) {
            const nextRound = currentRound + 1;
            setCurrentRound(nextRound);

            if (nextRound <= settings.rounds) {
                setTimerState(WORKOUT_STATES.WORK);
                setTimeRemaining(settings.workTime);
            } else {
                setTimerState(WORKOUT_STATES.COMPLETE);
            }
        }
    }, [timerState, settings, currentRound]);

    // The main timer loop
    useEffect(() => {
        if (timerState === WORKOUT_STATES.SETUP || timerState === WORKOUT_STATES.COMPLETE) {
            return () => clearInterval(intervalRef.current);
        }

        intervalRef.current = setInterval(() => {
            setTimeRemaining(prevTime => {
                const newTime = prevTime - 1;

                if (newTime >= 0 && newTime <= 3) {
                    playHighPitchedNoise();
                }

                if (newTime < 0) {
                    clearInterval(intervalRef.current);
                    handleNextState();
                    return 0;
                }

                return newTime;
            });
        }, 1000);

        return () => clearInterval(intervalRef.current);
    }, [timerState, settings, currentRound, handleNextState]);

    const startWorkout = () => {
        clearInterval(intervalRef.current);
        if (settings.rounds > 0 && settings.workTime > 0) {
            setTimerState(WORKOUT_STATES.PREP);
            setTimeRemaining(PREP_TIME);
            setCurrentRound(1);
        }
    };

    const resetWorkout = () => {
        clearInterval(intervalRef.current);
        setTimerState(WORKOUT_STATES.SETUP);
        setTimeRemaining(0);
        setCurrentRound(1);
    };
    
    const createSettingsSetter = useCallback((key) => {
        return (newVal) => {
            if (typeof newVal === 'function') {
                setSettings(prev => ({...prev, [key]: newVal(prev[key])}));
            } else {
                setSettings(prev => ({...prev, [key]: newVal}));
            }
        };
    }, []);

    // --- RENDER LOGIC ---
    if (timerState === WORKOUT_STATES.SETUP) {
        return (
            <div className="app setup-view">
                <h1 className="title">Interval Timer Setup</h1>
                
                {/* Reverting to the highly stable FastInput component */}
                <FastInput 
                    label="Rounds (Press & Hold for Speed)"
                    value={settings.rounds}
                    min={1} 
                    max={MAX_ROUNDS}
                    increment={1}
                    onChange={createSettingsSetter('rounds')}
                />
                <FastInput 
                    label={`Work Time (Intervals of ${WORK_INCREMENT}s)`}
                    value={settings.workTime}
                    min={WORK_INCREMENT} 
                    max={MAX_TIME}
                    increment={WORK_INCREMENT}
                    onChange={createSettingsSetter('workTime')}
                />
                <FastInput 
                    label={`Rest Time (Intervals of ${REST_INCREMENT}s)`}
                    value={settings.restTime}
                    min={REST_INCREMENT} 
                    max={MAX_TIME}
                    increment={REST_INCREMENT}
                    onChange={createSettingsSetter('restTime')}
                />
                
                <button 
                    onClick={startWorkout} 
                    className="btn-start"
                    disabled={settings.rounds < 1 || settings.workTime < WORK_INCREMENT}
                >
                    Start Workout
                </button>
            </div>
        );
    }

    // Active Timer View (Same as before)
    const phaseLabel = {
        [WORKOUT_STATES.PREP]: 'GET READY',
        [WORKOUT_STATES.WORK]: 'WORK',
        [WORKOUT_STATES.REST]: 'REST',
        [WORKOUT_STATES.COMPLETE]: 'COMPLETE'
    }[timerState];

    const isComplete = timerState === WORKOUT_STATES.COMPLETE;
    const isPrep = timerState === WORKOUT_STATES.PREP;
    const isWorking = timerState === WORKOUT_STATES.WORK;

    return (
        <div className={`app timer-view ${isWorking ? 'work-phase' : ''} ${timerState === WORKOUT_STATES.REST ? 'rest-phase' : ''} ${isComplete ? 'complete-phase' : ''} ${isPrep ? 'prep-phase' : ''}`}>
            
            {!isComplete && (
                <div className="round-tracker">
                    {isPrep ? 'PREP' : `ROUND ${currentRound} OF ${settings.rounds}`}
                </div>
            )}

            <div className="phase-label">{phaseLabel}</div>

            <div className="main-timer">
                {isPrep ? timeRemaining : formatTime(timeRemaining)}
            </div>
            
            {isComplete && (
                <div className="complete-message">
                    WORKOUT COMPLETE! 💪
                </div>
            )}

            <button onClick={resetWorkout} className="btn-reset">
                {isComplete ? 'New Workout' : 'Stop / Reset'}
            </button>
        </div>
    );
}

export default App;
