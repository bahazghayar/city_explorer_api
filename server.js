// 'use strict';

// Application Dependencies
const express = require('express');
//CORS = Cross Origin Resource Sharing
const cors = require('cors');
//DOTENV (read our enviroment variable)
require('dotenv').config();

const pg = require('pg');

// I have to install it from ubuntu;
const superagent = require('superagent');


const server = express();
server.use(cors());
const PORT = process.env.PORT || 3030;


//   pg is a package , and Client is a predefined constructor. 
const client = new pg.Client(process.env.DATABASE_URL);
// const client = new pg.Client({ connectionString: process.env.DATABASE_URL,   ssl: { rejectUnauthorized: false } });

// Routes Definitions
server.get('/', handleHomeRoute);
server.get('/location', locationHandler);
server.get('/weather', weatherHandler);
server.get('/parks', parksHandler);
server.get('*', notFoundRouteHandler);
server.use(errorHandler);

// Route Handlers

function handleHomeRoute(request, response) {
    response.status(200).send('you did a great job');
}

http://localhost:3000//location?city=amman
function locationHandler(req, res) {
    const cityName = req.query.city;
    // console.log(req.query);
    // https://eu1.locationiq.com/v1/search.php?key=YOUR_ACCESS_TOKEN&q=SEARCH_STRING&format=json
    let key = process.env.GEOCODE_API_KEY;
    let url = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${cityName}&format=json`;

    let cityArr = [] ;
    let SQL2 = `SELECT search_query FROM locations WHERE search_query = '${cityName}';` ; 
    client.query(SQL2) 
    .then((result)=> {
    //    console.log(result);
        cityArr =  result.rows.map(val => { return val.search_query ;  })
        // console.log('hiiiiiiiiiiiiiiii ' ,cityArr.includes(cityName));
        // console.log('i am in queryyyyyyyyyy',cityArr);

        if (cityArr.includes(cityName)) {
            // console.log('i am in if');
            let SQL3 = `SELECT * FROM locations WHERE search_query = '${cityName}';` ;
            client.query(SQL3) 
            .then((result)=> {
                // console.log(result.rows[0]);
             console.log('data added from database');
              res.send(result.rows[0]) ;
            })
    } else {
        console.log('i am going to API');
        superagent.get(url)
        .then(locData => {
            // console.log(locData.body) ;
            const locationData = new Location(cityName, locData.body[0]);
            res.send(locationData);

            let search_query = locationData.search_query;
            let formatted_query = locationData.formatted_query;
            let latitude = locationData.latitude;
            let longitude = locationData.longitude;

            let SQL = `INSERT INTO locations VALUES ($1 , $2 ,$3 ,$4)`;
            let safeValues = [search_query, formatted_query, latitude, longitude];
            client.query(SQL, safeValues)
                .then((result) => {
                    
                })
                .catch((error) => {
                    res.send('error in sending data to the table.', error.message)
                })


        })
        .catch(() => {
            errorHandler('Error in getting data from locationiq', req, res)
        })
    }
    })
}

function weatherHandler(req, res) {
    const cityName = req.query.search_query;

    // console.log(req.query) ;
    let key = process.env.WEATHER_API_KEY;
    let url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${cityName}&key=${key}`

    superagent.get(url)
        .then(weaData => {
            // console.log(weaData.body);
            let weatherArr = weaData.body.data.map((val) => {
                return new Weather(val);
            });

            res.send(weatherArr);

        })
        .catch(() => {
            errorHandler('Error in getting data from weatherbit', req, res)
        })
}


function parksHandler(req, res) {
    // const cityName = req.query.search_query  ; 

    // let code = req.query.latitude + ',' + req.query.longitude;

    // console.log(req.query) ;
    let key = process.env.PARKS_API_KEY;
    const city = req.query.search_query;


    // let url =  `https://developer.nps.gov/api/v1/parks?parkCode=${code}&api_key=${key}` ; 

    // we used q to search on a specific city.
    let url = `https://developer.nps.gov/api/v1/parks?q=${city}&api_key=${key}`;

    superagent.get(url)
        .then(parksData => {
            // console.log(parksData.body);
            let parksArr = parksData.body.data.map((val) => {
                return new Parks(val);
            });

            res.send(parksArr);

        })
        .catch(() => {
            errorHandler('Error in getting data from nps website', req, res)
        })
}

function notFoundRouteHandler(req, res) {
    res.status(404).send('Not Found');
}

function errorHandler(error, req, res) {
    res.status(500).send(error);
}

// constructors 
function Location(city, geoData) {
    this.search_query = city;
    this.formatted_query = geoData.display_name;
    this.latitude = geoData.lat;
    this.longitude = geoData.lon;
}

function Weather(weaData) {
    this.forecast = weaData.weather.description;
    this.time = weaData.datetime;

}

function Parks(parkData) {
    this.name = parkData.fullName;
    this.address = `${parkData.addresses[0].line1} ${parkData.addresses[0].city} ${parkData.addresses[0].stateCode} ${parkData.addresses[0].postalCode}`;
    // this.fee = '0.00' ; 
    this.fee = parkData.entranceFees[0].cost || '0.00';
    this.description = parkData.description;
    this.url = parkData.url;

}

// server.listen(PORT, ()=>{
//     console.log(`Listening on PORT ${PORT}`);
// })

// to connect between postgres server and express server. 
client.connect()
    .then(() => {
        server.listen(PORT, () =>
            console.log(`listening on ${PORT}`)
        );
    })
    .catch((error) => {
        console.log('error form connecting between express and postgres', error.message)
    })