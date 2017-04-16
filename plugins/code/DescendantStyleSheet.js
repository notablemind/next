
import {StyleSheet as BaseStyleSheet} from 'aphrodite'

const descendantHandler = (selector, baseSelector, generateSubtreeStyles) => {
  if (selector[0] !== '>') { return null; }
  return generateSubtreeStyles( `${baseSelector} > .${selector.slice(1)}`);
};

const {StyleSheet, css} = BaseStyleSheet.extend([{selectorHandler: descendantHandler}]);

export {StyleSheet, css}

