"use strict";

const fs = require("fs-promise");

/**
 * Gets the extractor regular expression for annotation.
 *
 * @param {string} annotationKey
 *    The main annotation key/name under which the annotation data is.
 *
 * @returns {RegExp}
 */
function getExtractRegex(annotationKey) {
  return new RegExp("/\\*\\*\\s*(\\r\\n|\\n)(\\s*\\*.*(\\r\\n|\\n))*?\\s*\\*\\s*@" + annotationKey + "\\s*\\{");
}

/**
 * Extract the annotation data from the content.
 *
 * @param {string} str
 *    The file content containing the annotation.
 * @param {int} startPosition
 *    The start position of the annotation.
 *
 * @return {Object}
 *    The annotation data.
 */
function extractAnnotationData(str, startPosition) {
  str = str.substr(startPosition);

  let openBrackets = 1;
  let inString = false;
  let iChar = 0;
  let atChar;

  // Determine the position where the final closing bracket is found.
  // We must account for the fact that multiple brackets can be
  // found in the JSON body, and even inside string literals which
  // must not count.
  while (openBrackets && iChar < str.length) {
    atChar = str.charAt(iChar);

    if (!inString) {
      if (atChar === "{") ++openBrackets;
      else if (atChar === "}") --openBrackets;
      else if (atChar === "'") inString = "'";
      else if (atChar === "\"") inString = "\"";
    }
    else if (atChar === inString && str.charAt(iChar - 1) !== "\\") {
      inString = false;
    }

    ++iChar;
  }

  if (openBrackets) {
    throw new Error("Unterminated annotation. Missing closing bracket.");
  }

  // Replace first level syntax of the associative array.
  // * @variableName "value" => "variableName": "value".
  let json = str.substr(0, iChar - 1).replace(/\s*\*\s*@([^0-9]\w+)\s/g, "\"$1\":")
  // Remove non first level line asterisks.
    .replace(/(\r?\n|\r)\s*\*/g, "")
  // Remove new line characters.
    .replace(/\r?\n|\r/g, "");

  // Remove from the end the asterisk, whitespace and possible comma.
  let cutIndex = json.length - 1;
  while (json.charAt(cutIndex).match(/\s|,|\*/)) --cutIndex;
  json = "{" + json.substr(0, cutIndex + 1) + "}";

  try {
    return JSON.parse(json);
  }
  catch (err) {
    throw new Error(`Malformed annotation syntax.\n${err}`);
  }
}

/**
 * Get the annotation object from file content.
 *
 * @param {string} content
 * @param {string} annotationKey
 *    The main annotation key/name under which the annotation data is.
 *
 * @returns {Object}
 *    Annotation data.
 */
function getAnnotation(content, annotationKey) {
  let match = getExtractRegex(annotationKey).exec(content);

  if (!match) {
    throw new Error(`Annotation '@${annotationKey}' not found in file.`);
  }

  return extractAnnotationData(content, match.index + match[0].length);
}

module.exports = {

  /**
   * Get the annotation data from file content.
   *
   * @param {string} content
   *    Raw js file content.
   * @param {string} annotationKey
   *    The main annotation key/name under which the annotation data is.
   *
   * @returns {Object}
   */
  readFromString(content, annotationKey) {
    return getAnnotation(content, annotationKey);
  },

  /**
   * Get the annotation data from file.
   *
   * @param {string} filePath
   *    The path to the js file.
   * @param {string} annotationKey
   *    The main annotation key/name under which the annotation data is.
   *
   * @returns {Object}
   */
  readSync(filePath, annotationKey) {
  return getAnnotation(fs.readFileSync(filePath).toString(), annotationKey);
  },

  /**
   * Get the annotation data with promise from file.
   *
   * @param {string} filePath
   *    The path to the js file.
   * @param {string} annotationKey
   *    The main annotation key/name under which the annotation data is.
   *
   * @returns {Promise.<Object>}
   */
  read(filePath, annotationKey) {
    return fs.readFile(filePath)
      .then((content) => getAnnotation(content, annotationKey));
  }

};
