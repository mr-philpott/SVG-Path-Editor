"use strict";

// canvas variables
const c = document.getElementById("canvas");
const ctx = c.getContext("2d");

// handles sizing the canvas
c.width = window.innerWidth * 0.8;
c.height = window.innerHeight * 0.95;
$(window).on("resize", () => {
    c.width = window.innerWidth * 0.8;
    c.height = window.innerHeight * 0.95;
});

class Instruction {
    constructor(keyword, values) {
        this.keyword = keyword;
        this.values = values;
    }
}

class CodeReader {
    constructor(intialInput) {
        this.intialInput = intialInput;
        this.runningInput = intialInput;
        this.instructions;

        this.Parse();
        this.Analyze();
    }

    Parse() {
        // might need to make this more efficent later

        // gets rid of the non breaking charcter unicode and replaces the new lines formed in html with newlines in js
        this.runningInput = this.runningInput
            .replace(/&nbsp;/g, " ") // gets rids of non-breaking spaces
            .replace(/\<div\>/g, " \n ") // gets rid of starting div
            .replace(/\<br\>/g, "\n ") // gets rid of br if there is one
            .replace(/\<\/div\>/g, ""); // gets rid of closing div and replaces it with a space

        // gets rid of excess whitespace
        let excessRemoved = "";
        let spaceLast = true;
        // for every letter in the string param input
        for (let l of this.runningInput) {
            if (spaceLast) {
                if (l !== " ") {
                    excessRemoved += l;
                    spaceLast = false;
                }
            } else {
                if (l === " ") spaceLast = true;
                excessRemoved += l;
            }
        }

        // removes trailing spaces and newlines
        excessRemoved = excessRemoved.split(" ");
        if (excessRemoved[excessRemoved.length - 1] === "") excessRemoved.pop();
        if (excessRemoved[excessRemoved.length - 1] === "\n")
            excessRemoved.pop();
        this.runningInput = excessRemoved;
    }

    Analyze() {
        let instructions = [];
        for (let value = 0; value < this.runningInput.length; value++) {
            switch (this.runningInput[value]) {
                case "M":
                case "m":
                case "move":
                    if (value + 2 < this.runningInput.length) {
                        instructions.push(
                            new Instruction("move", {
                                x: Number(this.runningInput[value + 1]),
                                y: Number(this.runningInput[value + 2]),
                            })
                        );
                        value += 1;
                    }
                    break;
                case "L":
                case "l":
                case "line":
                    if (value + 2 < this.runningInput.length) {
                        instructions.push(
                            new Instruction("line", {
                                x: Number(this.runningInput[value + 1]),
                                y: Number(this.runningInput[value + 2]),
                            })
                        );
                        value += 1;
                    }
                    break;
                case "H":
                case "h":
                case "hor":
                    if (value + 1 < this.runningInput.length) {
                        console.log(Number(this.runningInput[value + 1]));
                        instructions.push(
                            new Instruction("hor", {
                                x: Number(this.runningInput[value + 1]),
                            })
                        );
                        value += 1;
                    }
                    break;
                case "V":
                case "v":
                case "ver":
                    if (value + 1 < this.runningInput.length) {
                        instructions.push(
                            new Instruction("ver", {
                                y: Number(this.runningInput[value + 1]),
                            })
                        );
                        value += 1;
                    }
                    break;
                case "Z":
                case "z":
                case "return":
                    if (value + 0 < this.runningInput.length) {
                        instructions.push(new Instruction("return", {}));
                        value += 0;
                    }
                    break;
                case "C":
                case "c":
                case "curve":
                    if (value + 6 < this.runningInput.length) {
                        instructions.push(
                            new Instruction("curve", {
                                x: Number(this.runningInput[value + 5]),
                                y: Number(this.runningInput[value + 6]),
                                controlx1: Number(this.runningInput[value + 1]),
                                controly1: Number(this.runningInput[value + 2]),
                                controlx2: Number(this.runningInput[value + 3]),
                                controly2: Number(this.runningInput[value + 4]),
                            })
                        );
                        value += 5;
                    }
                    break;
                case "Q":
                case "q":
                case "quad":
                    if (value + 4 < this.runningInput.length) {
                        instructions.push(
                            new Instruction("quad", {
                                x: Number(this.runningInput[value + 4]),
                                y: Number(this.runningInput[value + 3]),
                                controlx: Number(this.runningInput[value + 1]),
                                controly: Number(this.runningInput[value + 2]),
                            })
                        );
                        value += 3;
                    }
                    break;
            }
        }
        this.runningInput = instructions;
    }

    Return() {
        return this.runningInput;
    }
}

class Drawing {
    constructor(instructions) {
        this.instructions = instructions;
        this.currPos = { x: 0, y: 0 };

        this.Exe();
    }

    Exe() {
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.beginPath();
        for (let instruct of this.instructions) {
            switch (instruct.keyword) {
                case "move":
                    ctx.moveTo(instruct.values.x, instruct.values.y);
                    this.currPos.x = instruct.values.x;
                    this.currPos.y = instruct.values.y;
                    break;
                case "line":
                    ctx.lineTo(instruct.values.x, instruct.values.y);
                    this.currPos.x = instruct.values.x;
                    this.currPos.y = instruct.values.y;
                    break;
                case "hor":
                    ctx.lineTo(instruct.values.x, this.currPos.y);
                    this.currPos.x = instruct.values.x;
                    break;
                case "ver":
                    ctx.lineTo(this.currPos.x, instruct.values.y);
                    this.currPos.y = instruct.values.y;
                    break;
                case "return":
                    ctx.closePath();
                    this.currPos = { x: 0, y: 0 };
                    break;
                case "curve":
                    ctx.bezierCurveTo(
                        instruct.values.controlx1,
                        instruct.values.controly1,
                        instruct.values.controlx2,
                        instruct.values.controly2,
                        instruct.values.x,
                        instruct.values.y
                    );
                    this.currPos.x = instruct.values.x;
                    this.currPos.y = instruct.values.y;
                    break;
                case "quad":
                    ctx.quadraticCurveTo(
                        instruct.values.controlx,
                        instruct.values.controly,
                        instruct.values.x,
                        instruct.values.y
                    );
                    this.currPos.x = instruct.values.x;
                    this.currPos.y = instruct.values.y;
                    break;
            }
        }
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 10;
        ctx.stroke();
        console.log(this.currPos);
    }

    Center() {}
}

class SvgAndMath {
    constructor(instructions) {
        this.instructions = instructions;
    }
}

// displays an error in the code
function CodeError(error) {
    console.error(error);
}

function CodeErrorDetector(input) {
    for (let instruct of input) {
        if (typeof instruct === "object") {
            for (let value in instruct.values) {
                if (
                    instruct.values[value] === "" ||
                    isNaN(Number(instruct.values[value]))
                ) {
                    instruct.values[value] = 0;
                } else {
                    instruct.values[value] = Number(instruct.values[value]);
                }
            }
        } else {
        }
    }
    return input;
}

$(function () {
    $(".code").on("input", function () {
        let code = new CodeReader($(this).html());
        let draw = new Drawing(code.Return());
    });
});
