module.exports = {
    bail: true,
    coverage: true,
    sourcemaps: true,
    threshold: 90,
    lint: false,
    typescript: true,
    verbose: true,
    pattern: '\.test',
    reporter: ['console', 'html', 'lcov'],
    output: ['stdout', 'coverage/coverage.html', 'coverage/lcov.info']
};