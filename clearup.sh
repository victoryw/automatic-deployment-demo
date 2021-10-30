#!/bin/bash
docker rm -f app-v1
docker compose -f ./Infra.yml down