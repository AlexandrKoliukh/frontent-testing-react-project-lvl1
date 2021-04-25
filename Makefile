install:
	npm install

build:
	rm -rf dist
	npm run build

test:
	npm test

test-coverage:
	npm test -- --coverage


publish:
	npm publish --dry-run

.PHONY: test
