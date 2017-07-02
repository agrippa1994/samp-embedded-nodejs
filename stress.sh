#!/bin/bash

function killgroup() {
    jobs -p | xargs kill -9
}

trap killgroup SIGINT

for i in {1..10}
do
    siege -v http://localhost:8080/name/0 &
    siege -v http://localhost:8080/pos/0 &
    siege -v http://localhost:8080/playerinfo &
done
wait
