SOURCES   := core/renderer/AbstractRenderer.preprocess.js            \
             core/renderer/internal/process_rect_align.preprocess.js \
             core/camera/Camera.preprocess.js
COVERALLS := $(shell cat build/coveralls.txt)
BROWSERS  := $(shell cat build/browsers.txt)

$(SOURCES):
	build/preprocess $@ $(@:.preprocess.js=.js)

preprocess: $(SOURCES)

lint\:test:
	cd test && ../node_modules/.bin/eslint .

lint\:test--fix:
	cd test && ../node_modules/.bin/eslint . --fix

lint\:core:
	node_modules/.bin/eslint .

lint\:core--fix:
	node_modules/.bin/eslint . --fix

start_static_server:
	node test/internal/server

mocha:
	@if [ $(REPORTER) = 'mocha' ]; then                                                                       \
		node_modules/.bin/mocha -r test/internal/register `find test -name '*.test.js'` --reporter spec;        \
	elif [ $(REPORTER) ]; then                                                                                \
		node_modules/.bin/mocha -r test/internal/register `find test -name '*.test.js'` --reporter $(REPORTER); \
	else                                                                                                      \
		node_modules/.bin/mocha -r test/internal/register `find test -name '*.test.js'`;                        \
	fi

karma--no-colors:
	@if [ $(REPORTER) ]; then                                                        \
		$(BROWSERS) node_modules/.bin/karma start --no-colors --reporters $(REPORTER); \
	else                                                                             \
		$(BROWSERS) node_modules/.bin/karma start --no-colors;                         \
	fi

karma:
	@if [ $(REPORTER) ]; then                                            \
		$(BROWSERS) node_modules/.bin/karma start --reporters $(REPORTER); \
	else                                                                 \
		$(BROWSERS) node_modules/.bin/karma start;                         \
	fi

docs:
	node_modules/.bin/jsdoc -c .jsdoc.json

all:
	node_modules/.bin/browserify -o dist/v6.js index.js -x platform -x qs -d

min: all
	node_modules/.bin/uglifyjs -cmo dist/v6.min.js dist/v6.js

gzip: min
	gzip dist/v6.min.js --stdout > dist/v6.min.js.gz

coveralls:
	@$(COVERALLS) cat coverage/lcov.info | node_modules/.bin/coveralls
