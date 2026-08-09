const display = document.querySelector("#display");
const keypad = document.querySelector(".keypad");
const angleButton = document.querySelector("#angle-mode");

let expression = "";
let lastAnswer = 0;
let angleMode = "DEG";
let hasError = false;

function updateDisplay() {
  display.value = expression;
}

function resetAfterError() {
  if (hasError) {
    expression = "";
    hasError = false;
  }
}

function appendValue(value) {
  resetAfterError();
  expression += value;
  updateDisplay();
}

function appendFunction(name) {
  resetAfterError();
  expression += `${name}(`;
  updateDisplay();
}

function evaluateExpression(source) {
  if (!source.trim()) return 0;
  if (!/^[0-9+\-*/().,^\sA-Za-z]+$/.test(source))
    throw new Error("Invalid characters");

  const angle = (value) =>
    angleMode === "DEG" ? (value * Math.PI) / 180 : value;
  const transformed = source.replace(/\bpi\b/g, "PI").replace(/\^/g, "**");
  const evaluator = Function(
    "sin",
    "cos",
    "tan",
    "log",
    "ln",
    "sqrt",
    "PI",
    "e",
    `"use strict"; return (${transformed});`,
  );
  const result = evaluator(
    (value) => Math.sin(angle(value)),
    (value) => Math.cos(angle(value)),
    (value) => Math.tan(angle(value)),
    Math.log10,
    Math.log,
    Math.sqrt,
    Math.PI,
    Math.E,
  );

  if (!Number.isFinite(result)) throw new Error("Undefined result");
  return Number.parseFloat(result.toPrecision(12));
}

function calculate() {
  try {
    lastAnswer = evaluateExpression(expression);
    expression = String(lastAnswer);
    hasError = false;
  } catch (error) {
    expression = "Syntax Error";
    hasError = true;
  }
  updateDisplay();
}

function applyAction(action) {
  if (action === "clear") {
    expression = "";
    hasError = false;
  } else if (action === "delete") {
    resetAfterError();
    expression = expression.slice(0, -1);
  } else if (action === "calculate") {
    calculate();
    return;
  } else if (action === "percent") {
    try {
      expression = String(evaluateExpression(expression) / 100);
    } catch (error) {
      expression = "Syntax Error";
      hasError = true;
    }
  } else if (action === "square") {
    if (expression) expression = `(${expression})^2`;
  } else if (action === "reciprocal") {
    if (expression) expression = `1/(${expression})`;
  } else if (action === "answer") {
    appendValue(String(lastAnswer));
    return;
  } else if (action === "angle") {
    angleMode = angleMode === "DEG" ? "RAD" : "DEG";
    angleButton.textContent = angleMode;
  }
  updateDisplay();
}

keypad.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.value) appendValue(button.dataset.value);
  if (button.dataset.function) appendFunction(button.dataset.function);
  if (button.dataset.action) applyAction(button.dataset.action);
});

document.addEventListener("keydown", (event) => {
  const key = event.key;
  if ("0123456789+-*/().^".includes(key)) {
    appendValue(key);
  } else if (key === "Enter" || key === "=") {
    event.preventDefault();
    calculate();
  } else if (key === "Backspace") {
    applyAction("delete");
  } else if (key === "Escape" || key === "Delete") {
    applyAction("clear");
  } else if (key === "%") {
    applyAction("percent");
  }
});
