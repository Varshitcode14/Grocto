"use client"

import { useState } from "react"

const ImageWithFallback = ({ src, alt, className, fallbackSrc = "/placeholder.svg", ...props }) => {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc)
  const [error, setError] = useState(false)

  const onError = () => {
    console.error(`Failed to load image: ${src}`)
    if (!error) {
      setImgSrc(fallbackSrc)
      setError(true)
    }
  }

  return (
    <img src={imgSrc || "/placeholder.svg"} alt={alt || "Image"} className={className} onError={onError} {...props} />
  )
}

export default ImageWithFallback

