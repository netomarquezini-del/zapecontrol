/**
 * Produtos — Configuração de infoprodutos ativos
 *
 * Cada produto tem:
 * - Conta Meta Ads própria (ad_account_id)
 * - Nome na Ticto (para filtrar vendas)
 * - Preço do produto principal
 *
 * Para adicionar um novo produto:
 * 1. Criar a conta Meta Ads
 * 2. Adicionar aqui com o ad_account_id
 * 3. Configurar webhook da Ticto para o produto
 */

export interface Product {
  id: string
  name: string
  ticket: number
  meta_ad_account_id: string
  ticto_product_names: string[] // nomes que aparecem na Ticto (pode ter variações)
  active: boolean
}

export const PRODUCTS: Product[] = [
  {
    id: 'shopee-ads',
    name: 'Shopee ADS 2.0',
    ticket: 97,
    meta_ad_account_id: 'act_1122108785769636',
    ticto_product_names: ['Shopee ADS 2.0'],
    active: true,
  },
  // Quando tiver outro produto, adicionar aqui:
  // {
  //   id: 'ranqueando',
  //   name: 'Ranqueando em 15 Dias',
  //   ticket: 87,
  //   meta_ad_account_id: 'act_XXXXXXXXX',
  //   ticto_product_names: ['Ranqueando em 15 Dias 2.0'],
  //   active: true,
  // },
]

export const DEFAULT_PRODUCT = PRODUCTS[0]

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find(p => p.id === id)
}

export function getActiveProducts(): Product[] {
  return PRODUCTS.filter(p => p.active)
}
