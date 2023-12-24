# EU Power Plants Exploratory Data Analysis
This project is an Exploratation of EU-27 Power Plants. This repository consists of the EDA itself, Uploading Data into PostreSQL Database and an [intercative map](https://main.dp23i3r580zal.amplifyapp.com/) of the power plants.

## Overview
The purpose of this project is to compare EU-27 Power Plants by examining their generation type, emissions, power, capacity and efficiency.  

### Technologies Used
+ Python 3.11.6 (pandas, numpy, matplotlib, seaborn, psycopg, sqlalchemy)
+ PostreSQL
+ JavaScript (D3.js)
+ HTML, CSS

### Structure
:large_blue_diamond: [powerplants-to-sql.ipynb](https://github.com/mks-0/powerplants/blob/main/powerplants-to-sql.ipynb)  
   - Cleaning the downloaded csv data
   - Uploading data into PostreSQL database

:large_blue_diamond:[powerplants_db_create.sql](https://github.com/mks-0/powerplants/blob/main/powerplants_db_create.sql)
  - SQL Database creation query

:large_blue_diamond: [powerplants-eda.ipynb](https://github.com/mks-0/powerplants/blob/main/powerplants-eda.ipynb) 
  - Quering the data from SQL database
  - Data Cleaning, Transformation and Future Engineering
  - Exploratory Data Analysis
  - Data Visualization

:large_blue_diamond: [/app](https://github.com/mks-0/powerplants/tree/main/app)
  - index.html, styles.css - HTML and CSS of the web map
  - script.js - D3.js SVG Map script

## Data Sources
+ [JRC Open Power Plants Database (JRC-PPDB-OPEN)](https://data.jrc.ec.europa.eu/dataset/9810feeb-f062-49cd-8e76-8d8cfd488a05)
+ [EMBER EU Power Plant Emissions](https://ember-climate.org/data-catalogue/eu-power-plant-emissions-data/)
+ [NEC Directive emission inventory data](https://www.eea.europa.eu/en/datahub/datahubitem-view/dcc8cc36-e670-4b05-87c4-b29385e23d85)
+ [Eurostat Population(national level)](https://ec.europa.eu/eurostat/databrowser/view/TPS00001/default/table)
