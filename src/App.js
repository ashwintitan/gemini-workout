import React, { useState, useEffect, useRef, useCallback } from 'react';
import './index.css';

// --- CONFIGURATION CONSTANTS ---
const MAX_ROUNDS = 15;
const MAX_TIME = 120;
const WORK_INCREMENT = 15;
const REST_INCREMENT = 5;
const PREP_TIME = 5;

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

// Simplified Input Component with direct control and limits
const SimpleInput = React.memo(({ label, value, max, increment, min, onChange }) => {
    const increase = () => {
        const newValue = Math.min(value + increment, max);
        onChange(newValue);
    };

    const decrease = () => {
        const newValue = Math.max(value - increment, min);
        onChange(newValue);
    };

    return (
        <div className="input-group">
            <label className="input-label">{label}</label>
            <div className="input-controls">
                <button onClick={decrease} className="control-btn minus" disabled={value === min}>
                    -
                </button>
                <span className="input-value">{value}</span>
                <button onClick={increase} className="control-btn plus" disabled={value === max}>
                    +
                </button>
            </div>
        </div>
    );
});


// --- MAIN APP COMPONENT ---

function App() {
    // Ensure all inputs start above zero for the initial disabled check
    const [settings, setSettings] = useState({ rounds: 5, workTime: 60, restTime: 30 });
    const [timerState, setTimerState] = useState(WORKOUT_STATES.SETUP);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [currentRound, setCurrentRound] = useState(1);
    const intervalRef = useRef(null);

    // Logic to handle state transitions (WORK -> REST, REST -> WORK)
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

    // The main timer loop (runs every second)
    useEffect(() => {
        // Stop if not running or complete
        if (timerState === WORKOUT_STATES.SETUP || timerState === WORKOUT_STATES.COMPLETE) {
            return () => clearInterval(intervalRef.current);
        }

        // Set the interval
        intervalRef.current = setInterval(() => {
            setTimeRemaining(prevTime => {
                const newTime = prevTime - 1;

                // Sound Trigger: Plays on 3, 2, 1, 0 for all active timers
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

        // Cleanup function for useEffect (Crucial for preventing glitches/infinite loops)
        return () => clearInterval(intervalRef.current);
    }, [timerState, settings, currentRound, handleNextState]); // Added all necessary dependencies

    const startWorkout = () => {
        clearInterval(intervalRef.current);
        if (settings.rounds > 0 && settings.workTime > 0) {
            setTimerState(WORKOUT_STATES.PREP);
            setTimeRemaining(PREP_TIME); // Start 5-second countdown
            setCurrentRound(1);
        }
    };

    const resetWorkout = () => {
        clearInterval(intervalRef.current);
        setTimerState(WORKOUT_STATES.SETUP);
        setTimeRemaining(0);
        setCurrentRound(1);
    };

    // --- RENDER LOGIC ---
    if (timerState === WORKOUT_STATES.SETUP) {
        return (
            <div className="app setup-view">
                <h1 className="title">Interval Timer Setup</h1>
                
                <SimpleInput 
                    label="Rounds (Max 15)"
                    value={settings.rounds}
                    min={1}
                    max={MAX_ROUNDS}
                    increment={1}
                    onChange={(val) => setSettings({...settings, rounds: val})}
                />
                <SimpleInput 
                    label={`Work Time (Max ${MAX_TIME}s)`}
                    value={settings.workTime}
                    min={WORK_INCREMENT}
                    max={MAX_TIME}
                    increment={WORK_INCREMENT}
                    onChange={(val) => setSettings({...settings, workTime: val})}
                />
                <SimpleInput 
                    label={`Rest Time (Max ${MAX_TIME}s)`}
                    value={settings.restTime}
                    min={REST_INCREMENT}
                    max={MAX_TIME}
                    increment={REST_INCREMENT}
                    onChange={(val) => setSettings({...settings, restTime: val})}
                />
                
                <button 
                    onClick={startWorkout} 
                    className="btn-start"
                    // Check ensures user has set a valid work time and rounds
                    disabled={settings.rounds === 0 || settings.workTime === 0}
                >
                    Start Workout
                </button>
            </div>
        );
    }

    // Active Timer View
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