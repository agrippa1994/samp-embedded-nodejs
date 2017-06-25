#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR

g++ -shared -static-libstdc++ -m32 -fpic -Wno-attributes -std=c++14 \
    -DLINUX \
    ./3rdparty/sampgdk/*.c ./3rdparty/sampgdk/*.cpp src/*.cpp \
    -L./3rdparty/node/lib \
    -I./3rdparty/sampgdk/amx -I./3rdparty/sampgdk -I./3rdparty/node/include \
    -ldl -l:libnode.so.57 \
    -o node.so
