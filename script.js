(function () {
    const display = document.getElementById('display');
    const buttons = Array.from(document.querySelectorAll('.btn'));

    let firstValue = null;
    let operator = null;
    let waitingForSecond = false;
    let currentValue = '0';
    let displayEquation = '';
    let expressionParts = [];
    let isRadians = false;
    let parenOpen = false;
    const MAX_LENGTH = 12;

    function updateDisplay() {
        const toDisplay = (displayEquation + (waitingForSecond ? '' : currentValue))
            .replace(/\*/g, '×')
            .replace(/\//g, '÷');
        display.value = toDisplay;
    }

    function endsWithOperator(str) {
        return /[+\-*/]$/.test(str);
    }

    function toggleSign() {
        if (currentValue.startsWith('-')) {
            currentValue = currentValue.slice(1);
        } else if (currentValue !== '0') {
            currentValue = '-' + currentValue;
        }
        updateDisplay();
    }

    function inputDigit(digit) {
        if (waitingForSecond) {
            currentValue = digit;
            waitingForSecond = false;
            
        } else if (currentValue === 'π' || currentValue === 'e') {
            expressionParts.push('(' + currentValue + ')', '*');
            displayEquation = displayEquation + currentValue + '×';
            operator = '*';
            currentValue = digit;
            waitingForSecond = false;
        } else if (endsWithOperator(currentValue) || currentValue.endsWith('(')) {
            currentValue += digit;
        } else {
            if (currentValue === '0') {
                currentValue = digit;
            } else {
                if (currentValue.length < 50) {
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

    function inputPercent() {
        if (!currentValue.includes('%')) {
            currentValue = currentValue + '%';
            updateDisplay();
        }
    }

    function inputBackspace() {
        if(display.value === 'Error'){
            clearAll();
            return;
        }
        else if (waitingForSecond) {
            // remove the last operator
            
            expressionParts.pop();
            displayEquation = displayEquation.slice(0, -1);
            operator = expressionParts.length > 0 ? expressionParts[expressionParts.length - 1] : null;
            waitingForSecond = false;
            const popped = expressionParts.pop() || '0';
            currentValue = popped.replace(/^\(|\)$/g, '');
            displayEquation = displayEquation.slice(0, -(currentValue.length));
        } else if (currentValue.length > 1) {
            if(currentValue.slice(-1) === '('){
                parenOpen = false;
            }
            currentValue = currentValue.slice(0, -1);
        } else if (expressionParts.length > 0) {
            expressionParts.pop();
            displayEquation = displayEquation.slice(0, -1);
            operator = expressionParts.length > 0 ? expressionParts[expressionParts.length - 1] : null;
            const popped = expressionParts.pop() || '0';
            currentValue = popped.replace(/^\(|\)$/g, '');
            displayEquation = displayEquation.slice(0, -(currentValue.length));
        } else {
            currentValue = '0';
        }
        updateDisplay();
    }

    function inputConstant(value, symbol) {
        if (waitingForSecond) {
            currentValue = symbol;
            waitingForSecond = false;
        } else if (currentValue === '0') {
            currentValue = symbol;
        } else if (currentValue.endsWith('(') || endsWithOperator(currentValue)) {
            currentValue += symbol;
        } else if (/\d$/.test(currentValue)) {
            // ends with a digit — auto insert * before the constant
            currentValue += '*' + symbol;
        } else {
            expressionParts.push('(' + currentValue + ')', '*');
            displayEquation = displayEquation + currentValue + '×';
            operator = '*';
            currentValue = symbol;
            waitingForSecond = false;
        }
        updateDisplay();
    }

    function inputTrig(func) {
        if (waitingForSecond) {
            currentValue = func + '(';
            waitingForSecond = false;
        } else if (currentValue === '0') {
            currentValue = func + '(';
        } else if (currentValue.endsWith('(') || endsWithOperator(currentValue)) {
            currentValue += func + '(';
        } else {
            expressionParts.push('(' + currentValue + ')', '*');
            displayEquation = displayEquation + currentValue + '×';
            operator = '*';
            currentValue = func + '(';
            waitingForSecond = false;
        }
        updateDisplay();
    }

    function inputParen(paren) {
        if (currentValue === '0' && paren === '(') {
            currentValue = '(';
            parenOpen = true;
        } 
        if(paren === ')' && parenOpen === false ){
            return;
        }
        
        else if(parenOpen === false){
            currentValue += paren;
            parenOpen = true;
        }

        else if(parenOpen === true && paren === ')' ){
            currentValue += paren;
            parenOpen = false;
        }
        updateDisplay();
    }

    function clearAll() {
        firstValue = null;
        operator = null;
        waitingForSecond = false;
        currentValue = '0';
        displayEquation = '';
        expressionParts = [];
        parenOpen = false;
        updateDisplay();
    }

    function calculate(expression) {
        try {
            const normalized = expression
                .replace(/(\d+\.?\d*)%/g, '($1/100)')
                .replace(/π/g, `(${Math.PI})`)
                .replace(/(?<![a-zA-Z])e(?![a-zA-Z])/g, `(${Math.E})`)
                .replace(/sin\(/g, 'sin(')
                .replace(/cos\(/g, 'cos(')
                .replace(/tan\(/g, 'tan(');

            const sinFn = isRadians ? Math.sin : (x) => Math.sin(x * Math.PI / 180);
            const cosFn = isRadians ? Math.cos : (x) => Math.cos(x * Math.PI / 180);
            const tanFn = isRadians ? Math.tan : (x) => Math.tan(x * Math.PI / 180);

            let result = new Function('sin', 'cos', 'tan', `"use strict"; return (${normalized})`)(sinFn, cosFn, tanFn);

            if (!Number.isFinite(result)) return 'Error';
            if (Math.abs(result) > 1e15) return 'Error';
            if (Math.abs(result - Math.round(result)) < 1e-9) {
                result = Math.round(result);
            } else {
                result = parseFloat(result.toPrecision(10));
            }
            const asStr = String(result);
            if (asStr.length > MAX_LENGTH) {
                const p = Math.max(6, MAX_LENGTH - 2);
                return Number(result).toPrecision(p).replace(/(?:\.0+|(?<=\.\d*?)0+)$/, '');
            }
            return String(result);
        } catch (error) {
            console.error('Calculation error:', error);
            return 'Error';
        }
    }

    function handleOperator(nextOperator) {
        if (nextOperator === '=') {
            if (expressionParts.length > 0 || currentValue !== '0') {
                const lastValue = '(' + currentValue + ')';
                const fullExpression = [...expressionParts, lastValue].join('');
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

        const openCount = (currentValue.match(/\(/g) || []).length;
        const closeCount = (currentValue.match(/\)/g) || []).length;
        if (openCount > closeCount) {
            currentValue += nextOperator;
            updateDisplay();
            return;
        }

        if (operator && waitingForSecond) {
            operator = nextOperator;
            expressionParts[expressionParts.length - 1] = nextOperator;
            displayEquation = displayEquation.slice(0, -1) + operatorSymbol(nextOperator);
        } else {
            const valueToCommit = '(' + currentValue + ')';
            expressionParts.push(valueToCommit, nextOperator);
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
                case 'pi':
                    inputConstant(Math.PI.toString(), 'π');
                    break;
                case 'e':
                    inputConstant(Math.E.toString(), 'e');
                    break;

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
                case 'percent':
                    inputPercent();
                    break;
                case 'backspace':
                    inputBackspace();
                    break;
                case 'toggle-sign':
                    toggleSign();
                    break;
                case 'sin':
                    inputTrig('sin');
                    break;
                case 'cos':
                    inputTrig('cos');
                    break;
                case 'tan':
                    inputTrig('tan');
                    break;
                case 'open-paren':
                    inputParen('(');
                    break;
                case 'close-paren':
                    inputParen(')');
                    break;
                case 'rad':
                    isRadians = !isRadians;
                    document.getElementById('rad').textContent = isRadians ? 'Deg' : 'Rad';
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
        if (e.key === '%') {
            inputPercent();
            e.preventDefault();
            return;
        }
        if (e.key === 'Backspace') {
            inputBackspace();
            e.preventDefault();
            return;
        }
        if (e.key === 'Enter' || e.key === '=') {
            handleOperator('=');
            e.preventDefault();
            return;
        }
        if (e.key === 'p') {
            inputConstant(Math.PI.toString(), 'π');
            e.preventDefault();
            return;
        }
        if (e.key === 'e') {
            inputConstant(Math.E.toString(), 'e');
            e.preventDefault();
            return;
        }
        if (e.key === '(') {
            inputParen('(');
            e.preventDefault();
            return;
        }
        if (e.key === ')') {
            inputParen(')');
            e.preventDefault();
            return;
        }
    });

    // initialize
    document.getElementById('rad').textContent = 'Rad';
    updateDisplay();

    document.getElementById('sci-toggle').addEventListener('click', () => {
        const sci = document.getElementById('sci-buttons');
        const isVisible = sci.style.display !== 'none';
        sci.style.display = isVisible ? 'none' : 'grid';
        document.getElementById('sci-toggle').textContent = isVisible ? 'Scientific' : 'Basic';
    });
})();