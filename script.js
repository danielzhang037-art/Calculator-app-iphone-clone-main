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
    const MAX_LENGTH = 12;
    let memory = null;
    let isSecond = false;
    let logyActive = false;
    let logyArgument = '';
    let logyBaseActive = false;
    let logyBase = ''; // stores the base being typed separately


    function toSubscript(str) {
        const subscriptMap = {
            '0':'₀','1':'₁','2':'₂','3':'₃','4':'₄',
            '5':'₅','6':'₆','7':'₇','8':'₈','9':'₉',
            '+':'₊','-':'₋','(':' ₍',')':'₎',
            'a':'ₐ','b':'ᵦ','c':'꜀','d':'ᵈ','e':'ₑ',
            'f':'ᶠ','g':'ᵍ','h':'ₕ','i':'ᵢ','j':'ⱼ',
            'k':'ₖ','l':'ₗ','m':'ₘ','n':'ₙ','o':'ₒ',
            'p':'ₚ','q':'ᵩ','r':'ᵣ','s':'ₛ','t':'ₜ',
            'u':'ᵤ','v':'ᵥ','w':'ᵥᵥ','x':'ₓ','y':'ᵧ',
            'z':'ᵤ','π':'π','.':'.','*':'×','/':'÷'
        };
        return str.split('').map(c => subscriptMap[c] || c).join('');
    }

    function updateDisplay() {
        let raw = displayEquation + (waitingForSecond ? '' : currentValue);

        if (logyActive) {
            const subscriptBase = toSubscript(logyBase || '');
            raw = raw.replace(/log\(/, 'log' + subscriptBase + '(');
        }

        const toDisplay = raw
            .replace(/\*/g, '×')
            .replace(/\//g, '÷')
            .replace(/asin\(/g, 'sin⁻¹(')
            .replace(/acos\(/g, 'cos⁻¹(')
            .replace(/atan\(/g, 'tan⁻¹(')
            .replace(/asinh\(/g, 'sinh⁻¹(')
            .replace(/acosh\(/g, 'cosh⁻¹(')
            .replace(/atanh\(/g, 'tanh⁻¹(')
            .replace(/log10\(/g, 'log₁₀(')
            .replace(/log2\(/g, 'log₂(')
            .replace(/logy\(([^,]+),/g, (match, base) => 'log' + toSubscript(base) + '(')
            .replace(/\)(?=\s*$)/, ')');
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
        if (logyBaseActive) {
            const openCount = (logyBase.match(/\(/g) || []).length;
            const closeCount = (logyBase.match(/\)/g) || []).length;
            if (logyBase === '' || openCount === closeCount) {
                logyBase += digit;
            } else {
                logyBase += digit;
            }
            updateDisplay();
            return;
        }

        if (logyActive && logyArgument !== '' && !endsWithOperator(currentValue) && !currentValue.endsWith('(')) {
            const openCount = (currentValue.match(/\(/g) || []).length;
            const closeCount = (currentValue.match(/\)/g) || []).length;
            if (openCount === closeCount) {
                currentValue += digit;
                updateDisplay();
                return;
            }
        }

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
        
        if (logyBaseActive) {
            if (!logyBase.includes('.')) {
                logyBase += '.';
            }
            updateDisplay();
            return;
        }
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
        if (logyActive && logyArgument === '') {
            logyActive = false;
            logyBaseActive = false;
            updateLogyButton();
        }
        if (logyBaseActive) {
            logyActive = false;
            logyArgument = '';
            logyBaseActive = false;
            updateLogyButton();
        }
        if (currentValue.endsWith('%') || /[a-z]/.test(currentValue)) {
            currentValue = '(' + currentValue + ')%';
        } else {
            currentValue = currentValue + '%';
        }
        updateDisplay();
    }

    function inputBackspace() {
        if (waitingForSecond) {
            expressionParts.pop();
            displayEquation = displayEquation.slice(0, -1);
            operator = expressionParts.length > 0 ? expressionParts[expressionParts.length - 1] : null;
            waitingForSecond = false;
            const popped = expressionParts.pop() || '0';
            currentValue = popped.replace(/^\(|\)$/g, '');
            displayEquation = displayEquation.slice(0, -(currentValue.length));
        } else if (currentValue.length > 1) {
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
        if (logyBaseActive) {
            logyBase += symbol;
            updateDisplay();
            return;
        }
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
        const append = func + '(';
        if (logyBaseActive) {
            logyBase += append;
            updateDisplay();
            return;
        }
        if (waitingForSecond) {
            currentValue = append;
            waitingForSecond = false;
        } else if (currentValue === '0') {
            currentValue = append;
        } else if (currentValue.endsWith('(') || endsWithOperator(currentValue)) {
            currentValue += append;
        } else {
            expressionParts.push('(' + currentValue + ')', '*');
            displayEquation = displayEquation + currentValue + '×';
            operator = '*';
            currentValue = append;
            waitingForSecond = false;
        }
        updateDisplay();
    }

    function inputLog(func) {
        if (func === 'logy') {
            logyActive = true;
            logyArgument = '';
            logyBase = '';
            logyBaseActive = false;
            updateLogyButton();
            const append = 'log(';
            if (waitingForSecond) {
                currentValue = append;
                waitingForSecond = false;
            } else if (currentValue === '0') {
                currentValue = append;
            } else if (currentValue.endsWith('(') || endsWithOperator(currentValue)) {
                currentValue += append;
            } else {
                expressionParts.push('(' + currentValue + ')', '*');
                displayEquation = displayEquation + currentValue + '×';
                operator = '*';
                currentValue = append;
                waitingForSecond = false;
            }
        } else {
            if (logyBaseActive) {
                logyBase += func + '(';
                updateDisplay();
                return;
            }
            inputTrig(func);
        }
        updateDisplay();
    }


    function inputParen(paren) {
        if (logyBaseActive) {
            logyBase += paren;
            updateDisplay();
            return;
        }
        if (currentValue === '0' && paren === '(') {
            currentValue = '(';
        } else {
            currentValue += paren;
        }
        if (logyActive && paren === ')') {
            const openCount = (currentValue.match(/\(/g) || []).length;
            const closeCount = (currentValue.match(/\)/g) || []).length;
            if (openCount === closeCount) {
                logyArgument = currentValue;
                logyBase = '';
                logyBaseActive = true;
                updateLogyButton();
            }
        }
        updateDisplay();
    }

    function updateMemoryButton() {
        const mrBtn = document.getElementById('mr');
        mrBtn.style.backgroundColor = memory !== null ? '#a0a0a0' : '';
    }

    function updateLogyButton() {
        document.getElementById('ln').style.backgroundColor = logyBaseActive ? '#a0a0a0' : '';
    }


    function memoryStore() {
        // evaluate current expression first
        const lastValue = '(' + currentValue + ')';
        const fullExpression = [...expressionParts, lastValue].join('');
        const evaluated = parseFloat(calculate(fullExpression)) || 0;
        if (memory === null) {
            memory = evaluated;
        } else {
            memory += evaluated;
        }
        updateMemoryButton();
    }

    function memorySubtract() {
        // evaluate current expression first
        const lastValue = '(' + currentValue + ')';
        const fullExpression = [...expressionParts, lastValue].join('');
        const evaluated = parseFloat(calculate(fullExpression)) || 0;
        if (memory === null) {
            memory = -evaluated;
        } else {
            memory -= evaluated;
        }
        updateMemoryButton();
    }

    function memoryClear() {
        memory = null;
        updateMemoryButton();
    }

    function memoryRecall() {
        if (memory === null) return;
        const memStr = String(memory);
        if (currentValue === '0' && expressionParts.length === 0) {
            // display is just 0 — replace with mr value
            currentValue = memStr;
            waitingForSecond = false;
        } else if (waitingForSecond) {
            // after an operator — start new number with mr value
            currentValue = memStr;
            waitingForSecond = false;
        } else {
            // mid expression — auto insert multiply
            currentValue += '*' + memStr;
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
        logyActive = false;
        logyArgument = '';
        logyBase = '';
        logyBaseActive = false;
        updateLogyButton();
        updateDisplay();
    }

    function toggleSecond() {
        isSecond = !isSecond;
        document.getElementById('second').style.backgroundColor = isSecond ? '#a0a0a0' : '';
        document.getElementById('ex').textContent = isSecond ? 'yˣ' : 'eˣ';
        document.getElementById('tenx').textContent = isSecond ? '2ˣ' : '10ˣ';
        document.getElementById('ln').innerHTML = isSecond ? 'log<sub>y</sub>' : 'ln';
        document.getElementById('log').textContent = isSecond ? 'log₂' : 'log₁₀';
        document.getElementById('sin').textContent = isSecond ? 'sin⁻¹' : 'sin';
        document.getElementById('cos').textContent = isSecond ? 'cos⁻¹' : 'cos';
        document.getElementById('tan').textContent = isSecond ? 'tan⁻¹' : 'tan';
        document.getElementById('sinh').textContent = isSecond ? 'sinh⁻¹' : 'sinh';
        document.getElementById('cosh').textContent = isSecond ? 'cosh⁻¹' : 'cosh';
        document.getElementById('tanh').textContent = isSecond ? 'tanh⁻¹' : 'tanh';
    }

    function calculate(expression) {
        try {
            expression = expression.replace(/logy\(([^,]+),([^)]+(?:\([^)]*\)[^)]*)*)\)/g, 
                (match, base, arg) => `(Math.log(${arg})/Math.log(${base}))`);
            expression = expression.replace(/log\(([^)]+)\)/g, 'log10($1)');
            const normalized = expression
                .replace(/\(([^()]*(?:\([^()]*\)[^()]*)*)\)%/g, '(($1)/100)')
                .replace(/(\d+\.?\d*)%/g, '($1/100)')
                .replace(/π/g, `(${Math.PI})`)
                .replace(/(?<![a-zA-Z])e(?![a-zA-Z])/g, `(${Math.E})`)
                .replace(/sin\(/g, 'sin(')
                .replace(/cos\(/g, 'cos(')
                .replace(/tan\(/g, 'tan(')
                .replace(/asin\(/g, 'asin(')
                .replace(/acos\(/g, 'acos(')
                .replace(/atan\(/g, 'atan(');


            const sinFn = isRadians ? Math.sin : (x) => Math.sin(x * Math.PI / 180);
            const cosFn = isRadians ? Math.cos : (x) => Math.cos(x * Math.PI / 180);
            const tanFn = isRadians ? Math.tan : (x) => Math.tan(x * Math.PI / 180);
            const asinFn = isRadians ? Math.asin : (x) => Math.asin(x) * 180 / Math.PI;
            const acosFn = isRadians ? Math.acos : (x) => Math.acos(x) * 180 / Math.PI;
            const atanFn = isRadians ? Math.atan : (x) => Math.atan(x) * 180 / Math.PI;
            const sinhFn = Math.sinh;
            const coshFn = Math.cosh;
            const tanhFn = Math.tanh;
            const asinhFn = Math.asinh;
            const acoshFn = Math.acosh;
            const atanhFn = Math.atanh;

            const lnFn = Math.log;
            const log10Fn = Math.log10;
            const log2Fn = Math.log2;
            const logyFn = (base, x) => Math.log(x) / Math.log(base);

            let result = new Function('sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh', 'ln', 'log10', 'log2', 'logy',
    `           "use strict"; return (${normalized})`)(sinFn, cosFn, tanFn, asinFn, acosFn, atanFn, sinhFn, coshFn, tanhFn, asinhFn, acoshFn, atanhFn, lnFn, log10Fn, log2Fn, logyFn);

            if (isNaN(result)) return 'Undefined';
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
        if (logyBaseActive) {
            const base = logyBase || '10';
            // extract argument from log( ... )
            const argMatch = logyArgument.match(/^log\((.+)\)$/);
            const arg = argMatch ? argMatch[1] : logyArgument;
            currentValue = `logy(${base},${arg})`;
            logyActive = false;
            logyArgument = '';
            logyBase = '';
            logyBaseActive = false;
            updateLogyButton();
        }
        if (logyActive && logyArgument !== '') {
            const openCount = (currentValue.match(/\(/g) || []).length;
            const closeCount = (currentValue.match(/\)/g) || []).length;
            if (openCount === closeCount && !['+', '-', '*', '/'].includes(nextOperator)) {
                // only exit if parens are balanced and it's a real operator
            }
            if (openCount === closeCount) {
                logyActive = false;
                logyArgument = '';
                logyBaseActive = false;
                updateLogyButton();
            }
        }
        if (nextOperator === '=') {
            if (expressionParts.length > 0 || currentValue !== '0') {
                let fullExpression;
                if (waitingForSecond) {
                    // operator was pressed but no second number — evaluate without the last operator
                    fullExpression = [...expressionParts.slice(0, -1)].join('');
                } else {
                    const lastValue = '(' + currentValue + ')';
                    fullExpression = [...expressionParts, lastValue].join('');
                }
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
                    isSecond ? inputTrig('asin') : inputTrig('sin');
                    if (isSecond) { isSecond = false; toggleSecond(); }
                    break;
                case 'cos':
                    isSecond ? inputTrig('acos') : inputTrig('cos');
                    if (isSecond) { isSecond = false; toggleSecond(); }
                    break;
                case 'tan':
                    isSecond ? inputTrig('atan') : inputTrig('tan');
                    if (isSecond) { isSecond = false; toggleSecond(); }
                    break;
                case 'sinh':
                    isSecond ? inputTrig('asinh') : inputTrig('sinh');
                    if (isSecond) { isSecond = false; toggleSecond(); }
                    break;
                case 'cosh':
                    isSecond ? inputTrig('acosh') : inputTrig('cosh');
                    if (isSecond) { isSecond = false; toggleSecond(); }
                    break;
                case 'tanh':
                    isSecond ? inputTrig('atanh') : inputTrig('tanh');
                    if (isSecond) { isSecond = false; toggleSecond(); }
                    break;
                case 'open-paren':
                    inputParen('(');
                    break;
                case 'close-paren':
                    inputParen(')');
                    break;
                case 'mc':
                    memoryClear();
                    break;
                case 'mplus':
                    memoryStore();
                    break;
                case 'mminus':
                    memorySubtract();
                    break;
                case 'mr':
                    memoryRecall();
                    break;
                case 'second':
                    toggleSecond();
                    break;
                case 'rad':
                    isRadians = !isRadians;
                    document.getElementById('rad').textContent = isRadians ? 'Deg' : 'Rad';
                    break;

                case 'ln':
                    isSecond ? inputLog('logy') : inputTrig('ln');
                    if (isSecond) { isSecond = false; toggleSecond(); }
                    break;
                case 'log':
                    isSecond ? inputTrig('log2') : inputTrig('log10');
                    if (isSecond) { isSecond = false; toggleSecond(); }
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
    updateMemoryButton();
    updateDisplay();

    document.getElementById('sci-toggle').addEventListener('click', () => {
        const sci = document.getElementById('sci-buttons');
        const isVisible = sci.style.display !== 'none';
        sci.style.display = isVisible ? 'none' : 'grid';
        document.getElementById('sci-toggle').textContent = isVisible ? 'Scientific' : 'Basic';
    });
})();