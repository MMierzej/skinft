#!/bin/bash

mongorestore -u root -p toor --authenticationDatabase admin \
             --drop /docker-entrypoint-initdb.d/dump
