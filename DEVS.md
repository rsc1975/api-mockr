
# Execute

deno run -A src/index.ts

# Test & Coverage

rm coverage/*
deno test -A --coverage=coverage/ test/
deno coverage coverage --lcov --output=coverage.lcov
./codecov -t ${CODECOV_TOKEN} -f coverage.lcov 

## Bundle

deno bundle src/index.ts -- dist/api-mockr.js
deno run -A dist/api-mockr.js

