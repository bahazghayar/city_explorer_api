'use strict' ; 

const express = require ('express');


require('dotenv').config();


const cors = require('cors');


const server = express();

server.use(cors()); 

const PORT = process.env.PORT || 3030;



server.use('*',(req,res)=>{
    res.status(500).send('route not found')
})

server.listen(PORT, ()=>{
    console.log(`Listening on PORT ${PORT}`);
})