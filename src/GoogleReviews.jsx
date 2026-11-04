import {useEffect,useState} from 'react'

export default function GoogleReviews({language='es',mapsUrl}) {
  const [data,setData]=useState(null)
  useEffect(()=>{
    let live=true
    async function load(){
      try{
        const response=await fetch('/google-reviews.json?refresh='+Date.now(),{cache:'no-store'})
        if(!response.ok)throw new Error('Reviews unavailable')
        const next=await response.json()
        if(live)setData(next)
      }catch{if(live)setData(null)}
    }
    load()
    const interval=setInterval(load,15*60*1000)
    return ()=>{live=false;clearInterval(interval)}
  },[])
  const es=language==='es'
  const items=Array.isArray(data?.reviews)?data.reviews:[]
  return <div className="review-panel">
    {items.length ? <div className="google-review-content">
      <p><strong>{es?'Opiniones de clientes en Google':'Customer reviews on Google'}</strong></p>
      {typeof data.averageRating==='number' && <p aria-label={es?'Calificación promedio':'Average rating'}>
        <strong>{data.averageRating.toFixed(1)} ★</strong>
        {' · '+(data.totalReviewCount||items.length)+' '+(es?'valoraciones':'ratings')}
      </p>}
      <div className="google-review-grid">
        {items.map((review,i)=><article className="google-review-entry" key={review.id||i}>
          <strong>{review.author||'Google'}</strong>
          <span aria-label={String(review.rating)+' / 5'}>{'★'.repeat(Math.max(0,Math.min(5,review.rating||0)))}</span>
          {review.comment && <p>{review.comment}</p>}
          {review.date && <small>{new Date(review.date).toLocaleDateString(es?'es-US':'en-US')}</small>}
        </article>)}
      </div>
      <small>{es?'Fuente: Google · última sincronización: ':'Source: Google · last sync: '}{data.updatedAt?new Date(data.updatedAt).toLocaleString(es?'es-US':'en-US'):''}</small>
    </div> : <div>
      <strong>{es?'Reseñas auténticas de Google':'Authentic Google reviews'}</strong>
      <p>{es?'Consulta las opiniones actuales directamente en Google Maps.':'See current customer reviews directly on Google Maps.'}</p>
    </div>}
    <a className="gold-button" href={mapsUrl} target="_blank" rel="noopener noreferrer">
      {es?'Ver reseñas en Google Maps':'View reviews on Google Maps'}
    </a>
  </div>
}
