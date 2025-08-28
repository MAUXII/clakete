"use client"

import { useState } from 'react'
import ReactCrop, { type Crop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

interface ImageCropperProps {
  image: string
  aspect: number
  onCrop: (croppedImage: string) => void
  type?: 'avatar' | 'banner' | 'list'
}

export function ImageCropper({ image, aspect, onCrop, type = 'avatar' }: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  })

  const getCroppedImg = (image: HTMLImageElement, crop: Crop): Promise<string> => {
    return new Promise((resolve, reject) => {
      const handleCrop = () => {
        try {
          const canvas = document.createElement('canvas');
          
          // Verifica se a imagem tem dimensões válidas
          if (image.naturalWidth === 0 || image.naturalHeight === 0) {
            reject(new Error('Imagem inválida: dimensões zero'));
            return;
          }
          
          // Calcula as dimensões em pixels da área selecionada
          const scaleX = image.naturalWidth / 100;
          const scaleY = image.naturalHeight / 100;
          
          const sourceX = Math.round(crop.x * scaleX);
          const sourceY = Math.round(crop.y * scaleY);
          const sourceWidth = Math.round(crop.width * scaleX);
          const sourceHeight = Math.round(crop.height * scaleY);

          // Verifica se as dimensões do crop são válidas
          if (sourceWidth <= 0 || sourceHeight <= 0) {
            reject(new Error('Área de crop inválida'));
            return;
          }

          // Define um tamanho máximo baseado no tipo de imagem
          const MAX_DIMENSIONS = (type === 'banner' || type === 'list')
            ? { width: 2236, height: 900 }    // 2x a largura do seu banner
            : { width: 800, height: 800 };    // Avatar mantém o mesmo tamanho
          
          let targetWidth = sourceWidth;
          let targetHeight = sourceHeight;
          
          // Redimensiona proporcionalmente se necessário
          if (sourceWidth > MAX_DIMENSIONS.width) {
            targetWidth = MAX_DIMENSIONS.width;
            targetHeight = (sourceHeight * MAX_DIMENSIONS.width) / sourceWidth;
          }
          
          if (targetHeight > MAX_DIMENSIONS.height) {
            targetHeight = MAX_DIMENSIONS.height;
            targetWidth = (targetWidth * MAX_DIMENSIONS.height) / targetHeight;
          }
          
          // Garante que as dimensões são números inteiros e maiores que zero
          targetWidth = Math.max(1, Math.round(targetWidth));
          targetHeight = Math.max(1, Math.round(targetHeight));
          
          // Define as dimensões do canvas
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          
          const ctx = canvas.getContext('2d', {
            alpha: true,  // Mantém transparência
            willReadFrequently: false
          });

          if (!ctx) {
            reject(new Error('Não foi possível obter o contexto 2D'));
            return;
          }

          // Aplica suavização de alta qualidade
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Desenha a imagem cropada
          ctx.drawImage(
            image,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            targetWidth,
            targetHeight
          );

          // Converte para WebP com alta qualidade
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Falha ao gerar blob'));
                return;
              }
              resolve(URL.createObjectURL(blob));
            },
            'image/webp',
            0.95
          );
        } catch (error) {
          console.error('Erro durante o crop:', error);
          reject(error);
        }
      };

      // Garante que a imagem está carregada
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = handleCrop;
      img.onerror = () => reject(new Error('Erro ao carregar a imagem'));
      img.src = image.src;
    });
  };

  return (
    <div className="relative w-full">
      <ReactCrop
        crop={crop}
        onChange={(c) => setCrop(c)}
        onComplete={async (c, pixelCrop) => {
          try {
            const img = document.createElement('img');
            img.crossOrigin = 'anonymous';
            img.src = image;
            
            // Aguarda a imagem carregar
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
            });
            
            const croppedImage = await getCroppedImg(img, pixelCrop);
            onCrop(croppedImage);
          } catch (error) {
            console.error('Erro ao fazer crop da imagem:', error);
          }
        }}
        aspect={aspect}
        className="crop-container"
      >
        <img 
          src={image} 
          alt="Crop me" 
          crossOrigin="anonymous"
          className="max-w-full h-auto max-h-[70vh] mx-auto"
        />
      </ReactCrop>
    </div>
  )
}