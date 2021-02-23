'use strict' ; 

// Application Dependencies
const express = require ('express');
//CORS = Cross Origin Resource Sharing
const cors = require('cors');
//DOTENV (read our enviroment variable)
require('dotenv').config();

// I have to install it from ubuntu;
const superagent = require('superagent');   


const server = express();
server.use(cors()); 
const PORT = process.env.PORT || 3030;

// Routes Definitions
server.get('/',handleHomeRoute);
server.get('/location',locationHandler);
server.get('/weather',weatherHandler);
server.get('/parks',parksHandler)  ; 
server.get('*',notFoundRouteHandler);
server.use(errorHandler);

// Route Handlers

function handleHomeRoute (request, response) {
    response.status(200).send('you did a great job');
}

// http://localhost:3000//location?city=amman
function locationHandler (req, res)  {
    const cityName = req.query.city;
    // console.log(req.query);
    // https://eu1.locationiq.com/v1/search.php?key=YOUR_ACCESS_TOKEN&q=SEARCH_STRING&format=json
    let key = process.env.GEOCODE_API_KEY;
    let url = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${cityName}&format=json`;

    superagent.get(url)
    .then(locData =>{
        // console.log(locData.body) ;
        const locationData = new Location(cityName, locData.body[0]);
        res.send(locationData);
        
    })
    .catch(()=>{
        errorHandler('Error in getting data from locationiq',req,res)
    })

}

function weatherHandler (req , res){
    const cityName = req.query.search_query   ; 

    // console.log(req.query) ;
    let key = process.env.WEATHER_API_KEY;
    let url =  `https://api.weatherbit.io/v2.0/forecast/daily?city=${cityName}&key=${key}`
     
    superagent.get(url)
    .then(weaData => {
        // console.log(weaData.body);
        let weatherArr = weaData.body.data.map((val) => {
            return  new Weather(val) ;
        });
        
        res.send(weatherArr) ; 

    })
    .catch(()=>{
        errorHandler('Error in getting data from weatherbit',req,res)
    })
}


function parksHandler (req , res){
    // const cityName = req.query.search_query  ; 

    // let code = req.query.latitude + ',' + req.query.longitude;

    // console.log(req.query) ;
    let key = process.env.PARKS_API_KEY;
    const city = req.query.search_query   ; 


    // let url =  `https://developer.nps.gov/api/v1/parks?parkCode=${code}&api_key=${key}` ; 
     
    // we used q to search on a specific city.
    let url =  `https://developer.nps.gov/api/v1/parks?q=${city}&api_key=${key}` ; 

    superagent.get(url)
    .then(parksData => {
        // console.log(parksData.body);
        let parksArr = parksData.body.data.map((val) => {
            return  new Parks(val) ;
        });
        
        res.send(parksArr) ; 

    })
    .catch(()=>{
        errorHandler('Error in getting data from nps website',req,res)
    })
}

function notFoundRouteHandler (req, res) {
    res.status(404).send('Not Found');
}

function errorHandler(error, req, res) {
    res.status(500).send(error);
}

// constructors 
function Location (city , geoData) {
    this.search_query = city;
    this.formatted_query= geoData.display_name;
    this.latitude = geoData.lat;
    this.longitude = geoData.lon;
}

function Weather (weaData) {
    this.forecast = weaData.weather.description;
    this.time= weaData.datetime;

}

function Parks (parkData){
   this.name = parkData.fullName ; 
   this.address  = `${parkData.addresses[0].line1} ${parkData.addresses[0].city} ${parkData.addresses[0].stateCode} ${parkData.addresses[0].postalCode}` ; 
    // this.fee = '0.00' ; 
   this.fee = parkData.entranceFees[0].cost || '0.00' ; 
   this.description = parkData.description ;
   this.url = parkData.url ;

}

server.listen(PORT, ()=>{
    console.log(`Listening on PORT ${PORT}`);
})