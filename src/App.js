import React, { useState, useEffect, useRef, useCallback } from 'react';
import HorizontalScrollInput from './HorizontalScrollInput';
import './index.css';

const MAX_ROUNDS = 15;
const MAX_TIME = 120;
const WORK_INCREMENT = 15;
const REST_INCREMENT = 5;
const PREP_TIME = 5;

const WORKOUT_STATES = {
    SETUP: 'SETUP',
    PREP: 'PREP',
    WORK: 'WORK',
    REST: 'REST',
    COMPLETE: 'COMPLETE'
};

const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
};

const playHighPitchedNoise = () => {
    try {
        const audio = new Audio('/chime.mp3');
        audio.volume = 0.8;
        audio.play().catch(e => console.error("Audio error:", e));
    } catch(e) {
        console.error(e);
    }
};

function App() {
    const [settings, setSettings] = useState({ rounds: 5, workTime: 60, restTime: 30 });
    const [timerState, setTimerState] = useState(WORKOUT_STATES.SETUP);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [currentRound, setCurrentRound] = useState(1);
    const intervalRef = useRef(null);

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

    useEffect(() => {
        if (timerState === WORKOUT_STATES.SETUP || timerState === WORKOUT_STATES.COMPLETE) {
            return () => clearInterval(intervalRef.current);
        }

        intervalRef.current = setInterval(() => {
            setTimeRemaining(prev => {
                const newTime = prev - 1;
                if (newTime >= 0 && newTime <= 3) playHighPitchedNoise();
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
        return (newVal) => setSettings(prev => ({ ...prev, [key]: newVal }));
    }, []);

    if (timerState === WORKOUT_STATES.SETUP) {
        return (
            <div className="app setup-view">
                <h1 className="title">Interval Timer</h1>

                <HorizontalScrollInput
                    label="Rounds"
                    value={settings.rounds}
                    min={1}
                    max={MAX_ROUNDS}
                    increment={1}
                    onChange={createSettingsSetter('rounds')}
                />

                <HorizontalScrollInput
                    label={`Work Time (${WORK_INCREMENT}s)`}
                    value={settings.workTime}
                    min={WORK_INCREMENT}
                    max={MAX_TIME}
                    increment={WORK_INCREMENT}
                    onChange={createSettingsSetter('workTime')}
                />

                <HorizontalScrollInput
                    label={`Rest Time (${REST_INCREMENT}s)`}
                    value={settings.restTime}
                    min={REST_INCREMENT}
                    max={MAX_TIME}
                    increment={REST_INCREMENT}
                    onChange={createSettingsSetter('restTime')}
                />

                <button
                    className="btn-start"
                    onClick={startWorkout}
                    disabled={settings.rounds < 1 || settings.workTime < WORK_INCREMENT}
                >
                    Start Workout
                </button>
            </div>
        );
    }

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
