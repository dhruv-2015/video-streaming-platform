import React from 'react'
import Vidstack from './Vidstack'

const subtitles = [{
    "part": 2,
    "index": 0,
    "default": true,
    "output": "output7/subtitle_0_eng.srt",
    "language": "eng",
    "title": "English",
    "codec": "srt"
  },
  {
    "part": 2,
    "index": 1,
    "default": false,
    "output": "output7/subtitle_1_eng.srt",
    "language": "eng",
    "title": "Forced",
    "codec": "srt"
  },
  {
    "part": 2,
    "index": 2,
    "default": false,
    "output": "output7/subtitle_2_eng.srt",
    "language": "eng",
    "title": "English",
    "codec": "srt"
  },
  {
    "part": 2,
    "index": 3,
    "default": false,
    "output": "output7/subtitle_3_eng.srt",
    "language": "eng",
    "title": "Forced",
    "codec": "srt"
  },
  {
    "part": 2,
    "index": 4,
    "default": false,
    "output": "output7/subtitle_4_ara.srt",
    "language": "ara",
    "title": "Arabic",
    "codec": "srt"
  },
  {
    "part": 2,
    "index": 5,
    "default": false,
    "output": "output7/subtitle_5_chi.srt",
    "language": "chi",
    "title": "Chinese Simplified",
    "codec": "srt"
  },
  {
    "part": 2,
    "index": 6,
    "default": false,
    "output": "output7/subtitle_6_chi.srt",
    "language": "chi",
    "title": "Chinese Traditional",
    "codec": "srt"
  },
  {
    "part": 2,
    "index": 7,
    "default": false,
    "output": "output7/subtitle_7_hrv.srt",
    "language": "hrv",
    "title": "Croatian",
    "codec": "srt"
  },
  {
    "part": 2,
    "index": 8,
    "default": false,
    "output": "output7/subtitle_8_cze.srt",
    "language": "cze",
    "title": "Czech",
    "codec": "srt"
  },
  {
    "part": 2,
    "index": 9,
    "default": false,
    "output": "output7/subtitle_9_dan.srt",
    "language": "dan",
    "title": "Danish",
    "codec": "srt"
  },
  {
    "part": 2,
    "index": 10,
    "default": false,
    "output": "output7/subtitle_10_dut.srt",
    "language": "dut",
    "title": "Dutch",
    "codec": "srt"
  },
  {
    "part": 2,
    "index": 11,
    "default": false,
    "output": "output7/subtitle_11_fin.srt",
    "language": "fin",
    "title": "Finnish",
    "codec": "srt"
  },
  {
    "part": 2,
    "index": 12,
    "default": false,
    "output": "output7/subtitle_12_fre.srt",
    "language": "fre",
    "title": "French",
    "codec": "srt"
  },
  {
    "part": 2,
    "index": 13,
    "default": false,
    "output": "output7/subtitle_13_ger.srt",
    "language": "ger",
    "title": "German",
    "codec": "srt"
  },
  {
    "part": 2,
    "index": 14,
    "default": false,
    "output": "output7/subtitle_14_gre.srt",
    "language": "gre",
    "title": "Greek",
    "codec": "srt"
  },
  {
    "part": 2,
    "index": 15,
    "default": false,
    "output": "output7/subtitle_15_heb.srt",
    "language": "heb",
    "title": "Hebrew",
    "codec": "srt"
  },
  {
    "part": 2,
    "index": 16,
    "default": false,
    "output": "output7/subtitle_16_hun.srt",
    "language": "hun",
    "title": "Hungarian",
    "codec": "srt"
  },
  {
    "part": 2,
    "index": 17,
    "default": false,
    "output": "output7/subtitle_17_ind.srt",
    "language": "ind",
    "title": "Indonesian",
    "codec": "srt"
  },
  {
    "part": 2,
    "index": 18,
    "default": false,
    "output": "output7/subtitle_18_ita.srt",
    "language": "ita",
    "title": "Italian",
    "codec": "srt"
  },
  {
    "part": 2,
    "index": 19,
    "default": false,
    "output": "output7/subtitle_19_jpn.srt",
    "language": "jpn",
    "title": "Japanese",
    "codec": "srt"
  },
  {
    "part": 2,
    "index": 20,
    "default": false,
    "output": "output7/subtitle_20_kor.srt",
    "language": "kor",
    "title": "Korean",
    "codec": "srt"
  },
  {
    "part": 2,
    "index": 21,
    "default": false,
    "output": "output7/subtitle_21_may.srt",
    "language": "may",
    "title": "Malay",
    "codec": "srt"
  },
  {
    "part": 2,
    "index": 22,
    "default": false,
    "output": "output7/subtitle_22_nor.srt",
    "language": "nor",
    "title": "Norwegian Bokmal",
    "codec": "srt"
  },
  {
    "part": 2,
    "index": 23,
    "default": false,
    "output": "output7/subtitle_23_pol.srt",
    "language": "pol",
    "title": "Polish",
    "codec": "srt"
  },
  {
    "part": 2,
    "index": 24,
    "default": false,
    "output": "output7/subtitle_24_por.srt",
    "language": "por",
    "title": "Portuguese",
    "codec": "srt"
  },
  {
    "part": 2,
    "index": 25,
    "default": false,
    "output": "output7/subtitle_25_por.srt",
    "language": "por",
    "title": "Brazilian Portuguese",
    "codec": "srt"
  },
  {
    "part": 2,
    "index": 26,
    "default": false,
    "output": "output7/subtitle_26_rum.srt",
    "language": "rum",
    "title": "Romanian",
    "codec": "srt"
  },
  {
    "part": 2,
    "index": 27,
    "default": false,
    "output": "output7/subtitle_27_rus.srt",
    "language": "rus",
    "title": "Russian",
    "codec": "srt"
  },
  {
    "part": 2,
    "index": 28,
    "default": false,
    "output": "output7/subtitle_28_spa.srt",
    "language": "spa",
    "title": "Spanish",
    "codec": "srt"
  },
  {
    "part": 2,
    "index": 29,
    "default": false,
    "output": "output7/subtitle_29_spa.srt",
    "language": "spa",
    "title": "European Spanish",
    "codec": "srt"
  },
  {
    "part": 2,
    "index": 30,
    "default": false,
    "output": "output7/subtitle_30_swe.srt",
    "language": "swe",
    "title": "Swedish",
    "codec": "srt"
  },
  {
    "part": 2,
    "index": 31,
    "default": false,
    "output": "output7/subtitle_31_tha.srt",
    "language": "tha",
    "title": "Thai",
    "codec": "srt"
  },
  {
    "part": 2,
    "index": 32,
    "default": false,
    "output": "output7/subtitle_32_tur.srt",
    "language": "tur",
    "title": "Turkish",
    "codec": "srt"
  },
  {
    "part": 2,
    "index": 33,
    "default": false,
    "output": "output7/subtitle_33_ukr.srt",
    "language": "ukr",
    "title": "Ukrainian",
    "codec": "srt"
  },
  {
    "part": 2,
    "index": 34,
    "default": false,
    "output": "output7/subtitle_34_vie.srt",
    "language": "vie",
    "title": "Vietnamese",
    "codec": "srt"
  }]

export const VideoPlayer = () => {
    
  return (
    <div className="aspect-video bg-black mb-4 rounded-lg overflow-hidden">
      <Vidstack
        // src="http://100.85.36.39:5500/output7/master.m3u8"
        src="http://100.85.36.39:5500/output7/master.m3u8"
        // http://localhost:4568/test-video-bucket/transcoded/test/master.m3u8
        title="GENIUS Uses SECRET Alchemy To Craft S Rank HOMUNCULUS Girls To Get REVENGE! - Manhwa Recap GENIUS Uses SECRET Alchemy To Craft S Rank HOMUNCULUS Girls To Get REVENGE! - Manhwa Recap Red notice"
        poster="https://files.vidstack.io/sprite-fight/poster.webp"
        storyboard="http://100.85.36.39:5500/output7/storyboard.vtt"
      subtitles={[
        {
          src: "http://100.85.36.39:5500/output4/sub1.vtt",
          label: "English",
          language: "en",
          type: "vtt",
          default: true,
        },
        {
          src: "http://100.85.36.39:5500/output7/subtitle_0_eng.srt",
          label: "English srt",
          language: "en",
          type: "srt",
        },
        {
          src: "http://100.85.36.39:5500/output4/sub2.vtt",
          label: "Arabic",
          type: "vtt",
          language: "ara",
        },
      ]}
      // subtitles={subtitles.map((subtitle) => ({
      //   label: subtitle.title,
      //   language: `${subtitle.language} ${subtitle.index}`,
      //   src: `http://localhost:5500/${subtitle.output}`,
      //   default: subtitle.default,
      //   type: subtitle.codec,
      // }))}
      />
    </div>
  )
}
