export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  details: string;
  categoryId: string;
  imageUrl?: string;
  imageUrl2?: string;
}

export interface Config {
  ownerWhatsAppNumber: string;
}
