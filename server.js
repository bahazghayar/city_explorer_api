'use strict' ; 

const express = require ('express');
require('dotenv').config();
const cors = require('cors');
const server = express();
server.use(cors()); 
const PORT = process.env.PORT || 3030;


server.get('/location' , (req , res) => {
    const locationData = require('./data/location.json') ; 
    
    const locationObj = new Location (locationData) ;
    res.send(locationObj) ; 
})

function Location (geoData) {
    this.search_query = 'Lynnwood';
    this.formatted_query= geoData[0].display_name;
    this.latitude = geoData[0].lat;
    this.longitude = geoData[0].lon;
}

server.use('*',(req,res)=>{
    res.status(500).send('route not found')
})

server.listen(PORT, ()=>{
    console.log(`Listening on PORT ${PORT}`);
})