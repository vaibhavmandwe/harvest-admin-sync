import { useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card } from "@/components/ui/card";

interface ProductCarouselProps {
  images: string[];
  productName: string;
}

export function ProductCarousel({ images, productName }: ProductCarouselProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">No image available</p>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className="w-full aspect-square rounded-lg overflow-hidden">
        <img
          src={images[0]}
          alt={productName}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Carousel className="w-full" opts={{ loop: true }}>
        <CarouselContent>
          {images.map((image, index) => (
            <CarouselItem key={index}>
              <Card className="border-0">
                <div className="aspect-square overflow-hidden rounded-lg">
                  <img
                    src={image}
                    alt={`${productName} - Image ${index + 1}`}
                    className="w-full h-full object-cover"
                    onClick={() => setSelectedImage(index)}
                  />
                </div>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2" />
        <CarouselNext className="right-2" />
      </Carousel>

      {/* Thumbnail Navigation */}
      <div className="flex gap-2 justify-center overflow-x-auto pb-2">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedImage(index)}
            className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
              selectedImage === index
                ? "border-primary ring-2 ring-primary/20"
                : "border-border hover:border-primary/50"
            }`}
          >
            <img
              src={image}
              alt={`Thumbnail ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Image Counter */}
      <div className="text-center text-sm text-muted-foreground">
        {selectedImage + 1} / {images.length}
      </div>
    </div>
  );
}
