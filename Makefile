all: lint
	./node_modules/.bin/browserify -o dist/v6.js     v6.js -x platform -x qs

min: all
	./node_modules/.bin/uglifyjs -cmo dist/v6.min.js dist/v6.js

lint:
	npm run lint && npm run test
