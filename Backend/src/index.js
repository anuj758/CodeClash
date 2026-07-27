const express = require('express');
require("dotenv").config();
const main = require('./config/db');
const redisClient = require('./config/redis');
const cookieParser = require('cookie-parser');
const authRouter = require('./routes/auth');
const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin');
const metaRouter = require('./routes/meta');
const problemRouter = require('./routes/problem');
const aiRouter = require('./routes/ai');
const cors = require('cors');

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));


app.use(express.json());
app.use(cookieParser());


app.use('/', authRouter);
app.use('/user', userRouter);
app.use('/admin', adminRouter);
app.use('/problem', problemRouter);
app.use('/meta', metaRouter);
app.use('/ai', aiRouter);

const initializeConnection = async () => {

    try{
        await Promise.all([main(), redisClient.connect()]);
        console.log('DB Connected');

        app.listen(process.env.BACKEND_PORT, () => {
            console.log(`Server listening at port number: ${process.env.BACKEND_PORT}`);
        })
    }
    catch(err){
        console.log(err.message);
    }
}

initializeConnection();
