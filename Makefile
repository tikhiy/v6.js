PRE=core/renderer/AbstractRenderer.preprocess.js

preprocess: $(PRE)
	cpp -P -undef -Wundef -std=c99 -nostdinc -Wtrigraphs -fdollars-in-identifiers -CC $^ -o $(subst .preprocess,,$^)

lint\:test:
	cd test && ../node_modules/.bin/eslint .

lint\:test--fix:
	cd test && ../node_modules/.bin/eslint . --fix

lint:
	              node_modules/.bin/jshint $(subst .preprocess,,$(PRE)) && \
	              node_modules/.bin/eslint .                            && \
	cd test && ../node_modules/.bin/eslint .

start_static_server:
	node test/internal/server

mocha:
	node_modules/.bin/mocha -r test/internal/register test/**/*.test.js

karma\:start:
	FIREFOX_DEVELOPER_BIN=firefox-developer node_modules/.bin/karma start --no-single-run --browsers=FirefoxDeveloper

karma\:run:
	node_modules/.bin/karma run

karma:
	FIREFOX_DEVELOPER_BIN=firefox-developer node_modules/.bin/karma start

docs:
	node_modules/.bin/jsdoc -c .jsdoc.json

all:
	node_modules/.bin/browserify -o dist/v6.js index.js -x platform -x qs

min: all
	node_modules/.bin/uglifyjs -cmo dist/v6.min.js dist/v6.js
