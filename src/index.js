const express = require('express');
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

const customers = [];

function verifyIfExistAccountCPF(request, response, next) {
    const { cpf } = request.headers;

    const customer = customers.find((customer) => customer.cpf === cpf);
    if (!customer) {
        return response.status(400).json({error: 'Customer not find' });
    }

    request.customer = customer;

    return next();
}

function getBalance(statement) {
    return statement.reduce((acc, operation) => {
        if (operation.type === 'CREDIT') {
            return acc + operation.amount;
        }
        else {
            return acc - operation.amount;
        }
    }, 0);
}

app.post('/account', (request, response) => {
    const { cpf, name } = request.body;

    customerCpfAlreadyInUse = customers.some((customer) => customer.cpf === cpf);
    if (customerCpfAlreadyInUse) {
        return response.status(400).send('This cpf is already in use');
    }

    customers.push(
        {
            name,
            cpf,
            id: uuidv4(),
            statement: []
        }
    );

    return response.status(201).send();
});

app.get('/statement', verifyIfExistAccountCPF, (request, response) => {
    const { customer } = request;
    return response.json(customer.statement);
})

app.post('/deposit', verifyIfExistAccountCPF, (request, response) => {
    const { amount, description } = request.body;
    const { customer } = request; 
    customer.statement.push({ amount, description, created_at: new Date(), type: 'CREDIT'});

    return response.status(201).send();
})

app.post('/withdrawal', verifyIfExistAccountCPF, (request, response) => {
    const { amount } = request.body;
    const { customer } = request; 
    const balance = getBalance(customer.statement);

    if (balance < amount) {
        return response.status(400).json({error: 'There is not money enough' });
    }

    customer.statement.push({ amount, created_at: new Date(), type: 'DEBIT'});
    return response.status(201).send();
})

app.listen(3333);
