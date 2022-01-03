'use strict';

const assert = require('chai').assert;
const fs = require('fs');
const path = require('path');

const LANGUAGE_FILE_DIRECTORY = fs.realpathSync('./public/languages');
const SOURCE_FILE_PATH = path.join(LANGUAGE_FILE_DIRECTORY, 'en.json');

/**
 * Validate localisation related files
 */
suite('l10n', function () {
    /**
     * Generate array of all the properties in dot notation.
     *
     * Could not find functionality in Chai to test equality of 2 object structures without taking into account values, thus this...
     *
     * For example: {a: {a1: 1}, b} would result in ["a.a1", "b"]
     *
     * @param {Object} obj
     * @returns {Array<String>} Array of dot notation property "addresses".
     */
    const propertiesToDotNotationArray = function (obj) {
        const res = [];
        Object.keys(obj).forEach(function (key) {
            if (typeof obj[key] === 'object' && Object.keys(obj[key]).length) {
                // Recursion
                propertiesToDotNotationArray(obj[key]).forEach(function (sub) {
                    res.push(key + '.' + sub);
                });
            } else {
                res.push(key);
            }
        });
        return res;
    };

    suite('Language files *.json', function () {

        test('All language files should be valid JSON', function (done) {
            fs.readdirSync(LANGUAGE_FILE_DIRECTORY).forEach(function (file) {
                if (!file.match(/\.json$/)) { // Exclude folders
                    return;
                }

                require(path.join(LANGUAGE_FILE_DIRECTORY, file));
            });

            done();
        });

        test('All language files should have the same structure as source (en.json)', function (done) {
            const source = require(SOURCE_FILE_PATH);
            const sourceProperties = propertiesToDotNotationArray(source);

            fs.readdirSync(LANGUAGE_FILE_DIRECTORY).forEach(function (file) {
                if (!file.match(/\.json$/) && file === SOURCE_FILE_PATH) { // Exclude folders
                    return;
                }

                const translation = require(path.join(LANGUAGE_FILE_DIRECTORY, file));
                const translationProperties = propertiesToDotNotationArray(translation);

                assert.deepEqual(translationProperties.sort(), sourceProperties.sort(), `Source and language file "${file}" mismatch!`);
            });

            done();
        });

    });
});
