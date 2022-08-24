# Bahmni Connect

[![Build Status](https://travis-ci.org/Bahmni/openmrs-module-bahmniapps.svg?branch=master)](https://travis-ci.org/Bahmni/openmrs-module-bahmniapps)

This repository acts as the front end for the **Bahmni Connect**. It is compeltely written in **AngularJS**.


# Build

Please visit [Bahmni Wiki](https://bahmni.atlassian.net/wiki/spaces/BAH/pages/46432277/Bahmni+Connect+development) for detailed instructions on **building** and **deploying** the front end for **Bahmni Connect**.

## Release 2 changes:
* Added option to search and download individual patients.
* Reduced the number of offline concepts required for initial sync.

## WorkFlow

During the initial sync of PWA, we will download and cache all the required addressHierarchies, forms and offline-concepts.
`bahmni-event-log-service` will periodically pull new entries from event_records table and add to `bahmni-event-log` table.
When the sync is initiated, newly added event_logs of categories `addressHierarchy`, `forms` and `offline-concept` will be downloaded and saved.

Patients can be searched and downloaded by checking the `Remote Search` option and entering their name or patient ids.
These patients can be synced after entering the form details.
