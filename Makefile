PREPROCESS=AbstractRenderer.preprocess.js

preprocess: $(PREPROCESS)
	cpp -P -undef -Wundef -std=c99 -nostdinc -Wtrigraphs -fdollars-in-identifiers -C $^ -o $(subst .preprocess,,$^)

all: lint
	./node_modules/.bin/browserify -o dist/v6.js     v6.js -x platform -x qs

min: all
	./node_modules/.bin/uglifyjs -cmo dist/v6.min.js dist/v6.js

lint: preprocess
	npm run lint && npm run test
