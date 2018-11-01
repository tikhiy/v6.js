SOURCES  := core/renderer/AbstractRenderer.preprocess.js             \
             core/renderer/internal/process_rect_align.preprocess.js \
             core/camera/Camera.preprocess.js
BROWSERS := $(subst \n, ,$(shell cat config/browsers.txt))

$(SOURCES):
	build/preprocess $@ $(@:.preprocess.js=.js)

preprocess: $(SOURCES)

lint\:test:
	cd test && ../node_modules/.bin/eslint . $(ESLINT)

lint\:core:
	node_modules/.bin/eslint . $(ESLINT)

mocha:
	node_modules/.bin/mocha -r test/internal/register `find test -name '*.test.js'` $(MOCHA)

karma:
	$(BROWSERS) node_modules/.bin/karma start $(KARMA)

docs:
	node_modules/.bin/jsdoc -c .jsdoc.json

all:
	node_modules/.bin/browserify -o dist/v6.js index.js -x platform -x qs -d

min: all
	node_modules/.bin/uglifyjs -cmo dist/v6.min.js dist/v6.js

gzip: min
	gzip dist/v6.min.js --stdout > dist/v6.min.js.gz

coverage:
	@cat coverage/lcov.info | $(subst \n, ,$(shell cat config/coveralls.txt)) node_modules/.bin/coveralls

clean:
	rm -rf coverage docs dist
