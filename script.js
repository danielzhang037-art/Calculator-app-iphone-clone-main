(function () {
    const display = document.getElementById('display');
    const buttons = Array.from(document.querySelectorAll('.btn'));

    let firstValue = null; // holds the previous value
    let operator = null;   // holds the current operator
    let waitingForSecond = false; // whether the next digit starts a new number
    let currentValue = '0'; // string representation of the displayed/entered number

    const MAX_LENGTH = 12;

    function updateDisplay() {
        // trim and format display value
        let toShow = currentValue;
        if (toShow.length > MAX_LENGTH) {
            // try to shorten by removing trailing zeros after decimal
            if (toShow.indexOf('.') !== -1) {
                // use Number to format in shorter scientific if needed
                const num = Number(toShow);
                toShow = num.toPrecision(MAX_LENGTH - 1).replace(/\.\w+$/,'');
            } else {
                // use exponential for very large integers
                toShow = Number(toShow).toExponential(6);
            }
        }
        display.value = toShow;
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
            updateDisplay();
            return;
        }
        if (!currentValue.includes('.')) {
            currentValue += '.';
            updateDisplay();
        }
    }

    function clearAll() {
        firstValue = null;
        operator = null;
        waitingForSecond = false;
        currentValue = '0';
        updateDisplay();
    }

    function calculate(a, b, op) {
        const x = Number(a);
        const y = Number(b);
        let res = 0;
        switch (op) {
            case '+':
                res = x + y;
                break;
            case '-':
                res = x - y;
                break;
            case '*':
                res = x * y;
                break;
            case '/':
                if (y === 0) return 'Error';
                res = x / y;
                break;
            default:
                return b;
        }
        // avoid floating point artifacts
        if (!Number.isFinite(res)) return 'Error';
        // format to reasonable length
        const asStr = String(res);
        if (asStr.length > MAX_LENGTH) {
            // use toPrecision while trimming
            const p = Math.max(6, MAX_LENGTH - 2);
            return Number(res).toPrecision(p).replace(/(?:\.0+|(?<=\.\d*?)0+)$/,'');
        }
        return String(res);
    }

    function handleOperator(nextOperator) {
        if (!operator && !waitingForSecond) {
            // first time operator pressed
            firstValue = currentValue;
            operator = nextOperator;
            waitingForSecond = true;
        } else if (operator && waitingForSecond) {
            // change operator before entering second value
            operator = nextOperator;
        } else {
            // we have operator and a second value entered, compute
            const result = calculate(firstValue, currentValue, operator);
            currentValue = result;
            updateDisplay();

            // prepare for next operation
            firstValue = currentValue === 'Error' ? null : currentValue;
            operator = nextOperator === '=' ? null : nextOperator;
            waitingForSecond = true;
        }
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
                    // treat equals as an operator that triggers calculation
                    if (operator) {
                        handleOperator('=');
                        operator = null;
                        waitingForSecond = true;
                    }
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
            if (operator) {
                handleOperator('=');
            }
            e.preventDefault();
            return;
        }
    });

    // initialize
    updateDisplay();

})();