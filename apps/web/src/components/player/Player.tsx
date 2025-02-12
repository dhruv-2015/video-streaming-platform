import React from 'react'
import Vidstack from './Vidstack'

export const VideoPlayer = () => {
  return (
    <div className="aspect-video bg-black mb-4 rounded-lg overflow-hidden">
      <Vidstack
        src="http://192.168.0.77:5500/output7/master.m3u8"
        title="GENIUS Uses SECRET Alchemy To Craft S Rank HOMUNCULUS Girls To Get REVENGE! - Manhwa Recap GENIUS Uses SECRET Alchemy To Craft S Rank HOMUNCULUS Girls To Get REVENGE! - Manhwa Recap Red notice"
        poster="https://files.vidstack.io/sprite-fight/poster.webp"
        storyboard="http://192.168.0.77:5500/output7/storyboard.vtt"
      />
    </div>
  )
}
