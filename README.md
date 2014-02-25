
# Angular Chat

A simple chat project for a cource Web Programming II

## Requirements

```
python 2.7
node
bower
grunt
```

## How to use

- Start the python server by opening a command prompt, navigate to the program directory and run:
```
C:\Python27\python.exe -m SimpleHTTPServer

```
- Start the chatserver by opening a command prompt, navigate to the Chatserver directory and run:
```
node chatserver.js

```
Note: chatserver.js need to be set to port 8123


And open `http://localhost:8000` in your browser. Optionally specify
a port by supplying the `PORT` env variable.

## Features

- Users can create their own chat room, join other chat rooms and leave them after creating a unique username at website load
- Multiple users can join each chat room at a time
- Users can be a part of multiple chat rooms at a once
- Users can type messages and send to a chat room. These messages are visible to all users on that chat room
- A creator of a chat room can kick other users from that chat room, kicked users can rejoin
- A creator of a chat room can ban other users from that chat room, banned users cannot rejoin