all: lint
	node_modules/.bin/browserify -o dist/v6.js     v6.js

min: all
	node_modules/.bin/uglifyjs   -o dist/v6.min.js dist/v6.js -cm

lint:
	node_modules/.bin/jshint . --verbose
