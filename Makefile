CODE_DIR := melbourne/
DIST_DIR := dist/

format:
	uv run ruff check --select I --fix $(CODE_DIR)
	uv run ruff format $(CODE_DIR)

checks: 
	uv run ruff check $(CODE_DIR)

types:
	uv run mypy $(CODE_DIR)

fix: 
	uv run ruff check --fix $(CODE_DIR)

clean:
	rm -rf $(DIST_DIR)