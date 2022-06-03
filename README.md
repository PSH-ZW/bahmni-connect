# Bahmni Connect

[![Build Status](https://travis-ci.org/Bahmni/openmrs-module-bahmniapps.svg?branch=master)](https://travis-ci.org/Bahmni/openmrs-module-bahmniapps)

This repository acts as the front end for the **Bahmni Connect**. It is compeltely written in **AngularJS**.


# Build

Please visit [Bahmni Wiki](https://bahmni.atlassian.net/wiki/spaces/BAH/pages/46432277/Bahmni+Connect+development) for detailed instructions on **building** and **deploying** the front end for **Bahmni Connect**.

# Project structure

<pre>
|-- .tx
|   
|-- scripts
|	
`-- ui
    |-- Gruntfile.js
    |-- app
    |   |-- clinical
    |   |-- common
    |   |-- home
    |	|-- i18n
    |   |-- images
    |   |-- index.html
    |   |-- registration
    |   |-- reports
    |   |-- offline
    |   |-- service-worker-events.js
    |   |-- service-worker-reg.js
    |
    |-- test
    |-- .jshint.rc
    |-- package.json
</pre>


##Server Setup

yum install bahmni-offline

yum install bahmni-event-log-service

service bahmni-event-log-service start

Update the DB password in the script if there are errors.
python /opt/bahmni-event-log-service/bahmni-event-log-service/WEB-INF/classes/sql-scripts/copyOfflineConcepts.py

bahmni -i local install

copy bahmniOfflineSync.omod from production.

change syncStratergy

copy and softLink psi_config

