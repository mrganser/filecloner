import React from 'react'

import './button.scss'

export const Button = (props) => {
  const {type, text, onClick, color, faIcon, title} = props
  return (
    <button className={`button ${color}`} onClick={onClick} type={type} title={title}>
      <i className={`fa ${faIcon}`} /> {text}
    </button>
  )
}
