import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updateCart = [...cart]
      const productExists = updateCart.find(product => product.id === productId)
      const stock = await api.get(`/stock/${productId}`);
      const stockAmount = stock.data.amount;
      const currencyAmount = productExists ? productExists.amount : 0;
      const amount = currencyAmount + 1;

      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque')
        return;
      }

      if (productExists) {
        productExists.amount = amount
      } else {
        const product = await api.get(`/products/${productId}`)
        const addNewProduct = {
          ...product.data,
          amount: 1
        }
        updateCart.push(addNewProduct)
      }

      setCart(updateCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart))


      toast.success('Item adicionado com sucesso')

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updateCart = [...cart]
      const removeProductItem = cart.filter(function (obj) {
        return obj.id !== productId;
      });

      const productExists = updateCart.find(product => product.id === productId)

      if (!productExists) {
        toast.error('Erro na remoção do produto');
      }else{
        setCart(removeProductItem)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(removeProductItem))
        toast.success('Item removido do seu carrinho')
      }


    } catch {

      toast.error('Erro na remoção do produto');



    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      if (amount <= 0) {
        return;
      }

      const stock = await api.get(`/stock/${productId}`);

      if (amount > stock.data.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      } else {

        const modifyCart = cart.map(product => product.id === productId ? {
          ...product,
          amount: amount
        } : product
        )


        setCart(modifyCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(modifyCart))
   
      }


    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
