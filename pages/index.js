import axios from "axios"
import { ethers } from "ethers"
import { useEffect,useState } from "react"
import web3modal from "web3modal"
import { nftaddress, nftmarketaddress } from "../config"
import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json'


export default function Home() {

  const [nfts,setNfts] = useState([]);
  const [loadingState,setLoadingState] = useState('not-loaded');

  useEffect(()=>{
    loadNFTs()
  },[])

  async function loadNFTs() {
    const provider = new ethers.providers.JsonRpcProvider()
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
    const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, provider)
    const data = await marketContract.fetchMarketItems()
 
    const items = await Promise.all(data.map(async i =>{
      const tokenUri = await tokenContract.tokenUri(i.tokenId)
      const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.price.toString(),'ether')
      let item = {
        price,
        tokenId:i.tokenId.toNumber(),
        seller:i.seller,
        owner:i.owner,
        image:meta.data.image,
        name:meta.data.name,
        description:meta.data.description,
      }
      return item
    }))
    setNfts(items)
    setLoadingState('loaded')
  } 

  async function BuyNFT(nft){
    const web3modal =  new web3modal()
    const connection = await web3modal.connect()
    const  provider =  new ethers.providers.Web3Provider(connection)

    const signer = provider.getSigner()
    const contract = new ethers.Contract(nftmarketaddress,NFTMarket.abi,signer)

    const price = ethers.utils.parseUnits(nft.price.toString(),'ether')

    const transaction = await contract.createMarketSale(nftaddress,nft.tokenId,{value: price})

    await transaction.wait()
    loadNFTs();
  }

  if (loadingState === 'loaded' && !nfts.length) return (
    <h1 className="px-20 py-10 text-3xl">No items in marketplace</h1>
  )

  return (
    <div className="flex justify-center">
      <div className="px-4" style={{maxWidth:"1600px"}}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 gt-4">
          {
            nfts.map((nft,i)=>(
              <div className="border shadow rounded-xl overflow-hidden">
                <img src={nft.image}/>
                <div className="p-4">
                  <p style={{height:'64px'}} className="text-2xl font-semibold">{nft.name}</p>
                  <div style={{height:'70px', overflow:'hidden'}}>
                  <p className="text-gray-400">{nft.description}</p>
                  </div>
                  </div>
                  <div className="p-4 bg-black">
                    <p className="text-2xl mb-4 font-bold text-white">{nft.price} MATIC</p>
                    <button className="w-full b bg-pink-500 text-white font-bold py-2 px-12 rounded" onClick={()=> BuyNFT(nft)}>Buy</button>
                  </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}