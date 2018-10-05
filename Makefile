PRE=core/renderer/AbstractRenderer.preprocess.js

preprocess: $(PRE)
	cpp -P -undef -Wundef -std=c99 -nostdinc -Wtrigraphs -fdollars-in-identifiers -C $^ -o $(subst .preprocess,,$^)

lint:
	              node_modules/.bin/jshint $(subst .preprocess,,$(PRE)) && \
	              node_modules/.bin/eslint .                            && \
	cd test && ../node_modules/.bin/eslint .

mocha:
	node_modules/.bin/mocha -r test/internal/register test/**/*.test.js

karma\:start:
	FIREFOX_DEVELOPER_BIN=firefox-developer node_modules/.bin/karma start .karma.conf.js --no-single-run --browsers=FirefoxDeveloper

karma\:run:
	node_modules/.bin/karma run .karma.conf.js

karma:
	FIREFOX_DEVELOPER_BIN=firefox-developer node_modules/.bin/karma start .karma.conf.js

docs:
	node_modules/.bin/jsdoc -c .jsdoc.json

all:
	node_modules/.bin/browserify -o dist/v6.js index.js -x platform -x qs

min: all
	node_modules/.bin/uglifyjs -cmo dist/v6.min.js dist/v6.js
