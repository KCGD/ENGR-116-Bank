default:
	npx tsc

run:
	make clean
	make
	@echo "--------------------START MAIN--------------------"
	@node main

#fresh run (cleans, purges, makes, runs)
fr:
	make purge || true
	make run

build:
	make
	npx pkg package.json
	make clean

#fresh build
fb:
	make purge || true
	make build

#fresh build (run)
fbr:
	make fb
	@echo "--------------------START MAIN (Built)--------------------"
	@./Builds/bank

purge:
	make clean || true
	rm -rv ~/.bank

install:
	ln -s -v -f "$(BUILD_DIR)/mcc" /usr/local/bin/mcc

clean:
	find ./src -name "*.js" -type f
	find ./src -name "*.js" -type f -delete
	rm main.js