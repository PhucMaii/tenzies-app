import React from "react"
import { useState, useEffect } from "react"
import {nanoid} from "nanoid"
import Die from "./components/Die"
import Confetti from "react-confetti"
import Modal from "react-modal"
import "./assets/main.css"
export default function App() {
    // Game modes
    const [mode, setMode] = useState("");

    // state contains dice 
    const [dice, setDice] = useState(generateNewDice());

    // state check if the user has won or not
    const [tenzies, setTenzies] = useState(false);

    // roll counter
    const [counter, setCounter] = useState(0);

    // time tracking
    const [seconds, setSeconds] = useState(0);
    const [minutes, setMinutes] = useState(0);
    const [timerOn, setTimerOn] = useState(false);
    const [intervalId, setIntervalId] = useState(null);
    const [isShowResult, setIsShowResult] = useState(false); 

    const [isNewRecord, setIsNewRecord] = useState(false);



    if(localStorage.getItem("minutesRecord") === null || localStorage.getItem("secondsRecord") === null ) {
        localStorage.setItem("minutesRecord", Infinity);
        localStorage.setItem("secondsRecord", Infinity);
    }    
    let minutesRecord = localStorage.getItem('minutesRecord');
    let secondsRecord = localStorage.getItem('secondsRecord');
    const [record, setRecord] = useState(`${minutesRecord < 10 ? "0" + minutesRecord : minutesRecord }:${secondsRecord < 10 ? "0" + secondsRecord : secondsRecord}`)
    const [modalIsOpen, setIsOpen] = useState(true);
    Modal.setAppElement("#root");
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        setWindowWidth(prevWidth => prevWidth = window.innerWidth);
    }, [window.innerWidth]);

    const modalStyle = {
        content: {
          top: windowWidth < 550 ? "50%" : "20%",
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          borderRadius: "20px",
          border: "none",
          boxShadow:" rgba(100, 100, 111, 0.2) 0px 7px 29px 0px",
          textAlign: "center",
          outline: "none",
        },
    };

    function chooseMode(e) {
        // setModes to whatever user choose   
        setMode(e.target.innerHTML);
        closeModal();
        resetTime();
        setTimerOn(true);
        setCounter(0);
        
    }

    function openResult() {
        setIsShowResult(true)
    } 
    function closeResult() {
        setIsShowResult(false)
    }

    function openModal() {
        setIsOpen(true);
    }

    function closeModal() {
        setIsOpen(false);
    }

    function resetTime() {
        setSeconds(0);
        setMinutes(0);

    }



    function startInterval() {
        const easyTime = 4000; 
        const normalTime = 1500;
        const hardTime = 700;

        let timeId;
        let count = 0; // erase later
        if(mode === "Normal") {
            timeId = setInterval(() => {
                rollDice();
                count++;
            }, normalTime)
        } 
        else if(mode === "Hard") {
            timeId = setInterval(() => {
                rollDice();
            }, hardTime)
        } else if(mode === "Easy") {
            timeId = setInterval(() => {
                rollDice();
            }, easyTime)
        }

        setIntervalId(timeId);

        return () => clearInterval(timeId);
     
    }

    function checkIsNewRecord() {
        const minutesRecord = localStorage.getItem("minutesRecord");
        const secondsRecord = localStorage.getItem("secondsRecord");
        console.log(seconds <= minutesRecord)
        if(minutes <= minutesRecord && seconds < secondsRecord) {
            localStorage.setItem("minutesRecord", minutes);
            localStorage.setItem("secondsRecord", seconds);
            setIsNewRecord(true);
            setRecord(`${minutes}:${seconds}`);
        } 
    }

    function generateNewDice() {
        const newDice = [];
        for(let i = 0; i < 10; i++) {
            newDice.push(generateNewDie());

        }
        return newDice;
    }

    function generateNewDie() {
        return {
            id: nanoid(),
            value: Math.ceil(Math.random() * 6),
            isHeld: false
        }
    }

    function rollDice() {
        setDice((prevDice) => {
            return prevDice.map((die) => {
                return die.isHeld === true ? die : generateNewDie()
            })
        });
    }
    function handleRollDiceClick() {
        // if (tenzies) => setTenzies(false) and setDice(generateNewDice()) and openModal();
        // else => setCounter + rollDice()
        if(tenzies) {
            setTenzies(false);
            setDice(generateNewDice());
            openModal();

            // reset isNewRecord state
            setIsNewRecord(false);
        } 

        // roll dice
        else {
            setCounter(prevCounter => prevCounter + 1);
            rollDice();

            clearInterval(intervalId);
            startInterval();
        }
        

    }
    
    function holdDice(id) {
        setDice((prevDice) => {
            return prevDice.map((die) => {
                return die.id === id ? {...die, isHeld: !die.isHeld} : die

            })
        })
        
    }


    const diceElements = dice.map(dice => <Die 
        key={dice.id} 
        holdDice={() => holdDice(dice.id)} 
        isHeld={dice.isHeld} 
        value={dice.value} />);

    useEffect(() => {
        startInterval();

        return () => clearInterval(intervalId);
    }, [mode])

    // increase seconds value whenever the timerOn is on
    useEffect(() => {
        let timeId;
        if(timerOn) {
            timeId = setInterval(() => {
                setSeconds(prevSeconds => prevSeconds + 1);
            }, 1000)
        }
        return () => clearInterval(timeId);
      
    }, [timerOn]);

    // increase minutes value when the seconds value is greater than 59
    useEffect(() => {
        if(seconds > 59) {
            setSeconds(0);
            setMinutes(prevMinutes => prevMinutes + 1);
        } 
    }, [seconds]);

    // stop the timer when the user wins
    useEffect(() => {
        if(tenzies) {
            setTimerOn(false);
            openResult();
            setMode("You Won !!!");
            clearInterval(intervalId);
            checkIsNewRecord();
        }

    }, [tenzies])


    // check if user has qualified all the conditions to win yet
    useEffect(() => {
        const allHeld = dice.every(die => die.isHeld === true);
        const value = dice[0].value;
        const sameValue = dice.every(die => die.value === value);

        if(allHeld && sameValue) {
            setTenzies(true);
        }
    }, [dice]) 
    
    

    return (
        <main className="main-container">
            {isNewRecord && <Confetti />}
            <h1>🔥 Record: {record === "Infinity:Infinity" ? "None" : record} 🔥</h1>
            <h3>{mode}</h3>
            <Modal 
                style={modalStyle}
                isOpen={isShowResult}
                onRequestClose={closeResult}
            >
                <div className="result-container">
                    <h1>{isNewRecord ? "Congratulations!!! You just set the new record 🎉" : `Keep going to break your record 🔥` }</h1>
                    <h2>Count: {counter}</h2>
                    <h2>{minutes < 10 ? "0" + minutes : minutes}:{seconds < 10 ? "0" + seconds : seconds}</h2>
    
                </div>
            </Modal>
            <Modal 
                isOpen={modalIsOpen} 
                style={modalStyle} 
            >
                <div className="mode-container">
                    <button onClick={chooseMode}>Easy</button>
                    <button onClick={chooseMode}>Normal</button>
                    <button onClick={chooseMode}>Hard</button>
        
                </div>   
            </Modal>
            <h1>Tenzies</h1>
            <p>Roll until all dice are the same.
                Click each die to freeze it as its current value between rolls.</p>
            <div className="die-container">
                {diceElements}

            </div>
            <button onClick={handleRollDiceClick} className="roll-button">{tenzies ? "New Game" : "Roll"}</button>
            <div className="tracking-container">
                <h3>Count: {counter}</h3>
                <h3>{minutes < 10 ? "0" + minutes : minutes}:{seconds < 10 ? "0"+seconds : seconds}</h3>
            </div>
        </main>
    )
}