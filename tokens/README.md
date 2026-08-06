# Token catalog (queryable)

Updated: `2026-08-06T04:17:32.478Z`

Primary key: **`tokenKey` = caip2 + asset**. Do **not** treat `USDT` / `USDC` as one asset across chains.

| Machine JSON | URL |
|---|---|
| Flat catalog | [`catalog.v1.json`](./catalog.v1.json) |
| By chain | [`by-chain.v1.json`](./by-chain.v1.json) |
| Browse UI | [`browse.html`](./browse.html) |

## Chains

### Bitcoin (`bip122:000000000019d6689c085ae165831e93`) — 1 tokens

| symbol | name | address | tokenKey |
|---|---|---|---|
| BTC | Bitcoin | `native` | `bip122:000000000019d6689c085ae165831e93/native` |

### Ethereum Mainnet (`eip155:1`) — 4 tokens

| symbol | name | address | tokenKey |
|---|---|---|---|
| DAI | Dai Stablecoin | `0x6B175474E89094C44Da98b954EedeAC495271d0F` | `eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f` |
| ETH | Ether | `native` | `eip155:1/native` |
| USDC | USD Coin | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` | `eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48` |
| USDT | Tether USD | `0xdAC17F958D2ee523a2206206994597C13D831ec7` | `eip155:1/erc20:0xdac17f958d2ee523a2206206994597c13d831ec7` |

### Optimistic Ethereum (`eip155:10`) — 3 tokens

| symbol | name | address | tokenKey |
|---|---|---|---|
| DAI | Dai Stablecoin | `0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1` | `eip155:10/erc20:0xda10009cbd5d07dd0cecc66161fc93d7c9000da1` |
| USDC | USD Coin | `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85` | `eip155:10/erc20:0x0b2c639c533813f4aa9d7837caf62653d097ff85` |
| USDT | Tether USD | `0x94b008aA00579c1307B0EF2c499aD98a8ce58e58` | `eip155:10/erc20:0x94b008aa00579c1307b0ef2c499ad98a8ce58e58` |

### Polygon (Matic) Mainnet (`eip155:137`) — 4 tokens

| symbol | name | address | tokenKey |
|---|---|---|---|
| DAI | Dai Stablecoin | `0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063` | `eip155:137/erc20:0x8f3cf7ad23cd3cadbd9735aff958023239c6a063` |
| USDC | USD Coin | `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359` | `eip155:137/erc20:0x3c499c542cef5e3811e1192ce70d8cc03d5c3359` |
| USDC.e | Bridged USD Coin (PoS) | `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174` | `eip155:137/erc20:0x2791bca1f2de4661ed88a30c99a7a9449aa84174` |
| USDT | Tether USD | `0xc2132D05D31c914a87C6611C10748AEb04B58e8F` | `eip155:137/erc20:0xc2132d05d31c914a87c6611c10748aeb04b58e8f` |

### Arbitrum One (`eip155:42161`) — 3 tokens

| symbol | name | address | tokenKey |
|---|---|---|---|
| DAI | Dai Stablecoin | `0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1` | `eip155:42161/erc20:0xda10009cbd5d07dd0cecc66161fc93d7c9000da1` |
| USDC | USD Coin | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` | `eip155:42161/erc20:0xaf88d065e77c8cc2239327c5edb3a432268e5831` |
| USDT | Tether USD | `0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9` | `eip155:42161/erc20:0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9` |

### Avalanche Mainnet (`eip155:43114`) — 2 tokens

| symbol | name | address | tokenKey |
|---|---|---|---|
| USDC | USD Coin | `0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E` | `eip155:43114/erc20:0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e` |
| USDT | Tether USD | `0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7` | `eip155:43114/erc20:0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7` |

### BNB Smart Chain (`eip155:56`) — 9 tokens

| symbol | name | address | tokenKey |
|---|---|---|---|
| BNB | BNB | `native` | `eip155:56/native` |
| BTCB | BTCB Token | `0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c` | `eip155:56/erc20:0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c` |
| CAKE | PancakeSwap Token | `0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82` | `eip155:56/erc20:0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82` |
| DAI | Dai Token | `0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3` | `eip155:56/erc20:0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3` |
| ETH | Ethereum Token | `0x2170Ed0880ac9A755fd29B2688956BD959F933F8` | `eip155:56/erc20:0x2170ed0880ac9a755fd29b2688956bd959f933f8` |
| FDUSD | First Digital USD | `0xc5f0f7b66764F6ec8C8Dff7BA683102295E16409` | `eip155:56/erc20:0xc5f0f7b66764f6ec8c8dff7ba683102295e16409` |
| USDC | USD Coin | `0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d` | `eip155:56/erc20:0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d` |
| USDT | Tether USD | `0x55d398326f99059fF775485246999027B3197955` | `eip155:56/erc20:0x55d398326f99059ff775485246999027b3197955` |
| WBNB | Wrapped BNB | `0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c` | `eip155:56/erc20:0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c` |

### Base (`eip155:8453`) — 2 tokens

| symbol | name | address | tokenKey |
|---|---|---|---|
| DAI | Dai Stablecoin | `0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb` | `eip155:8453/erc20:0x50c5725949a6f0c72e6c4a641f24049a917db0cb` |
| USDC | USD Coin | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | `eip155:8453/erc20:0x833589fcd6edb6e08f4c7c32d4f71b54bda02913` |

### Solana (`solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp`) — 8 tokens

| symbol | name | address | tokenKey |
|---|---|---|---|
| BONK | Bonk | `DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263` | `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263` |
| JUP | Jupiter | `JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN` | `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN` |
| PYUSD | PayPal USD | `2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo` | `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo` |
| RAY | Raydium | `4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R` | `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R` |
| SOL | Solana | `native` | `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/native` |
| USDC | USD Coin | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` | `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` |
| USDT | Tether USD | `Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB` | `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB` |
| WIF | dogwifhat | `EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm` | `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm` |

### TRON (`tron:mainnet`) — 2 tokens

| symbol | name | address | tokenKey |
|---|---|---|---|
| TRX | TRON | `native` | `tron:mainnet/native` |
| USDT | Tether USD | `TR7NHqjeKQxGTCi5q8t4xwpAUk3VPQW2w` | `tron:mainnet/trc20:TR7NHqjeKQxGTCi5q8t4xwpAUk3VPQW2w` |

