#!/bin/bash

# Deploy on remote SSH server

ssh ids3 "cd /data/deploy-services/CVDPrediction && git pull && docker compose up --build -d"
