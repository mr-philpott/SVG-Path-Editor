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

// https://stackoverflow.com/questions/1068834/object-comparison-in-javascript
function CompareObjects(x, y) {
    // remember that NaN === NaN returns false
    // and isNaN(undefined) returns true
    if (
        isNaN(x) &&
        isNaN(y) &&
        typeof x === "number" &&
        typeof y === "number"
    ) {
        return true;
    }

    // Compare primitives and functions.
    // Check if both arguments link to the same object.
    // Especially useful on the step where we compare prototypes
    if (x === y) {
        return true;
    }

    // Works in case when functions are created in constructor.
    // Comparing dates is a common scenario. Another built-ins?
    // We can even handle functions passed across iframes
    if (
        (typeof x === "function" && typeof y === "function") ||
        (x instanceof Date && y instanceof Date) ||
        (x instanceof RegExp && y instanceof RegExp) ||
        (x instanceof String && y instanceof String) ||
        (x instanceof Number && y instanceof Number)
    ) {
        return x.toString() === y.toString();
    }

    // At last checking prototypes as good as we can
    if (!(x instanceof Object && y instanceof Object)) {
        return false;
    }
}

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
                case "m":
                    if (value + 2 < this.runningInput.length) {
                        instructions.push(
                            new Instruction("m", {
                                x: Number(this.runningInput[value + 1]),
                                y: Number(this.runningInput[value + 2]),
                            })
                        );
                        value += 1;
                    }
                    break;
                case "l":
                    if (value + 2 < this.runningInput.length) {
                        instructions.push(
                            new Instruction("l", {
                                x: Number(this.runningInput[value + 1]),
                                y: Number(this.runningInput[value + 2]),
                            })
                        );
                        value += 1;
                    }
                    break;
                case "h":
                    if (value + 1 < this.runningInput.length) {
                        console.log(Number(this.runningInput[value + 1]));
                        instructions.push(
                            new Instruction("h", {
                                x: Number(this.runningInput[value + 1]),
                            })
                        );
                        value += 1;
                    }
                    break;
                case "v":
                    if (value + 1 < this.runningInput.length) {
                        instructions.push(
                            new Instruction("v", {
                                y: Number(this.runningInput[value + 1]),
                            })
                        );
                        value += 1;
                    }
                    break;
                case "z":
                    if (value + 0 < this.runningInput.length) {
                        instructions.push(new Instruction("z", {}));
                        value += 0;
                    }
                    break;
                case "c":
                    if (value + 6 < this.runningInput.length) {
                        instructions.push(
                            new Instruction("c", {
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
                case "q":
                    if (value + 4 < this.runningInput.length) {
                        instructions.push(
                            new Instruction("q", {
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
        this.mousePos = { x: 0, y: 0 };
        this.dragLeway = 7;
        this.pointFollow = false;
        this.pointValue = "";

        this.dragables = [];

        this.Events();
        this.Exe();
    }

    Events() {
        $(c).on({
            mousedown: (e) => {
                for (let point of this.dragables) {
                    if (
                        this.mousePos.x < point.x + this.dragLeway &&
                        this.mousePos.x > point.x - this.dragLeway &&
                        this.mousePos.y < point.y + this.dragLeway &&
                        this.mousePos.y > point.y - this.dragLeway
                    ) {
                        this.pointValue = point;
                        this.pointFollow = true;
                    }
                }
            },
            mouseup: (e) => {
                this.UpdateCode();
                this.pointFollow = false;
            },
            mousemove: (e) => {
                // https://riptutorial.com/html5-canvas/example/11659/detecting-mouse-position-on-the-canvas
                let cRect = c.getBoundingClientRect();
                this.mousePos.x = Math.round(e.clientX - cRect.left);
                this.mousePos.y = Math.round(e.clientY - cRect.top);

                if (this.pointFollow) {
                    if (this.pointValue.type === "point") {
                        this.instructions[
                            this.pointValue.index
                        ].values.x = this.mousePos.x;
                        this.instructions[
                            this.pointValue.index
                        ].values.y = this.mousePos.y;
                    } else if (this.pointValue.type === "control") {
                        this.instructions[
                            this.pointValue.index
                        ].values.controlx = this.mousePos.x;
                        this.instructions[
                            this.pointValue.index
                        ].values.controly = this.mousePos.y;
                    } else if (this.pointValue.type === "control1") {
                        this.instructions[
                            this.pointValue.index
                        ].values.controlx1 = this.mousePos.x;
                        this.instructions[
                            this.pointValue.index
                        ].values.controly1 = this.mousePos.y;
                    } else if (this.pointValue.type === "control2") {
                        console.log("hit");
                        this.instructions[
                            this.pointValue.index
                        ].values.controlx2 = this.mousePos.x;
                        this.instructions[
                            this.pointValue.index
                        ].values.controly2 = this.mousePos.y;
                    }

                    this.Exe();
                }
            },
        });
    }

    Exe() {
        this.dragables = [];
        let instuctIndex = 0;
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.beginPath();
        for (let instruct of this.instructions) {
            switch (instruct.keyword) {
                case "m":
                    ctx.moveTo(instruct.values.x, instruct.values.y);
                    this.currPos.x = instruct.values.x;
                    this.currPos.y = instruct.values.y;
                    this.dragables.push({
                        x: this.currPos.x,
                        y: this.currPos.y,
                        type: "point",
                        index: instuctIndex,
                    });
                    instuctIndex++;
                    break;
                case "l":
                    ctx.lineTo(instruct.values.x, instruct.values.y);
                    this.currPos.x = instruct.values.x;
                    this.currPos.y = instruct.values.y;
                    this.dragables.push({
                        x: this.currPos.x,
                        y: this.currPos.y,
                        type: "point",
                        index: instuctIndex,
                    });
                    instuctIndex++;
                    break;
                case "h":
                    ctx.lineTo(instruct.values.x, this.currPos.y);
                    this.currPos.x = instruct.values.x;
                    this.dragables.push({
                        x: this.currPos.x,
                        y: this.currPos.y,
                        type: "point",
                        index: instuctIndex,
                    });
                    instuctIndex++;
                    break;
                case "v":
                    ctx.lineTo(this.currPos.x, instruct.values.y);
                    this.currPos.y = instruct.values.y;
                    this.dragables.push({
                        x: this.currPos.x,
                        y: this.currPos.y,
                        type: "point",
                        index: instuctIndex,
                    });
                    instuctIndex++;
                    break;
                case "z":
                    ctx.closePath();
                    this.currPos = { x: 0, y: 0 };
                    instuctIndex++;
                    break;
                case "c":
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
                    this.dragables.push(
                        {
                            x: this.currPos.x,
                            y: this.currPos.y,
                            type: "point",
                            index: instuctIndex,
                        },
                        {
                            x: instruct.values.controlx1,
                            y: instruct.values.controly1,
                            type: "control1",
                            index: instuctIndex,
                        },
                        {
                            x: instruct.values.controlx2,
                            y: instruct.values.controly2,
                            type: "control2",
                            index: instuctIndex,
                        }
                    );
                    instuctIndex++;
                    break;
                case "q":
                    ctx.quadraticCurveTo(
                        instruct.values.controlx,
                        instruct.values.controly,
                        instruct.values.x,
                        instruct.values.y
                    );
                    this.currPos.x = instruct.values.x;
                    this.currPos.y = instruct.values.y;
                    this.dragables.push(
                        {
                            x: this.currPos.x,
                            y: this.currPos.y,
                            type: "point",
                            index: instuctIndex,
                        },
                        {
                            x: instruct.values.controlx,
                            y: instruct.values.controly,
                            type: "control",
                            index: instuctIndex,
                        }
                    );
                    instuctIndex++;
                    break;
            }
        }
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 5;
        ctx.stroke();

        // Adds draggable dots to the screen
        for (let point of this.dragables) {
            ctx.beginPath();
            if (
                point.type === "control" ||
                point.type === "control1" ||
                point.type === "control2"
            ) {
                ctx.strokeStyle = "rgb(115, 115, 252)";
            } else {
                ctx.strokeStyle = "#fff";
            }
            ctx.moveTo(point.x, point.y);
            ctx.ellipse(point.x, point.y, 5, 5, 0, 0, 2 * Math.PI);
            ctx.stroke();
        }
    }

    UpdateCode() {
        let html = "";
        for (let instruct of this.instructions) {
            let identi = "";
            for (let i in instruct.values) {
                identi += `${instruct.values[i]} `;
            }
            html += `<div>${instruct.keyword} ${identi}</div>`;
        }
        $(".code").html(html);
    }
}

class SvgAndMath {
    constructor(instructions) {
        this.instructions = instructions;
    }
}

$(function () {
    $(".code").on("input", function () {
        let code = new CodeReader($(this).html());
        let draw = new Drawing(code.Return());
    });
});
