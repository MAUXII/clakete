"use client"

import { useEffect, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'

interface ImageCropperProps {
  image: string
  aspect: number
  onCrop: (croppedImage: string) => void
  type?: 'avatar' | 'banner' | 'list'
}

export function ImageCropper({ image, aspect, onCrop, type = 'avatar' }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const isBannerLike = type === 'banner' || type === 'list' // mantido para estilo de container

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const imageEl = new Image()
      imageEl.crossOrigin = 'anonymous'
      imageEl.src = src
      imageEl.onload = () => resolve(imageEl)
      imageEl.onerror = (err) => reject(err)
    })
  }

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
    const imageEl = await loadImage(imageSrc)
    const canvas = document.createElement('canvas')

    const sourceWidth = Math.max(1, Math.round(pixelCrop.width))
    const sourceHeight = Math.max(1, Math.round(pixelCrop.height))

    const maxDimensions = isBannerLike
      ? { width: 3840, height: 2160 }
      : { width: 1600, height: 1600 }

    let targetWidth = sourceWidth
    let targetHeight = sourceHeight

    if (targetWidth > maxDimensions.width) {
      targetHeight = Math.round((targetHeight * maxDimensions.width) / targetWidth)
      targetWidth = maxDimensions.width
    }

    if (targetHeight > maxDimensions.height) {
      targetWidth = Math.round((targetWidth * maxDimensions.height) / targetHeight)
      targetHeight = maxDimensions.height
    }

    canvas.width = Math.max(1, targetWidth)
    canvas.height = Math.max(1, targetHeight)

    const ctx = canvas.getContext('2d')

    if (ctx) {
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
    }

    ctx?.drawImage(
      imageEl,
      pixelCrop.x,
      pixelCrop.y,
      sourceWidth,
      sourceHeight,
      0,
      0,
      canvas.width,
      canvas.height
    )

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'))
          return
        }

        resolve(blob)
      }, 'image/webp', 0.98)
    })
  }

  const handleCropComplete = (_croppedArea: Area, nextCroppedAreaPixels: Area) => {
    setCroppedAreaPixels(nextCroppedAreaPixels)
  }

  useEffect(() => {
    const runCrop = async () => {
      if (!croppedAreaPixels) return

      try {
        const croppedBlob = await getCroppedImg(image, croppedAreaPixels)
        const croppedUrl = URL.createObjectURL(croppedBlob)
        onCrop(croppedUrl)
      } catch (error) {
        console.error(error)
      }
    }

    void runCrop()
  }, [image, croppedAreaPixels, onCrop])

  return (
    <div className="w-full">
      <div
        className={isBannerLike
          ? "relative w-full aspect-[16/9] overflow-hidden rounded-md bg-black"
          : "relative w-full max-h-[78vh] overflow-hidden rounded-lg bg-black"}
        style={{ aspectRatio: isBannerLike ? 16 / 9 : aspect }}
      >
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={handleCropComplete}
        />
      </div>
    </div>
  )
}