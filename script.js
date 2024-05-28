document.addEventListener('DOMContentLoaded', () => {
    fetchExcelFile('Monetary Transactions_conv.xlsx', handleConvFile);
    fetchExcelFile('Monetary Transactions_ret.xlsx', handleRetFile);
});

function fetchExcelFile(url, callback) {
    fetch(url)
        .then(response => response.arrayBuffer())
        .then(buffer => {
            const data = new Uint8Array(buffer);
            const workbook = XLSX.read(data, {type: 'array'});
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, {header: 1});
            callback(json);
        })
        .catch(error => console.error('Error fetching Excel file:', error));
}

function handleConvFile(data) {
    const transactionCountsIT = {};
    const transactionCountsENG = {};

    for (let i = 1; i < data.length; i++) {
        const desk = data[i][6];
        const owner = data[i][14];

        if (owner) {
            if (desk === 'S IT CONV') {
                if (!transactionCountsIT[owner]) {
                    transactionCountsIT[owner] = 0;
                }
                transactionCountsIT[owner]++;
            } else if (desk === 'S ENG CONV') {
                if (!transactionCountsENG[owner]) {
                    transactionCountsENG[owner] = 0;
                }
                transactionCountsENG[owner]++;
            }
        }
    }

    console.log("Transaction counts for S IT CONV:", transactionCountsIT);
    console.log("Transaction counts for S ENG CONV:", transactionCountsENG);

    const sortedTransactionCountsIT = Object.entries(transactionCountsIT)
        .filter(([owner, count]) => count > 0)
        .sort((a, b) => b[1] - a[1]);

    const sortedTransactionCountsENG = Object.entries(transactionCountsENG)
        .filter(([owner, count]) => count > 0)
        .sort((a, b) => b[1] - a[1]);

    displayResult(sortedTransactionCountsIT, 'output1', 'S IT CONV');
    displayResult(sortedTransactionCountsENG, 'output2', 'S ENG CONV');
}

function handleRetFile(data) {
    const transactionCountsIT = {};
    const transactionCountsENG = {};

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const todayDate = today.toISOString().split('T')[0];

    for (let i = 1; i < data.length; i++) {
        const desk = data[i][6];
        const owner = data[i][14];
        const transactionDate = excelDateToJSDate(data[i][18]);
        const date = excelDateToJSDate(data[i][10]);
        const amount = parseFloat(data[i][19]);
        const accountId = data[i][0];
        const comment = data[i][15];

        console.log(`Row ${i}:`, { desk, owner, transactionDate, date, amount, accountId, comment });

        if (date && amount && accountId && owner) {
            const transDate = new Date(transactionDate);
            const transMonth = transDate.getMonth();
            const transYear = transDate.getFullYear();

            const dateString = date.toISOString().split('T')[0];
            console.log(`Transaction Date: ${transDate.toISOString().split('T')[0]}, Today Date: ${todayDate}, Date: ${dateString}, Comment: ${comment}`);

            let prize = 0;
            if (dateString === todayDate && amount > 2500 && transMonth === currentMonth && transYear === currentYear) {
                prize = 5000;
            } else if (dateString === todayDate) {
                if (amount >= 5000 && amount < 10000) {
                    prize = 5000;
                } else if (amount >= 10000 && amount < 25000) {
                    prize = 10000;
                } else if (amount >= 25000) {
                    prize = 35000;
                }
            }

            if (prize > 0) {
                if (desk === 'S IT RET') {
                    if (!transactionCountsIT[accountId]) {
                        transactionCountsIT[accountId] = { owner, totalAmount: 0, prize: 0 };
                    }
                    transactionCountsIT[accountId].totalAmount += amount;
                    transactionCountsIT[accountId].prize += prize;
                } else if (desk === 'S ENG RET T1') {
                    if (!transactionCountsENG[accountId]) {
                        transactionCountsENG[accountId] = { owner, totalAmount: 0, prize: 0 };
                    }
                    transactionCountsENG[accountId].totalAmount += amount;
                    transactionCountsENG[accountId].prize += prize;
                }
            }
        }
    }

    console.log("Transaction counts for S IT RET:", transactionCountsIT);
    console.log("Transaction counts for S ENG RET T1:", transactionCountsENG);

    const sortedTransactionCountsIT = Object.entries(transactionCountsIT)
        .filter(([accountId, data]) => data.prize > 0)
        .sort((a, b) => b[1].totalAmount - a[1].totalAmount);

    const sortedTransactionCountsENG = Object.entries(transactionCountsENG)
        .filter(([accountId, data]) => data.prize > 0)
        .sort((a, b) => b[1].totalAmount - a[1].totalAmount);

    displayRetResult(sortedTransactionCountsIT, 'retOutput1', 'S IT RET');
    displayRetResult(sortedTransactionCountsENG, 'retOutput2', 'S ENG RET T1');
}

function excelDateToJSDate(excelDate) {
    const date = new Date((excelDate - (25567 + 2)) * 86400 * 1000);
    return date;
}

function displayResult(sortedTransactionCounts, outputId, deskName) {
    const output = document.getElementById(outputId);
    output.innerHTML = `<h2 class="text-center mt-4">(${deskName}):</h2>`;
    
    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-container';
    
    const table = document.createElement('table');
    table.className = 'table table-tournament mt-3';
    
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');
    
    const headerRow = document.createElement('tr');
    const thRank = document.createElement('th');
    thRank.textContent = 'Position';
    const thOwner = document.createElement('th');
    thOwner.textContent = 'Transaction owner';
    const thCount = document.createElement('th');
    thCount.textContent = 'Number of transactions';
    const thPrize = document.createElement('th');
    thPrize.textContent = 'Prize (EUR)';
    
    headerRow.appendChild(thRank);
    headerRow.appendChild(thOwner);
    headerRow.appendChild(thCount);
    headerRow.appendChild(thPrize);
    thead.appendChild(headerRow);
    table.appendChild(thead);

    sortedTransactionCounts.forEach(([owner, count], index) => {
        const row = document.createElement('tr');
        const cellRank = document.createElement('td');
        cellRank.textContent = index + 1;
        const cellOwner = document.createElement('td');
        cellOwner.textContent = owner;
        const cellCount = document.createElement('td');
        cellCount.textContent = count;
        const cellPrize = document.createElement('td');
        cellPrize.textContent = `€${(count * 50).toFixed(2)}`;
        
        row.appendChild(cellRank);
        row.appendChild(cellOwner);
        row.appendChild(cellCount);
        row.appendChild(cellPrize);
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    tableContainer.appendChild(table);
    output.appendChild(tableContainer);
}

function displayRetResult(sortedTransactionCounts, outputId, deskName) {
    const output = document.getElementById(outputId);
    output.innerHTML = `<h2 class="text-center mt-4"> (${deskName}):</h2>`;
    
    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-container';
    
    const table = document.createElement('table');
    table.className = 'table table-tournament mt-3';
    
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');
    
    const headerRow = document.createElement('tr');
    const thRank = document.createElement('th');
    thRank.textContent = 'Position';
    const thOwner = document.createElement('th');
    thOwner.textContent = 'Transaction owner';
    const thAccount = document.createElement('th');
    thAccount.textContent = 'Account ID';
    const thTotal = document.createElement('th');
    thTotal.textContent = 'Amount of transactions (USD)';
    const thPrize = document.createElement('th');
    thPrize.textContent = 'Match4match (USD)';
    
    headerRow.appendChild(thRank);
    headerRow.appendChild(thOwner);
    headerRow.appendChild(thAccount);
    headerRow.appendChild(thTotal);
    headerRow.appendChild(thPrize);
    thead.appendChild(headerRow);
    table.appendChild(thead);

    sortedTransactionCounts.forEach(([accountId, data], index) => {
        const row = document.createElement('tr');
        const cellRank = document.createElement('td');
        cellRank.textContent = index + 1;
        const cellOwner = document.createElement('td');
        cellOwner.textContent = data.owner;
        const cellAccount = document.createElement('td');
        cellAccount.textContent = accountId;
        const cellTotal = document.createElement('td');
        cellTotal.textContent = `$${data.totalAmount.toFixed(2)}`;
        const cellPrize = document.createElement('td');
        cellPrize.textContent = `$${data.prize.toFixed(2)}`;
        
        row.appendChild(cellRank);
        row.appendChild(cellOwner);
        row.appendChild(cellAccount);
        row.appendChild(cellTotal);
        row.appendChild(cellPrize);
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    tableContainer.appendChild(table);
    output.appendChild(tableContainer);
}

// Добавление значков доллара на фон
function createDollarSigns() {
    const background = document.querySelector('.background-animation');
    const dollarCount = 100;

    for (let i = 0; i < dollarCount; i++) {
        const dollar = document.createElement('div');
        dollar.className = 'dollar';
        dollar.innerHTML = '&#36;'; // HTML entity for $
        dollar.style.left = Math.random() * 100 + 'vw';
        dollar.style.animationDuration = Math.random() * 5 + 5 + 's';
        dollar.style.fontSize = Math.random() * 1.5 + 1 + 'rem';
        background.appendChild(dollar);
    }
}

createDollarSigns();
