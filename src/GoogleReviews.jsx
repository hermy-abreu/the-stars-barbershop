import {useEffect,useState} from 'react'

const ROTATION_MS=60*1000

export default function GoogleReviews({language='es',mapsUrl}) {
  const [data,setData]=useState(null)
  const [active,setActive]=useState(0)
  const [paused,setPaused]=useState(false)
  const [elapsedReset,setElapsedReset]=useState(0)

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
  const count=items.length
  const currentIndex=count?active%count:0
  const review=items[currentIndex]
  useEffect(()=>{
    if(paused||count<2)return
    const interval=setInterval(()=>setActive(index=>(index+1)%count),ROTATION_MS)
    return ()=>clearInterval(interval)
  },[paused,count,elapsedReset])

  function changeSlide(direction) {
    if(!count)return
    setActive(index=>(index+direction+count)%count)
    setElapsedReset(reset=>reset+1)
  }

  return <div className="review-panel">
    {review ? <div className="google-review-content">
      <p><strong>{es?'Opiniones de clientes en Google':'Customer reviews on Google'}</strong></p>
      {typeof data.averageRating==='number' && <p aria-label={es?'Calificación promedio':'Average rating'}>
        <strong>{data.averageRating.toFixed(1)} ★</strong>
        {' · '+(data.totalReviewCount||count)+' '+(es?'valoraciones':'ratings')}
      </p>}
      <div className="google-review-slideshow" aria-label={es?'Reseñas de clientes':'Customer reviews'}>
        <article className="google-review-slide" key={review.id||currentIndex} aria-label={(currentIndex+1)+' / '+count}>
          <span className="google-review-stars" aria-label={String(review.rating)+' / 5'}>{'★'.repeat(Math.max(0,Math.min(5,review.rating||0)))}</span>
          {review.comment && <blockquote>{review.comment}</blockquote>}
          <strong>{review.author||'Google'}</strong>
          {review.date && <small>{new Date(review.date).toLocaleDateString(es?'es-US':'en-US')}</small>}
        </article>
        {count>1 && <div className="google-review-controls">
          <button type="button" onClick={()=>changeSlide(-1)} aria-label={es?'Reseña anterior':'Previous review'}>‹</button>
          <span>{currentIndex+1} / {count}</span>
          <button type="button" onClick={()=>changeSlide(1)} aria-label={es?'Siguiente reseña':'Next review'}>›</button>
          <button type="button" className="google-review-pause" onClick={()=>setPaused(value=>!value)} aria-pressed={paused}>
            {paused?(es?'▶ Reanudar':'▶ Resume'):(es?'Ⅱ Pausar':'Ⅱ Pause')}
          </button>
        </div>}
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
