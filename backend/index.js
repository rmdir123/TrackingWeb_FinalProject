// index.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoute = require('./routes/auth_route');
const userinfoRoute = require('./routes/userinfo_route');
const packageRoute = require('./routes/package_route.js');
const historyRoute = require('./routes/history_route.js');


const { swaggerUi, swaggerSpec } = require('./docs/swagger')

const app = express();
app.use(cors());
app.use(express.json());
app.use(helmet());

app.get('/', (req, res) => res.send('API v1 is running.'));

app.use('/api/v1/auth', authRoute);   //register, login
app.use('/api/v1', userinfoRoute); //get user info
app.use('/api/v1', packageRoute); //add package info
app.use('/api/v1', historyRoute);


app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec)); // swagger

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
