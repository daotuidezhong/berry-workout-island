import { useEffect, useRef } from "react";
import type { PhotoBoardPhoto } from "./types";

type Props = { open: boolean; photos: PhotoBoardPhoto[]; photoUrl: (photo: PhotoBoardPhoto) => string; onOpen: (rect: DOMRect) => void };

function getSceneThumbnailShape(photo: PhotoBoardPhoto) {
  const ratio = photo.width / photo.height;
  if (ratio < .8) return "portrait";
  if (ratio > 1.25) return "landscape";
  return "square";
}

const scenePhotoPositions = [
  { x: 18, row: 0 }, { x: 50, row: 0 }, { x: 82, row: 0 },
  { x: 18, row: 1 }, { x: 50, row: 1 }, { x: 82, row: 1 },
];

function ScenePhoto({ photo, src, index }: { photo: PhotoBoardPhoto; src: string; index: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shape = getSceneThumbnailShape(photo);
  const canvasSize = shape === "portrait" ? { width: 60, height: 80 } : shape === "landscape" ? { width: 88, height: 60 } : { width: 72, height: 72 };
  const position = scenePhotoPositions[index] ?? scenePhotoPositions[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      const context = canvas.getContext("2d");
      if (!context) return;
      const sourceRatio = image.naturalWidth / image.naturalHeight;
      const targetRatio = canvas.width / canvas.height;
      const sourceWidth = sourceRatio > targetRatio ? image.naturalHeight * targetRatio : image.naturalWidth;
      const sourceHeight = sourceRatio > targetRatio ? image.naturalHeight : image.naturalWidth / targetRatio;
      const sourceX = (image.naturalWidth - sourceWidth) / 2;
      const sourceY = (image.naturalHeight - sourceHeight) / 2;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.imageSmoothingEnabled = false;
      context.filter = "saturate(.78) sepia(.1) contrast(.94) brightness(1.02)";
      context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
    };
    image.src = src;
    return () => { image.onload = null; };
  }, [src]);

  return <span className={`scene-photo-slot scene-photo-row-${position.row}`} style={{ "--scene-photo-x": `${position.x}%`, "--scene-photo-rotation": `${photo.rotation * 1.15}deg` } as React.CSSProperties}>
    <i className="scene-photo-clip" />
    <span className={`scene-photo-thumb ${shape}`}>
      <canvas ref={canvasRef} width={canvasSize.width} height={canvasSize.height} role="img" aria-label={`${shape === "portrait" ? "竖向" : shape === "landscape" ? "横向" : "方形"}生活照片缩略图`} />
    </span>
  </span>;
}

export default function PhotoBoardWall({ open, photos, photoUrl, onOpen }: Props) {
  const artRef = useRef<HTMLDivElement>(null);
  const recent = photos.slice(-6);
  return <div className={`scene-photo-board ${open ? "is-open" : ""}`}>
    <div ref={artRef} className="scene-photo-board-art" aria-hidden="true">
      <img src="/game/photo-board-scene-v2.png" alt="" draggable={false} />
      <span className="scene-photo-board-inner">
        {recent.map((photo, index) => <ScenePhoto key={photo.id} photo={photo} src={photoUrl(photo)} index={index} />)}
      </span>
    </div>
    <button type="button" data-interactive className="photo-board-hotspot" aria-label="打开墙上的照片板" disabled={open} onPointerDown={(event) => event.stopPropagation()} onClick={() => { const rect = artRef.current?.getBoundingClientRect(); if (rect) onOpen(rect); }} />
  </div>;
}
