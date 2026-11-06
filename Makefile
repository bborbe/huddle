# One job per target. `precommit` chains them and fails fast, in this order:
# install → lint → typecheck → build → test.
#
# `test` runs the Playwright walks against the BUILT app (vite preview), so
# `build` must run first — `precommit` guarantees that; running `make test`
# alone needs a `make build` before it.

.PHONY: install lint typecheck build test precommit

install:
	npm ci

lint:
	npm run lint

typecheck:
	npm run typecheck

build:
	npm run build

test:
	npm run test

precommit: install lint typecheck build test
