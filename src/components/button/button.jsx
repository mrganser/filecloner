import React from 'react';

import './button.scss';

export const Button = props => {
  const { text, color, faIcon, ...rest } = props
  return (
    <button className={`button ${color}`} {...rest}>
      <i className={`fa ${faIcon}`} /> {text}
    </button>
  )
};
