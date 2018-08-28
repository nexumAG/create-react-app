import { css } from 'styled-components';

const sizes = {
  large: 1200,
  desktop: 992,
  tablet: 768,
  phone: 480,
};

export default Object.keys(sizes).reduce((acc, label) => {
  acc[label] = (...args) => css`
    @media (max-width: ${sizes[label] - 1}px) {
      ${css(...args)}
    }
  `;
  return acc;
}, {});

export const minMedia = Object.keys(sizes).reduce((acc, label) => {
  acc[label] = (...args) => css`
    @media (min-width: ${sizes[label]}px) {
      ${css(...args)}
    }
  `;
  return acc;
}, {});
