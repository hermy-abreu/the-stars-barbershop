import fs from 'node:fs/promises'
import path from 'node:path'

const needed=['GBP_CLIENT_ID','GBP_CLIENT_SECRET','GBP_REFRESH_TOKEN','GBP_ACCOUNT_ID','GBP_LOCATION_ID']
const missing=needed.filter(k=>!process.env[k])
if(missing.length) {
  console.log('Google Business Profile not connected. Missing: '+missing.join(', '))
  process.exit(0)
}
const form=new URLSearchParams({
  client_id:process.env.GBP_CLIENT_ID,
  client_secret:process.env.GBP_CLIENT_SECRET,
  refresh_token:process.env.GBP_REFRESH_TOKEN,
  grant_type:'refresh_token'
})
const authResponse=await fetch('https://oauth2.googleapis.com/token',{
  method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:form
})
if(!authResponse.ok)throw new Error('Google OAuth failed: HTTP '+authResponse.status)
const token=(await authResponse.json()).access_token
if(!token)throw new Error('Google OAuth response contained no access token')
const account=encodeURIComponent(process.env.GBP_ACCOUNT_ID)
const location=encodeURIComponent(process.env.GBP_LOCATION_ID)
const endpoint='https://mybusiness.googleapis.com/v4/accounts/'+account+'/locations/'+location+'/reviews?pageSize=50&orderBy=updateTime%20desc'
const response=await fetch(endpoint,{headers:{Authorization:'Bearer '+token}})
if(!response.ok)throw new Error('Google Business Profile reviews failed: HTTP '+response.status)
const data=await response.json()
const stars={ONE:1,TWO:2,THREE:3,FOUR:4,FIVE:5}
const reviews=(data.reviews||[]).filter(item=>stars[item.starRating]).slice(0,6).map(item=>({
  id:String(item.reviewId||''),
  author:String(item.reviewer?.displayName||'Google user').slice(0,100),
  rating:stars[item.starRating],
  comment:String(item.comment||'').slice(0,1400),
  date:item.createTime||item.updateTime||null
}))
const output={
  reviews,
  averageRating:typeof data.averageRating==='number'?data.averageRating:null,
  totalReviewCount:Number.isFinite(data.totalReviewCount)?data.totalReviewCount:reviews.length,
  updatedAt:new Date().toISOString()
}
const destination=path.join(process.cwd(),'public','google-reviews.json')
await fs.mkdir(path.dirname(destination),{recursive:true})
await fs.writeFile(destination,JSON.stringify(output,null,2)+'\n')
console.log('Synchronized '+reviews.length+' verified Google reviews')
