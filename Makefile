all: lint
	node_modules/.bin/browserify -o dist/v6.js     v6.js -x platform -x qs

min: all
	node_modules/.bin/uglifyjs   -o dist/v6.min.js dist/v6.js -cm

lint:
	npm run lint
