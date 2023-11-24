import React from "react"

export default function Die(props) {
    // [top, left]
    const dotsPositionMatrix = {
        1: [
           [50, 50] 
        ],
        2: [
            [20, 20],
            [80, 80]
        ],
        3: [
            [20, 20],
            [50, 50],
            [80, 80]
        ],
        4: [
            [20, 20],
            [20, 80],
            [80, 20],
            [80, 80]
        ],
        5: [
            [20, 20],
            [20, 80],
            [50, 50],
            [80, 20],
            [80, 80]
        ],
        6: [
            [20, 20],
            [20, 80],
            [50, 20],
            [50, 80],
            [80, 20],
            [80, 80]
        ]
    }

    const dotsElement = generateDots();

    function generateDotPosition(top, left) {
        return {
            top: `${top}%`,
            left: `${left}%`,
            transform: `translateX(-${left}%) translateY(-${top}%)`
        }
    }

    function generateDots() {
        const value = props.value;
        const dotsStyle = [];

        for(let i = 0; i < value; i++) {
            const style = generateDotPosition(dotsPositionMatrix[value][i][0], dotsPositionMatrix[value][i][1])
            dotsStyle.push(style);
        }
        return dotsStyle;
    }

    return (
        <button onClick={props.holdDice}  className={props.isHeld ? "die held" : "die"}>
            {dotsElement.map((dotStyle, index) => {
                return <div key={index} style={dotStyle} className="die-dot"></div>
            })}
        </button>

    )
}