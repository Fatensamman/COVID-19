'use strict';

// libraries
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');
const methodOverride = require('method-override');
require('dotenv').config();

// app setup
const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('./public'));
app.set('view engine', 'ejs');
const client = new pg.Client(process.env.DATABASE_URL);
// const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// routs
app.get('/', homeHandeler);
app.get('/getCountryResult', getCountryResultHandeler);
app.get('/allCountries', allCountriesHandeler);
app.post('/addRecord', addRecordHandeler);
app.get('/myRecords', myRecordsHandeler);
app.get('/recordDetails/:id', recordDetailsHandeler);
app.delete('/delete/:id', deleteHandeler);


// functions
function homeHandeler(req, res) {
    let url = `https://api.covid19api.com/world/total`;
    superagent.get(url).then(data => {
        res.render('./pages/home', { data: data.body });
    });
};
function getCountryResultHandeler(req, res) {
    let { city, from, to } = req.query;
    let url = `https://api.covid19api.com/country/${city}/status/confirmed?from=${from}T00:00:00Z&to=${to}T00:00:00Z`;
    superagent.get(url).then(data => {
        let getCountryResult = data.body.map(data => {
            return new GetCountry(data);
        });
        res.render('./pages/getCountryResult', { data: getCountryResult });
    });
};
function allCountriesHandeler(req, res) {
    let url = `https://api.covid19api.com/summary`;
    superagent.get(url).then(data => {
        let getCountryResult = data.body.Countries.map(data => {
            return new City(data);
        });
        res.render('./pages/allCountries', { data: getCountryResult });
    });
};
function addRecordHandeler(req, res) {
    let { country, totalconfirmed, totaldeaths, totalrecovered, date } = req.body;
    let sql = `INSERT INTO city (country, totalconfirmed, totaldeaths, totalrecovered, date) VALUES ($1,$2,$3,$4,$5);`;
    let values = [country, totalconfirmed, totaldeaths, totalrecovered, date];
    client.query(sql, values).then(data => {
        res.redirect('/myRecords');
    });
};
function myRecordsHandeler(req, res) {
    let sql = `SELECT * FROM city;`;
    client.query(sql).then(data => {
        res.render('./pages/myRecords', { data: data.rows});
    });
};
function  recordDetailsHandeler(req, res) {
    let id=req.params.id
    let sql = `SELECT * FROM city WHERE id=$1;`;
    let value =[id];
    client.query(sql,value).then(data => {
        res.render('./pages/recordDetails', { item: data.rows[0]});
    });
};
function  deleteHandeler(req, res) {
    let id=req.params.id
    let sql = `DELETE FROM city WHERE id=$1;`;
    let value =[id];
    client.query(sql,value).then(data => {
        res.redirect('/myRecords');
    });
};
// constructor
function GetCountry(data) {
    this.date = data.Date;
    this.cases = data.Cases;
};
function City(data) {
    this.country = data.Country;
    this.totalconfirmed = data.TotalConfirmed;
    this.totaldeaths = data.TotalDeaths;
    this.totalrecovered = data.TotalRecovered;
    this.date = data.Date;
};
// listening
const PORT = process.env.PORT || 5050;
client.connect().then(() => {
    app.listen(PORT, () => {
        console.log(`http://localhost:${PORT}`);
    });
});