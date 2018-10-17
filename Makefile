SRC=core/renderer/AbstractRenderer.preprocess.js core/renderer/internal/process_rect_align.preprocess.js core/camera/Camera.preprocess.js

$(SRC):
	build/preprocess $@ $(@:.preprocess.js=.js)

preprocess: $(SRC)

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
	node_modules/.bin/mocha -r test/internal/register `find test -name '*.test.js'`

karma--no-colors:
	FIREFOX_DEVELOPER_BIN=firefox-developer node_modules/.bin/karma start --no-colors

karma:
	FIREFOX_DEVELOPER_BIN=firefox-developer node_modules/.bin/karma start

docs:
	node_modules/.bin/jsdoc -c .jsdoc.json

all:
	node_modules/.bin/browserify -o dist/v6.js index.js -x platform -x qs -d

min: all
	node_modules/.bin/uglifyjs -cmo dist/v6.min.js dist/v6.js

gzip: min
	gzip dist/v6.min.js --stdout > dist/v6.min.js.gz
