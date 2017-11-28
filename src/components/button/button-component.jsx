import React from 'react'

export const Button = (props) => {
  const {type, text, onClick, color, faIcon, title} = props
  return (
    <button className={`button ${color}`} onClick={onClick} type={type} title={title}>
      <i className={`fa ${faIcon}`} /> {text}
    </button>
  )
}
