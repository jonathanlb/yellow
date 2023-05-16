# Yellow Notes
Yellow Notes is a bulletin board for sharing memos among small groups.  It's bundled into an ECMAScript [client front end](client/README.md) to be served by a vanilla web server and a NodeJS [server](server/README.md) serving as access to a [SQLite database](https://sqlite.org).

This project has been split into two:
- The server [go-notes](https://github.com/jonathanlb/go-notes) has been rewritten in Go with support for document indexing behind search.
- The client [yellow-notes](https://github.com/jonathanlb/yellow-notes) has been ported to Typescript and React.

## Installation
```bash
PYTHON_VERSION=$(python --version 2>&1 | grep -o '[0-9]\.[0-9]')
WEB_SERVER_PORT=3001
YELLOW_SERVER_PORT=3000 # ensure matches value in client/src/app.js

# install the client
git clone https://github.com/jonathanlb/yellow
cd yellow/client
npm install
npm test
npm run build
cd dist
if [[ $PYTHON_VERSION == 2* ]] ; then
	nohup python -m SimpleHTTPServer $WEB_SERVER_PORT &
else
	nohup python -m http.server $WEB_SERVER_PORT &
fi

# install the server
cd ../../server
npm install
npm test
DEBUG='*' PORT=$YELLOW_SERVER_PORT nohup npm run start &

# point your browser to http://localhost:3001
```

