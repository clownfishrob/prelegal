#!/bin/bash
set -e

if docker ps -q --filter "name=prelegal" | grep -q .; then
    echo "Stopping Prelegal..."
    docker stop prelegal
    docker rm prelegal
    echo "Prelegal stopped."
elif docker ps -aq --filter "name=prelegal" | grep -q .; then
    docker rm prelegal
    echo "Removed stopped Prelegal container."
else
    echo "Prelegal is not running."
fi
