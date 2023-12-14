import React from "react"
import { useState, useEffect } from "react"
import {nanoid} from "nanoid"
import Die from "./components/Die"
import Confetti from "react-confetti"
import Modal from "react-modal";
import "./assets/main.css";
import { styled } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import LoginModal from "./components/LoginModal/LoginModal"
import { Button } from "@mui/material"
import { DynamoDBClient, GetItemCommand, PutItemCommand, ScanCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { marshall } from "@aws-sdk/util-dynamodb"


const StyledTableCell = styled(TableCell)(({ theme }) => ({
    [`&.${tableCellClasses.head}`]: {
      backgroundColor: theme.palette.common.black,
      color: theme.palette.common.white,
    },
    [`&.${tableCellClasses.body}`]: {
      fontSize: 14,
    },
  }));
  
  const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
      backgroundColor: theme.palette.action.hover,
    },
    // hide last border
    '&:last-child td, &:last-child th': {
      border: 0,
    },
  }));

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
    const [modalIsOpen, setIsOpen] = useState(true);
    const [userList, setUserList] = useState([]);
    const [currentUser, setCurrentUser] = useState(() => {
        const userData = JSON.parse(localStorage.getItem('current-user'));
        if(userData) {
            return userData;
        }
        return null;
    })
    const [isOpenLoginModal, setIsOpenLoginModal] = useState(() => {
        const userData = JSON.parse(localStorage.getItem('current-user'));
        if(userData) {
            return false;
        }
        return true;
    });

    if(localStorage.getItem("minutesRecord") === null || localStorage.getItem("secondsRecord") === null ) {
        localStorage.setItem("minutesRecord", Infinity);
        localStorage.setItem("secondsRecord", Infinity);
    }  
    const client = new DynamoDBClient({
        region: 'us-west-2',
        credentials: {
            accessKeyId: 'AKIAYHAZ3NETFFR3HTSF',
            secretAccessKey: '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'
        },
    });
    const docClient = DynamoDBDocumentClient.from(client);
    let minutesRecord = localStorage.getItem('minutesRecord');
    let secondsRecord = localStorage.getItem('secondsRecord');
    const [record, setRecord] = useState(`${minutesRecord < 10 ? "0" + minutesRecord : minutesRecord }:${secondsRecord < 10 ? "0" + secondsRecord : secondsRecord}`)
    Modal.setAppElement("#root");
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        onRead();
    }, [])

    useEffect(() => {
        setWindowWidth(prevWidth => prevWidth = window.innerWidth);
    }, [window.innerWidth]);

    const modalStyle = {
        content: {
          top: windowWidth < 550 ? "50%" : "30%",
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

    const onUpdate = async () => {
        console.log(currentUser.uid.S);
        const targetUid = "OqZ7uuOOKP8xa8_sdWiZN";
        try {

            // New way
            const params = {
                "ExpressionAttributeNames": {
                    "#record": "record"
                },
                "ExpressionAttributeValues": { 
                    ":record": {
                        "S": "0:60"
                    }
                },
                "Key": marshall({
                    uid: "OqZ7uuOOKP8xa8_sdWiZN"
                }),
                "ReturnValues": "ALL_NEW",
                "TableName": "users",
                "UpdateExpression": "SET #record = :record"
            };
            const command = new UpdateItemCommand(params);
            const response = await docClient.send(command); 
            console.log('Update User successfully', response);
        } catch (err) {
            console.error('Error updating user err', err);
        }
    };
    
    const onRead = async () => {
        try {
            const params = {
                TableName: "users",
            };
            const data = await docClient.send(new ScanCommand(params));
            const users = data.Items;
            users.sort((userA, userB) => {
                const [minutesA, secondsA] = userA.record.S.split(':').map(Number);
                const [minutesB, secondsB] = userB.record.S.split(':').map(Number);
                // Compare minutes first
                if (minutesA !== minutesB) {
                  return minutesA - minutesB;
                }
                // If minutes are the same, compare seconds
                return secondsA - secondsB;
            });
            setUserList((prevUserList) => {
                const newUserList = [];
                if(users.length < 5) {
                    return users;
                }
                for(let i = 0; i < 5; i++) {
                    newUserList.push(users[i]);
                }
                return newUserList;
            });
        } catch(error) {
            console.log(error);
        }
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
        const minutesRecord = localStorage.getItem("minutesRecrd");
        const secondsRecord = localStorage.getItem("secondsRecord");
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

    useEffect(() => {
        if(record !== `Infinity:Infinity`) {
            onUpdate();
            onRead();
        }
    }, [record])

    // stop the timer when the user wins
    useEffect(() => {
        if(tenzies) {
            setTimerOn(false);
            openResult();
            setMode("You Won !!!");
            clearInterval(intervalId);
            checkIsNewRecord();
            onRead();
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
            <Button 
                variant="outlined" 
                mb={2}
                onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                }}
            >
                Sign out
            </Button>
            {userList.length > 0 && <TableContainer sx={{display: 'flex', justifyContent: 'center', marginTop: '10px'}} component={Paper}>
                <Table sx={{ maxWidth: '300px' }} aria-label="customized table">
                    <TableHead>
                      <TableRow>
                        <StyledTableCell>Top</StyledTableCell>
                        <StyledTableCell align="center">Username</StyledTableCell>
                        <StyledTableCell align="center">Record</StyledTableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                        {userList.length > 0 && userList.map((user, index) => (
                            <StyledTableRow key={user.username.S}>
                              <StyledTableCell component="th" scope="row">
                                {index + 1}
                              </StyledTableCell>
                              <StyledTableCell align="center">{user.username.S}</StyledTableCell>
                              <StyledTableCell align="center">{user.record.S}</StyledTableCell>
                            </StyledTableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>}
            {isNewRecord && <Confetti />}
            <h1>🔥 Record: {record === "Infinity:Infinity" ? "None" : record} 🔥</h1>
            <h3>{mode}</h3>
            <LoginModal 
                isOpen={isOpenLoginModal} 
                modalStyle={modalStyle} 
                onClose={() => setIsOpenLoginModal(false)}
                setCurrentUser={setCurrentUser}
            />
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