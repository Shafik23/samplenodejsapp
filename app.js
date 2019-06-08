"use strict";

const fs = require('fs');
const express = require('express');
const request = require('request');
const app = express();
const bodyParser = require('body-parser');

const apiKey = fs.readFileSync('apiKey.txt', 'utf8');

const mongo = require('mongodb').MongoClient;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));



app.get('/', function (req, res) {
    // res.send('Hello World!');
    // res.render('index', {weather: null, error: null});
    res.render('index', {weatherLogArray: weatherLogArray, weather: null, error: null});
});


let weatherLogArray = [];

app.post('/', function (req, res) {
    let city = req.body.city;
    let url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=imperial&appid=${apiKey}`
    request(url, function (err, response, body) {
        if (err) {
            res.render('index', {weather: null, error: 'Error, please try again'});
        } else {
            let weather = JSON.parse(body);

            if (weather.main == undefined) {
                res.render('index', {weather: null, error: 'Error, please try again'});
            } else {
                let weatherText = `It's ${weather.main.temp} degrees in ${weather.name}!`;
                res.render('index', {weather: weatherText, error: null, weatherLog: weatherLogArray});
                saveToDb(weatherText);
            }
        }
    });
})

function saveToDb(text) {
    mongo.connect('mongodb://localhost:27017', {useNewUrlParser: true}, (err, client) => {
        if (err) {
            console.log(err);
        }

        const db = client.db('weather');
        const col = db.collection('log');
        col.insertOne({msg: text});

        col.find().toArray((err, items) => {
            weatherLogArray = items.reverse().slice(0, 10);
        });
    });
}

function objectId2Date(objectId) {
    return new Date(parseInt(objectId.substring(0, 8), 16) * 1000);
};


app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});
