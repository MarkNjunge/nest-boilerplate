// Copyright (c) 2015 Sami Koskimäki
// https://github.com/Vincit/objection.js/blob/dbb20aebaac2059149ec18386283b3cce4a3d7f0/lib/utils/identifierMapping.js

export function snakeCase(
  str: string,
  {
    upperCase = false,
    underscoreBeforeDigits = false,
    underscoreBetweenUppercaseLetters = false,
  } = {},
) {
  if (str.length === 0) {
    return str;
  }

  const upper: string = str.toUpperCase();
  const lower: string = str.toLowerCase();

  let out = lower[0];

  for (let i = 1, l = str.length; i < l; ++i) {
    const char = str[i];
    const prevChar = str[i - 1];

    const upperChar = upper[i];
    const prevUpperChar = upper[i - 1];

    const lowerChar = lower[i];
    const prevLowerChar = lower[i - 1];

    // If underScoreBeforeDigits is true then, well, insert an underscore
    // before digits :). Only the first digit gets an underscore if
    // there are multiple.
    if (underscoreBeforeDigits && isDigit(char) && !isDigit(prevChar)) {
      out += `_${char}`;
      continue;
    }

    // Test if `char` is an upper-case character and that the character
    // actually has different upper and lower case versions.
    if (char === upperChar && upperChar !== lowerChar) {
      const prevCharacterIsUppercase =
        prevChar === prevUpperChar && prevUpperChar !== prevLowerChar;

      // If underscoreBetweenUppercaseLetters is true, we always place an underscore
      // before consecutive uppercase letters (e.g. "fooBAR" becomes "foo_b_a_r").
      // Otherwise, we don't (e.g. "fooBAR" becomes "foo_bar").
      if (underscoreBetweenUppercaseLetters || !prevCharacterIsUppercase) {
        out += `_${lowerChar}`;
      } else {
        out += lowerChar;
      }
    } else {
      out += char;
    }
  }

  if (upperCase) {
    return out.toUpperCase();
  } else {
    return out;
  }
}

function isDigit(char) {
  return char >= "0" && char <= "9";
}
