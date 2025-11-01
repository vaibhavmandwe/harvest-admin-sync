import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ImageUpload } from "./ImageUpload";

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: any;
}

export function ProductDialog({ open, onOpenChange, product }: ProductDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    category_id: "",
    price: "",
    mrp: "",
    unit: "piece",
    status: "active",
  });
  const [images, setImages] = useState<string[]>([]);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*");
      return data || [];
    },
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        sku: product.sku || "",
        description: product.description || "",
        category_id: product.category_id || "",
        price: product.price || "",
        mrp: product.mrp || "",
        unit: product.unit || "piece",
        status: product.status || "active",
      });
      setImages(product.images || []);
    } else {
      setFormData({
        name: "",
        sku: "",
        description: "",
        category_id: "",
        price: "",
        mrp: "",
        unit: "piece",
        status: "active",
      });
      setImages([]);
    }
  }, [product, open]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // Validate images
      if (!images || images.length === 0) {
        throw new Error("At least one product image is required");
      }
      if (images.length > 4) {
        throw new Error("Maximum 4 images allowed");
      }

      // Upload images to Supabase Storage
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < images.length; i++) {
        const imageUrl = images[i];
        
        // Skip if already a Supabase URL (existing image)
        if (imageUrl.includes('supabase.co')) {
          uploadedUrls.push(imageUrl);
          continue;
        }

        // Convert blob URL to file
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const fileName = `${Date.now()}-${i}-${Math.random().toString(36).substring(7)}.jpg`;
        const filePath = product?.id 
          ? `${product.id}/${fileName}` 
          : `temp/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, blob, {
            contentType: blob.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      const productData = { ...data, images: uploadedUrls };

      if (product) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", product.id);
        if (error) throw error;

        // Delete old images if they were replaced
        if (product.images) {
          const oldUrls = product.images.filter((url: string) => !uploadedUrls.includes(url));
          for (const oldUrl of oldUrls) {
            const path = oldUrl.split('/product-images/')[1];
            if (path) {
              await supabase.storage.from('product-images').remove([path]);
            }
          }
        }
      } else {
        const { data: newProduct, error } = await supabase
          .from("products")
          .insert([productData])
          .select()
          .single();
        
        if (error) throw error;

        // Move images from temp to product folder
        if (newProduct) {
          const finalUrls: string[] = [];
          for (const url of uploadedUrls) {
            if (url.includes('/temp/')) {
              const fileName = url.split('/temp/')[1];
              const oldPath = `temp/${fileName}`;
              const newPath = `${newProduct.id}/${fileName}`;
              
              const { error: moveError } = await supabase.storage
                .from('product-images')
                .move(oldPath, newPath);

              if (!moveError) {
                const { data: { publicUrl } } = supabase.storage
                  .from('product-images')
                  .getPublicUrl(newPath);
                finalUrls.push(publicUrl);
              } else {
                finalUrls.push(url);
              }
            } else {
              finalUrls.push(url);
            }
          }

          // Update product with final URLs
          await supabase
            .from("products")
            .update({ images: finalUrls })
            .eq("id", newProduct.id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(product ? "Product updated!" : "Product created!");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save product");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Add Product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <ImageUpload
            images={images}
            onChange={setImages}
            maxImages={4}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="piece">Piece</SelectItem>
                  <SelectItem value="kg">Kilogram</SelectItem>
                  <SelectItem value="liter">Liter</SelectItem>
                  <SelectItem value="pack">Pack</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mrp">MRP</Label>
              <Input
                id="mrp"
                type="number"
                step="0.01"
                value={formData.mrp}
                onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}