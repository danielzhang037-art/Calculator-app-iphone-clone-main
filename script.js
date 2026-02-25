(function () {
    const display = document.getElementById('display');
    const buttons = Array.from(document.querySelectorAll('.btn'));

    let firstValue = null; // holds the previous value
    let operator = null;   // holds the current operator
    let waitingForSecond = false; // whether the next digit starts a new number
    let currentValue = '0'; // string representation of the displayed/entered number
    let displayEquation = '';
    let expressionParts = [];

    const MAX_LENGTH = 12;

    function updateDisplay() {
        if (waitingForSecond) {
        display.value = displayEquation;
        } else {
            display.value = displayEquation + currentValue;
        }
    }

    function inputDigit(digit) {
        if (waitingForSecond) {
            currentValue = digit;
            waitingForSecond = false;
        } else {
            // avoid multiple leading zeros
            if (currentValue === '0') {
                currentValue = digit;
            } else {
                if (currentValue.length < 50) { // soft cap to avoid runaway growth
                    currentValue += digit;
                }
            }
        }

        updateDisplay();
    }

    function inputDecimal() {
        if (waitingForSecond) {
            currentValue = '0.';
            waitingForSecond = false;
            return;
        }
        if (!currentValue.includes('.')) {
            currentValue += '.';
        }
        updateDisplay();
    }

    function operatorSymbol(op) {
        switch(op) {
            case '+': return '+';
            case '-': return '-';
            case '*': return '×';
            case '/': return '÷';
            default: return op;
        }
    }

    function clearAll() {
        firstValue = null;
        operator = null;
        waitingForSecond = false;
        currentValue = '0';
        displayEquation = '';
        updateDisplay();
    }
    
    function calculate(expression) {
        // replace display symbols just in case
        try {
            // expression is an array joined with real operators + - * /
            const result = Function('"use strict"; return (' + expression + ')')();
            if (!Number.isFinite(result)) return 'Error';
            const asStr = String(result);
            if (asStr.length > MAX_LENGTH) {
                const p = Math.max(6, MAX_LENGTH - 2);
                return Number(result).toPrecision(p).replace(/(?:\.0+|(?<=\.\d*?)0+)$/, '');
            }
            return String(result);
        } catch {
            return 'Error';
        }
    }

    function handleOperator(nextOperator) {
        if (nextOperator === '=') {
                if (expressionParts.length > 0) {
                    // commit the current value and evaluate
                    const fullExpression = [...expressionParts, currentValue].join('');
                    const result = calculate(fullExpression);
                    displayEquation = '';
                    expressionParts = [];
                    currentValue = String(result);
                    operator = null;
                    waitingForSecond = false;
                    updateDisplay();
                }
                return;
        } 
    
        if (operator && waitingForSecond) {
            // just swap the operator, update last char of displayEquation
            operator = nextOperator;
            expressionParts[expressionParts.length - 1] = nextOperator;
            displayEquation = displayEquation.slice(0, -1) + operatorSymbol(nextOperator);
        } else {
            // commit currentValue and operator into expressionParts
            expressionParts.push(currentValue, nextOperator);
            displayEquation = displayEquation + currentValue + operatorSymbol(nextOperator);
            operator = nextOperator;
            waitingForSecond = true;
        }

        updateDisplay();
    }

    // attach button listeners
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.id;
            if (/^[0-9]$/.test(id)) {
                inputDigit(id);
                return;
            }
            switch (id) {
                case 'decimal':
                    inputDecimal();
                    break;
                case 'clear':
                    clearAll();
                    break;
                case 'add':
                    handleOperator('+');
                    break;
                case 'subtract':
                    handleOperator('-');
                    break;
                case 'multiply':
                    handleOperator('*');
                    break;
                case 'divide':
                    handleOperator('/');
                    break;
                case 'equals':
                    handleOperator('=');
                    break;
                default:
                    break;
            }
        });
    });

    // keyboard support
    window.addEventListener('keydown', (e) => {
        if (e.key >= '0' && e.key <= '9') {
            inputDigit(e.key);
            e.preventDefault();
            return;
        }
        if (e.key === '.' || e.key === ',') {
            inputDecimal();
            e.preventDefault();
            return;
        }
        if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
            clearAll();
            e.preventDefault();
            return;
        }
        if (['+', '-', '*', '/'].includes(e.key)) {
            handleOperator(e.key);
            e.preventDefault();
            return;
        }
        if (e.key === 'Enter' || e.key === '=') {
            handleOperator('=');
            e.preventDefault();
            return;
        }
    });

    // initialize
    updateDisplay();

})();