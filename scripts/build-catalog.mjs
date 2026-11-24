/**
 * SONORA — catalog builder
 * Generates the full music catalogue (artists, albums, tracks, playlists,
 * podcasts, genres) plus generative artwork, and emits a typed TS module.
 *
 * Audio: royalty-free / CC-BY recordings from Kevin MacLeod (incompetech.com)
 * and SoundHelix, measured for real duration. See /about/licensing.
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { coverSvg, avatarSvg } from './generate-art.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const audioMeta = JSON.parse(readFileSync(join(root, 'scripts', 'audio-meta.json'), 'utf8'))

/* ------------------------------------------------------------------ */
/* Deterministic pseudo-random                                        */
/* ------------------------------------------------------------------ */
function hashStr(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
function mulberry(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const pick = (rnd, arr) => arr[Math.floor(rnd() * arr.length)]

/* ------------------------------------------------------------------ */
/* Audio pool                                                          */
/* ------------------------------------------------------------------ */
const AUDIO = audioMeta
  .filter((a) => a.dur > 30)
  .map((a) => ({
    name: a.name,
    duration: Math.round(a.dur),
    url: a.name.startsWith('SoundHelix')
      ? `https://www.soundhelix.com/examples/mp3/${a.name}.mp3`
      : `https://incompetech.com/music/royalty-free/mp3-royaltyfree/${encodeURIComponent(a.name)}.mp3`,
  }))
  .sort((a, b) => hashStr(a.name) - hashStr(b.name))

const AUDIO_INDEX = new Map(AUDIO.map((a, i) => [a.name, i]))

/* ------------------------------------------------------------------ */
/* Title pools                                                         */
/* ------------------------------------------------------------------ */
const TITLES = {
  Telugu: `Vennello|Nee Kosam|Kanula Thotalo|Meghamala|Oohalu|Prema Parichayam|Chinnari|Snehamera|Nuvvu Naku|Manasuna|Vachinde|Yemaindo|Nee Ventene|Poola Rangulu|Chilakamma|Kotha Kotha|Nannu Vidachi|Aakasam|Dochey|Bujji|Sarigama|Nee Pai|Kanukanedu|Mounam|Tholi Sandhya|Velugu|Anaganaga|Yedalo|Ninnu Chudaka|Nee Chitram|Mabbulo|Gundello|Naa Priyam|Chukkalu|Nee Venaka|Kanupapalu|Priya|Snehithuda|Naa Hrudayam|Mounamga|Velugulo|Ninnu Nenu|Aakasam Lo|Chinuku|Naa Kanulalo|Malligey|Nee Kalla|O Prema|Manasu|Naa Pranam|Sagarangale|Nee Sontham|Naa Maata|Teliyadu|Yemaya|Naa Deva|Cheliya|Ninnu|Nee Pai Nenu|Gunde|Hrudayam|Naa Kanulu|Chelimoota|Oohalo|Nee Vennela|Kotha Kopam|Nee Paruvam|Sneha Gaanam|Aakasam Nee|Naa Jagame|Chitti|Nee Roopam|Kannulalo|Vennelalo|Nee Kosamu|Prema Tho|Naa Swasa|Yedure|Nee Vala|Kanulatho|Manasuna Nee|Nee Geetham|O Cheli|Nee Sandhya|Nee Praanam`.split('|'),
  Hindi: `Saansein|Raat Ki Rani|Dil Ki Baat|Khamoshi|Noor|Safar|Baarishein|Tere Bina|Aarzoo|Chandni|Mohabbat|Yaadein|Khwabon Ka Sheher|Rangreza|Ishq Sufiyana|Tanhaiyan|Badra|Nazara|Suroor|Manzil|Alvida|Zindagi|Do Kadam|Junoon|Meherbaan|Ranjha|Shaam|Kaleerein|Dil Ko Karaar|Pehli Nazar|Bewajah|Siyah|Aasmaan|Khwab|Mausam|Chashni|Raat|Dua|Jag Ghoomeya|Naina|Saawan|Kiara|Mohabbat Hai|Ishq|Deewana|Bekhabar|Zulfein|Aankhein|Kajra|Saans|Dhadkan|Rooh|Dilruba|Shayari|Mehfil|Tarana|Sargam|Raag|Albela|Sajan|Piya|Sanam|Jaaneman|Humsafar|Safar Hai|Dil Hai|Roke Na Ruke|Namo|Bol Do|Tera Mera|Humdard|Ishq Mubarak|Aankhon Mein|Chand Ki|Dilruba Hai|Raat Bhar|Neend Nahi|Baithi Hoon|Tu Hi|Kuch Kaha|Yeh Lamha|Dil Ki Dastak|Khwabida|Sang Hoon|Nazara Tera|Mausam Ki|Baarish Ki|Boondein|Fariyaad|Ik Lamha|Kuch Khaas|Tere Ishq Mein|Dil Ke Dariya`.split('|'),
  English: `Golden Hour|Midnight Drive|Paper Planes|City Lights|Waves|Slow Motion|Neon Rain|Afterglow|Gravity|Silhouette|Echo Chamber|Daydream|Fever Dream|Hollow|Stargazing|Wildfire|Runaway|Polaroid|Ocean Eyes|Silver Lining|Highway 9|Fading|Aurora|Lullaby|Dusk|Paradise|Undertow|Satellite|Circles|Bloom|Chasing Light|Velvet|Ghost|Static|Gasoline|Tidal Wave|Summer Rain|Cold Coffee|Amber|Nightfall|Dive|Honey|Glass|Magnetic|Reverie|Numb|Wanderlust|Blue Hour|Horizon|Mirage|Solstice|Firefly|Slow Burn|Echoes|Falling Up|Outer Space|Heartbeat|Lover|Raincoat|Soft Focus|Teeth|Violet|Wildflower|Where We Begin|Almost Home|Paper Moon|Naked|Sweet Nothings|Tattoo|Close|Before You|Other Side|Satellite Heart|White Noise|Cherry Wine|Low Light|Eighteen|Crossroads|Open Sky|Tin Roof|Copper|Gasoline Dream|Lavender|Northbound|Small Hours|Tin Heart|Borrowed Time|Last Light|Golden|Slower|Wild Ones`.split('|'),
  Tamil: `Kanmani|Mazhai Varum|Nee Yaro|Kadhal Rojave|Vennilavu|Thendral|Poo Malarnthidu|Sollathe|Aval Parithu|Kanavellam|Nesipaya|Uyire|Mounam Pesum|Kanne Kalaimaane|Rasaali|Maruvaarthai|Thalli Pogathey|Kannazhaga|Po Nee Po|Yennai Maatrum|Kathirundhen|Vizhiyil|Sotta Sotta|Mudhal Murai|Idhu Enna|Kadhal Vaipogame|Vennilavo|Aalaporan|Othaiyila|Manasellam|Thirumbi|En Kadhal Solla|Neeyum Naanum|Kanave Kanave|Poda Podi|Mannipaaya|Kannukkul|Thuli Thuli|Nenjil|Anbe Anbe|Kadhal Sadugudu|Mun Andhi|Yaar Indha|Nee Paartha|Vellai Pura Ondru|Anbil Avan|En Kadhal|Kanmani Anbodu|Muthu Muthu|Pachai Kili|Kaatrinile|Aasai|Vanna Vanna|Sollividu|Kanne|Thendral Varum|Nee Enge|Kadhal Kirukan|Vaadi|Malli|Poojai|Thaai|Uyir|Sagam|Nesam|Innum|Kanavu|Sempozhudu|Nizhal|Megam|Vaanam|Kathir|Vellai|Mounam|Kanavugal|Nee Sonna|Piriyaadhe|Kadhal Kavithai|Thenralae|Vennilave|Nee Illai|Thedal|Sollathe Sol|Uyire Uyire|Kanmaniyae|Kathalae|Nanban`.split('|'),
}

/* ------------------------------------------------------------------ */
/* Original lyric suites (romanised + native script)                   */
/* ------------------------------------------------------------------ */
const LYRICS = {
  Telugu: [
    ['నీ కళ్ళలో చెలిమె నా కథ', 'వెన్నెల్లో నీ పేరు చెప్పాను', 'గుండె జాబిల్లి కింద నిలబడి', 'నీ వెన్న నా ఉసురు అయింది', 'నీ వెన్న నా ఉసురు అయింది'],
    ['మనసులో మేఘం కురిసింది', 'చినుకుల నడుమ నీ గురింతం', 'తడిసిన కాగితం లాగా', 'మా మాటలు కరిగిపోయాయి', 'మా మాటలు కరిగిపోయాయి'],
    ['నిశ్శబ్దంగా ఉన్న ఈ రాత్రి', 'నీ గుసగుసలో నిదుర పోయింది', 'చుక్కల్లో నీ ప్రతిరూపం', 'నా కలలో కొత్త ఉదయం', 'నా కలలో కొత్త ఉదయం'],
    ['ఊరి చివర ఆ తాటి చెట్టు', 'నీ నవ్వు నాకు గుర్తు చేసే', 'అమ్మ చేతి వాసన కలిగిన', 'ఈ మట్టి నా కథ చెబుతుంది', 'ఈ మట్టి నా కథ చెబుతుంది'],
    ['చీకటి అంతా పోయిన తర్వాత', 'వెలుగు ఒక కొత్త పాట పాడుతుంది', 'నడిచే నా అడుగుల వెనుక', 'ఆకాశం కూడా నడుస్తుంది', 'ఆకాశం కూడా నడుస్తుంది'],
    ['నీలో పోయిన నా ప్రశ్నలు', 'ఇప్పుడు ఈ గాలిలో తేలుతున్నాయి', 'మాట్లాడలేని ఈ దూరం', 'నా గుండెలో కొత్త పాటైంది', 'నా గుండెలో కొత్త పాటైంది'],
    ['గాలికి తగిలిన ఆకులాగా', 'నా మనసు నీ వైపే ఎగిసింది', 'అంచున నిలబడి నీ పేరు', 'రాత్రి అంతా నా పాటైంది', 'రాత్రి అంతా నా పాటైంది'],
    ['నీ కళ్ళ జ్యోతి నా దారి', 'చీకట్లో కూడా వెలుగు నీదే', 'ఊహల లోకం నీ చుట్టూ', 'నా ప్రతి మాట నీదే', 'నా ప్రతి మాట నీదే'],
  ],
  Hindi: [
    ['तेरी सांसों में मेरी सुबह है', 'खामोशी भी अब गवाह है', 'नूर तेरा चाँदनी से कहता है', 'दिल की बात अधूरी सी रह गई', 'दिल की बात अधूरी सी रह गई'],
    ['बारिशों में तेरा इंतज़ार है', 'हर बूँद में एक ज़िक्र यार का', 'रात जागे हैं हम तेरे ख़्वाब में', 'सुबह होते ही ख़्वाब बिखर गए', 'सुबह होते ही ख़्वाब बिखर गए'],
    ['सूफ़ी हूँ मैं तेरे इश्क़ में', 'रंग भी तेरे रूह में बसे', 'महफ़िल में अब तेरा ज़िक्र है', 'दर्द भी मीठा लगने लगा', 'दर्द भी मीठा लगने लगा'],
    ['घर की वह छत, वो आँगन याद आता है', "माँ की आवाज़ अब भी सुनाई देती है", 'जो छूट गया वो फिर नहीं मिलता', 'पर फिर भी दिल वहीं रहता है', 'पर फिर भी दिल वहीं रहता है'],
    ['सफ़र ये लंबा है साथी', 'मंज़िल अभी दूर कहीं है', 'चलते रहो तो रास्ते खुलेंगे', 'हर डगर पे नया गीत होगा', 'हर डगर पे नया गीत होगा'],
    ['तन्हाई में अब तेरा साथ है', 'यादों का एक काफ़िला है', 'जो बीत गया उसको छोड़ दो', 'आज की रात नया सवेरा है', 'आज की रात नया सवेरा है'],
    ['चाँदनी बिखरी है तेरे आँगन में', 'हर तारा अब गवाह है मेरा', 'तू जो मिल गया तो मुझे', 'पूरी कायनात मिल गई', 'पूरी कायनात मिल गई'],
    ['शहर की इन भीड़भाड़ में', 'तेरा नाम ही मेरा पता है', 'जहाँ तू वहीं मेरा घर', 'तेरे बिन कहीं ठिकाना नहीं', 'तेरे बिन कहीं ठिकाना नहीं'],
  ],
  English: [
    ["I've been running through the silver hours", 'Chasing every echo that you left behind', 'Golden light is spilling through the curtains', "And I'm learning how to leave the past behind", "And I'm learning how to leave the past behind"],
    ['Midnight on the freeway, radio low', 'Every mile marker spells your name', 'I keep the windows down to feel the cold', "'Cause the silence here is louder than the rain", "'Cause the silence here is louder than the rain"],
    ['You were neon in a city full of grey', 'A fever dream I never woke from', 'Now the afterglow is fading slow', "And I'm still dancing to a song that's gone", "And I'm still dancing to a song that's gone"],
    ['We were young and made of summer', 'Paper plans and ocean eyes', 'Now the leaves are turning amber', "And I'm still surprised we said goodbye", "And I'm still surprised we said goodbye"],
    ['Take me somewhere the signal fades', 'Where the only light is what we make', "I don't need a map or a reason", 'Just your hand and the open dark', 'Just your hand and the open dark'],
    ['Every word I never said', 'Is a shadow on the wall', 'I keep the radio on at night', "So the quiet doesn't call", "So the quiet doesn't call"],
    ['There is a room inside my head', 'Where you never left at all', 'I set the table for a ghost', 'And I dance with the empty hall', 'And I dance with the empty hall'],
    ['Slow down, the world is turning fast', 'And we are only here a while', 'Hold the moment in your hands', "Like sunlight through a window pane", "Like sunlight through a window pane"],
  ],
  Tamil: [
    ['கண்மணி நீ என் கனவு', 'மழை வரும் நேரம் போல', 'உயிரே உன் பெயர் சொல்லும்', 'இதயம் உன்னை நினைக்கும்', 'இதயம் உன்னை நினைக்கும்'],
    ['வெண்ணிலவு நீ வந்தாய்', 'என் வானம் வெளிச்சமானது', 'கடல் அலைகள் போலே', 'உன் நினைவுகள் வந்து போகின்றன', 'உன் நினைவுகள் வந்து போகின்றன'],
    ['தென்றல் வரும் மாலையிலே', 'உன் குரல் எனக்குக் கேட்குது', 'மௌனம் பேசும் இந்த நேரம்', 'என் கவிதை உன்னைத் தேடுது', 'என் கவிதை உன்னைத் தேடுது'],
    ['ஊர் திரும்பி வந்தபோது', 'அம்மா கை சமையல் வாசனை', 'அந்த வீட்டு வாசலிலே', 'என் சிறுப்பம் இன்னும் நிற்குது', 'என் சிறுப்பம் இன்னும் நிற்குது'],
    ['இருட்டு மறைந்து விட்டது', 'விடியல் ஒரு புது பாடல்', 'நடக்கும் என் அடிகளுக்கு', 'வானமும் கூட நடக்குது', 'வானமும் கூட நடக்குது'],
    ['உன்னை இழந்த என் கேள்விகள்', 'இப்போது காற்றில் மிதக்கின்றன', 'பேச முடியாத இந்த தூரம்', 'என் நெஞ்சில் புது பாடல்', 'என் நெஞ்சில் புது பாடல்'],
    ['காதல் ஒரு கடிதம் போல', 'எழுதாமலே போய்விட்டது', 'அஞ்சலி கடைசி வரி', 'என் கைகளில் மிதக்கிறது', 'என் கைகளில் மிதக்கிறது'],
    ['விழிகள் மூடும் நேரம்', 'நீ மட்டுமே நினைவில்', 'கனவுகள் ஒவ்வொன்றும்', 'உன் பெயரை சொல்லும்', 'உன் பெயரை சொல்லும்'],
  ],
}

/* ------------------------------------------------------------------ */
/* Artists                                                             */
/* ------------------------------------------------------------------ */
const ARTIST_DEFS = [
  {
    id: 'aarav-rao', name: 'Aarav Rao', language: 'Telugu', genre: 'Indie Pop', hometown: 'Hyderabad',
    bio: 'Aarav Rao writes songs the way people remember them — in fragments of monsoon light, half-finished sentences and long bus rides across the Deccan. After cutting his teeth playing college festivals in Hyderabad, his 2021 debut EP Nee Kosam became a word-of-mouth phenomenon, and 2023’s Vennello turned him into one of the most streamed independent voices in Telugu music.',
    genres: ['Indie Pop', 'Singer-Songwriter', 'Telugu Indie'], listeners: 1420000, followers: 812000, debut: 2019,
    albums: [
      { id: 'vennello', title: 'Vennello', year: 2023, type: 'album', tracks: 10 },
      { id: 'nee-kosam', title: 'Nee Kosam', year: 2021, type: 'ep', tracks: 6 },
    ],
  },
  {
    id: 'dev-nandan', name: 'Dev Nandan', language: 'Telugu', genre: 'Film Score', hometown: 'Chennai',
    bio: 'A composer who treats silence as an instrument, Dev Nandan has scored some of the most quietly devastating moments in recent Telugu cinema. Classically trained in Carnatic violin and obsessed with analog synthesisers, his records sit somewhere between a film soundtrack and a late-night fever dream.',
    genres: ['Film Score', 'Ambient', 'World'], listeners: 980000, followers: 402000, debut: 2016,
    albums: [
      { id: 'meghamala', title: 'Meghamala', year: 2022, type: 'album', tracks: 9 },
      { id: 'chinnari', title: 'Chinnari', year: 2024, type: 'album', tracks: 9 },
    ],
  },
  {
    id: 'sreeja-valli', name: 'Sreeja Valli', language: 'Telugu', genre: 'Playback', hometown: 'Vijayawada',
    bio: 'Born into a family of Carnatic vocalists in Vijayawada, Sreeja Valli carries three generations of rhythm in her voice. She is one of the most in-demand playback singers in Telugu cinema, equally at home with a 70-piece orchestra or a single acoustic guitar.',
    genres: ['Playback', 'Carnatic Fusion', 'Pop'], listeners: 2140000, followers: 1240000, debut: 2014,
    albums: [
      { id: 'snehamera', title: 'Snehamera', year: 2023, type: 'album', tracks: 10 },
      { id: 'kanula-thotalo', title: 'Kanula Thotalo', year: 2021, type: 'single', tracks: 3 },
    ],
  },
  {
    id: 'rohan-kishore', name: 'Rohan Kishore', language: 'Telugu', genre: 'Singer-Songwriter', hometown: 'Visakhapatnam',
    bio: 'Rohan Kishore grew up on a diet of Ilaiyaraaja cassettes and Nirvana bootlegs, and it shows. His songs are diaries set to fingerpicked guitar — unpolished, funny, heartbroken and completely unafraid of being honest.',
    genres: ['Singer-Songwriter', 'Indie Folk', 'Acoustic'], listeners: 640000, followers: 288000, debut: 2020,
    albums: [
      { id: 'bujji', title: 'Bujji', year: 2022, type: 'ep', tracks: 6 },
      { id: 'naa-hrudayam', title: 'Naa Hrudayam', year: 2024, type: 'album', tracks: 9 },
    ],
  },
  {
    id: 'kabir-malhotra', name: 'Kabir Malhotra', language: 'Hindi', genre: 'Bollywood Pop', hometown: 'Mumbai',
    bio: 'Kabir Malhotra is the kind of songwriter who writes a hook on the back of a rickshaw receipt and turns it into a stadium anthem four months later. With three chart-topping records and a shelf of film credits, he has become the sound of contemporary Hindi pop — glossy, romantic and relentlessly melodic.',
    genres: ['Bollywood Pop', 'Pop', 'Romantic'], listeners: 3860000, followers: 2210000, debut: 2013,
    albums: [
      { id: 'noor', title: 'Noor', year: 2023, type: 'album', tracks: 11 },
      { id: 'suroor', title: 'Suroor', year: 2021, type: 'album', tracks: 9 },
    ],
  },
  {
    id: 'zoya-ansari', name: 'Zoya Ansari', language: 'Hindi', genre: 'Sufi Electronic', hometown: 'Delhi',
    bio: 'Zoya Ansari sings qawwali over modular synthesisers and somehow makes it feel inevitable. Trained in Hindustani classical music, she builds songs out of old poetry, new machines and a voice that can move from a whisper to a wail in a single breath.',
    genres: ['Sufi', 'Electronic', 'Hindustani'], listeners: 1540000, followers: 903000, debut: 2017,
    albums: [
      { id: 'aarzoo', title: 'Aarzoo', year: 2024, type: 'album', tracks: 10 },
      { id: 'rangreza', title: 'Rangreza', year: 2022, type: 'ep', tracks: 6 },
    ],
  },
  {
    id: 'ritika-sen', name: 'Ritika Sen', language: 'Hindi', genre: 'Indie Folk', hometown: 'Kolkata',
    bio: 'Ritika Sen writes folk songs about ordinary people in extraordinary detail — the tea stall owner, the girl on the 6 a.m. local, the grandmother who never learned to swim. Her records sound like they were recorded in a single room, because most of them were.',
    genres: ['Indie Folk', 'Acoustic', 'Hindi Indie'], listeners: 880000, followers: 468000, debut: 2018,
    albums: [
      { id: 'yaadein', title: 'Yaadein', year: 2023, type: 'album', tracks: 10 },
      { id: 'mausam', title: 'Mausam', year: 2021, type: 'ep', tracks: 6 },
    ],
  },
  {
    id: 'vivaan-shah', name: 'Vivaan Shah', language: 'Hindi', genre: 'Electronic', hometown: 'Bengaluru',
    bio: 'A producer who treats the dancefloor as an instrument, Vivaan Shah has remixed everyone from film composers to ghazal legends. His sets move between Bollywood samples, UK bass and pure synth noise — held together by an obsessive ear for a bassline.',
    genres: ['Electronic', 'Dance', 'Remix'], listeners: 1260000, followers: 634000, debut: 2019,
    albums: [
      { id: 'neon-rang', title: 'Neon Rang', year: 2024, type: 'album', tracks: 10 },
      { id: 'basanti-bass', title: 'Basanti Bass', year: 2022, type: 'ep', tracks: 5 },
    ],
  },
  {
    id: 'elias-vance', name: 'Elias Vance', language: 'English', genre: 'Synthwave', hometown: 'Berlin',
    bio: 'Elias Vance makes music for the hour when the city goes quiet and the streetlights take over. A classically trained pianist who traded the concert hall for a room full of dusty Juno synthesisers, his records are slow-burning, cinematic and unapologetically nostalgic.',
    genres: ['Synthwave', 'Electronic', 'Ambient'], listeners: 2740000, followers: 1610000, debut: 2015,
    albums: [
      { id: 'midnight-drive', title: 'Midnight Drive', year: 2023, type: 'album', tracks: 11 },
      { id: 'chrome-hearts', title: 'Chrome Hearts', year: 2021, type: 'ep', tracks: 6 },
    ],
  },
  {
    id: 'nova-reyes', name: 'Nova Reyes', language: 'English', genre: 'Alt Pop', hometown: 'Los Angeles',
    bio: 'Nova Reyes writes pop songs that feel like a secret told at full volume. Raised between Los Angeles and Mexico City, she threads Spanish guitars, industrial drums and lyrics about wanting things you cannot name into music that is both enormous and uncomfortably intimate.',
    genres: ['Alt Pop', 'Electropop', 'Indie'], listeners: 3290000, followers: 1950000, debut: 2018,
    albums: [
      { id: 'afterglow', title: 'Afterglow', year: 2024, type: 'album', tracks: 11 },
      { id: 'static-bloom', title: 'Static Bloom', year: 2022, type: 'ep', tracks: 6 },
    ],
  },
  {
    id: 'cassian-blake', name: 'Cassian Blake', language: 'English', genre: 'Indie Folk', hometown: 'Portland',
    bio: 'Cassian Blake spent a decade playing in other people’s bands before making a record of his own. Written in a rented cabin in the Pacific Northwest, his songs are patient, weathered and full of the specific sadness of a place you have left but never quite stopped loving.',
    genres: ['Indie Folk', 'Americana', 'Acoustic'], listeners: 1120000, followers: 587000, debut: 2012,
    albums: [
      { id: 'paper-moon', title: 'Paper Moon', year: 2023, type: 'album', tracks: 10 },
      { id: 'tin-roof', title: 'Tin Roof', year: 2021, type: 'album', tracks: 9 },
    ],
  },
  {
    id: 'ivy-laurent', name: 'Ivy Laurent', language: 'English', genre: 'R&B', hometown: 'London',
    bio: 'Ivy Laurent grew up on gospel choirs in South London and never lost the habit of singing like the room is listening. Her music is warm, unhurried R&B — built on live bass, tape saturation and lyrics that treat tenderness as a form of courage.',
    genres: ['R&B', 'Soul', 'Neo-Soul'], listeners: 1980000, followers: 1150000, debut: 2016,
    albums: [
      { id: 'honey-glass', title: 'Honey & Glass', year: 2024, type: 'album', tracks: 10 },
      { id: 'velvet-hours', title: 'Velvet Hours', year: 2022, type: 'ep', tracks: 6 },
    ],
  },
  {
    id: 'meera-nair', name: 'Meera Nair', language: 'Tamil', genre: 'Playback', hometown: 'Chennai',
    bio: 'Meera Nair has one of the most recognisable voices in Tamil cinema — luminous, precise and capable of carrying an entire scene on a single held note. Beyond playback she records independent albums that draw on her training in both Carnatic and Western classical traditions.',
    genres: ['Playback', 'Carnatic', 'Tamil Pop'], listeners: 2610000, followers: 1490000, debut: 2013,
    albums: [
      { id: 'kanmani', title: 'Kanmani', year: 2023, type: 'album', tracks: 10 },
      { id: 'mazhai', title: 'Mazhai', year: 2021, type: 'album', tracks: 9 },
    ],
  },
  {
    id: 'ilaiya-krishnan', name: 'Ilaiya Krishnan', language: 'Tamil', genre: 'Fusion', hometown: 'Madurai',
    bio: 'A multi-instrumentalist with an almost indecent command of rhythm, Ilaiya Krishnan has spent thirty years building bridges between thavil, mridangam, jazz drums and modular electronics. His albums are recorded live to two-inch tape, in a single continuous take.',
    genres: ['Fusion', 'World', 'Jazz'], listeners: 720000, followers: 341000, debut: 1994,
    albums: [
      { id: 'laya', title: 'Laya', year: 2022, type: 'album', tracks: 9 },
      { id: 'thaal', title: 'Thaal', year: 2024, type: 'album', tracks: 9 },
    ],
  },
  {
    id: 'ananya-iyer', name: 'Ananya Iyer', language: 'Tamil', genre: 'Dream Pop', hometown: 'Coimbatore',
    bio: 'Ananya Iyer makes dream pop out of monsoon air and borrowed memory. She records most of her vocals in a single take, late at night, with the windows open — and you can hear the rain in nearly every song she has ever released.',
    genres: ['Dream Pop', 'Shoegaze', 'Indie'], listeners: 930000, followers: 512000, debut: 2020,
    albums: [
      { id: 'blue-hour', title: 'Blue Hour', year: 2024, type: 'album', tracks: 10 },
      { id: 'nizhal', title: 'Nizhal', year: 2022, type: 'ep', tracks: 6 },
    ],
  },
  {
    id: 'vetri-maaran', name: 'Vetri Maaran', language: 'Tamil', genre: 'Hip Hop', hometown: 'Chennai',
    bio: 'Vetri Maaran raps in Tamil about the city he grew up in — its autorickshaws, its rain, its stubborn tenderness. After years of underground mixtapes, his 2023 album Vaanam became the first independent Tamil hip-hop record to cross a hundred million streams.',
    genres: ['Hip Hop', 'Tamil Rap', 'Trap'], listeners: 1680000, followers: 971000, debut: 2018,
    albums: [
      { id: 'vaanam', title: 'Vaanam', year: 2023, type: 'album', tracks: 11 },
      { id: 'kathir', title: 'Kathir', year: 2021, type: 'mixtape', tracks: 8 },
    ],
  },
]

/* ------------------------------------------------------------------ */
/* Genre taxonomy                                                      */
/* ------------------------------------------------------------------ */
const GENRE_DEFS = [
  { id: 'pop', name: 'Pop', tag: 'Pop', description: 'Big hooks, bright lights. The songs that refuse to leave your head.', gradient: 'from-violet-500/40 to-fuchsia-500/10' },
  { id: 'indie', name: 'Indie', tag: 'Indie', description: 'Independent voices from Hyderabad to Portland, recorded in bedrooms and garages.', gradient: 'from-emerald-500/40 to-teal-500/10' },
  { id: 'electronic', name: 'Electronic', tag: 'Electronic', description: 'Synthesisers, sub-bass and the sound of a city after midnight.', gradient: 'from-cyan-500/40 to-blue-500/10' },
  { id: 'hip-hop', name: 'Hip-Hop', tag: 'Hip Hop', description: 'Bars, beats and stories from the street up.', gradient: 'from-orange-500/40 to-amber-500/10' },
  { id: 'rnb', name: 'R&B & Soul', tag: 'R&B', description: 'Warm basslines, honest words and voices that make a room go quiet.', gradient: 'from-rose-500/40 to-pink-500/10' },
  { id: 'folk', name: 'Folk & Acoustic', tag: 'Indie Folk', description: 'Songs played on real instruments for real people.', gradient: 'from-lime-500/35 to-green-500/10' },
  { id: 'soundtrack', name: 'Soundtrack', tag: 'Film Score', description: 'Scores that carry entire scenes on a single held note.', gradient: 'from-indigo-500/40 to-violet-500/10' },
  { id: 'sufi', name: 'Sufi & Ghazal', tag: 'Sufi', description: 'Poetry, devotion and voices that have been passed down for centuries.', gradient: 'from-amber-500/40 to-orange-500/10' },
  { id: 'dream-pop', name: 'Dream Pop', tag: 'Dream Pop', description: 'Hazy guitars, soft focus and songs that feel like half-remembered rain.', gradient: 'from-sky-500/40 to-cyan-500/10' },
  { id: 'synthwave', name: 'Synthwave', tag: 'Synthwave', description: 'Neon, chrome and nostalgia for a decade you may not have lived through.', gradient: 'from-purple-500/40 to-indigo-500/10' },
  { id: 'playback', name: 'Playback', tag: 'Playback', description: 'The voices behind the biggest moments in Indian cinema.', gradient: 'from-red-500/40 to-rose-500/10' },
  { id: 'fusion', name: 'Fusion', tag: 'Fusion', description: 'Carnatic, jazz, folk and electronics — traditions in conversation.', gradient: 'from-teal-500/40 to-emerald-500/10' },
]

/* ------------------------------------------------------------------ */
/* Playlists                                                           */
/* ------------------------------------------------------------------ */
const PLAYLIST_DEFS = [
  { id: 'today-top-hits', name: "Today's Top Hits", description: 'The biggest songs in the world, updated every Friday.', curator: 'SONORA', mood: 'energetic', languages: ['English'] },
  { id: 'top-telugu-hits', name: 'Top Telugu Hits', description: 'The sounds dominating Andhra and Telangana right now.', curator: 'SONORA', mood: 'energetic', languages: ['Telugu'] },
  { id: 'hindi-hits', name: 'Hindi Hits', description: 'Bollywood, indie and everything in between.', curator: 'SONORA', mood: 'romantic', languages: ['Hindi'] },
  { id: 'english-hits', name: 'English Hits', description: 'Global pop, alt and R&B — the songs everyone is playing.', curator: 'SONORA', mood: 'energetic', languages: ['English'] },
  { id: 'tamil-hits', name: 'Tamil Hits', description: 'Kollywood to Coimbatore — the best of Tamil music.', curator: 'SONORA', mood: 'energetic', languages: ['Tamil'] },
  { id: 'chill-vibes', name: 'Chill Vibes', description: 'Slow it all the way down. Nothing here is in a hurry.', curator: 'SONORA', mood: 'chill', languages: ['English', 'Hindi', 'Tamil', 'Telugu'] },
  { id: 'deep-focus', name: 'Deep Focus', description: 'Instrumental textures for the hours that need your full attention.', curator: 'SONORA', mood: 'focus', languages: ['English', 'Tamil', 'Hindi'] },
  { id: 'late-night-drive', name: 'Late Night Drive', description: 'Empty roads, neon reflections and the radio turned low.', curator: 'SONORA', mood: 'chill', languages: ['English', 'Hindi', 'Tamil', 'Telugu'] },
  { id: 'monsoon-melodies', name: 'Monsoon Melodies', description: 'The first rain, a hot cup of chai and a song you know by heart.', curator: 'SONORA', mood: 'romantic', languages: ['Telugu', 'Hindi', 'Tamil'] },
  { id: 'indie-india', name: 'Indie India', description: 'Independent artists rewriting what Indian pop can be.', curator: 'SONORA', mood: 'chill', languages: ['Hindi', 'Tamil', 'Telugu', 'English'] },
  { id: 'house-party', name: 'House Party', description: 'Loud, sweaty and absolutely no ballads until 2 a.m.', curator: 'SONORA', mood: 'party', languages: ['Hindi', 'English', 'Tamil', 'Telugu'] },
  { id: 'lofi-study', name: 'Lo-Fi Study', description: 'Beats to relax and finish your work to.', curator: 'SONORA', mood: 'focus', languages: ['English', 'Tamil'] },
  { id: 'throwback-2010s', name: 'Throwback 2010s', description: 'The songs that defined a decade of playlists.', curator: 'SONORA', mood: 'nostalgic', languages: ['Hindi', 'English', 'Tamil', 'Telugu'] },
  { id: 'romantic-evenings', name: 'Romantic Evenings', description: 'For the last hour of daylight and everything that follows.', curator: 'SONORA', mood: 'romantic', languages: ['Hindi', 'Telugu', 'English', 'Tamil'] },
  { id: 'workout', name: 'Beast Mode', description: 'Heavy drums, faster BPM, no excuses.', curator: 'SONORA', mood: 'energetic', languages: ['English', 'Hindi', 'Tamil'] },
]

const MADE_FOR_YOU = [
  { id: 'daily-mix-telugu', name: 'Daily Mix 1', description: 'Telugu indie, film songs and a few surprises.', curator: 'SONORA', mood: 'chill', languages: ['Telugu'] },
  { id: 'daily-mix-hindi', name: 'Daily Mix 2', description: 'Hindi pop and Sufi-electronic, made for your evening.', curator: 'SONORA', mood: 'romantic', languages: ['Hindi'] },
  { id: 'daily-mix-english', name: 'Daily Mix 3', description: 'Alt pop, synthwave and indie folk from your library.', curator: 'SONORA', mood: 'chill', languages: ['English'] },
  { id: 'daily-mix-tamil', name: 'Daily Mix 4', description: 'Tamil hip hop, dream pop and fusion.', curator: 'SONORA', mood: 'energetic', languages: ['Tamil'] },
  { id: 'discover-weekly', name: 'Discover Weekly', description: 'New music picked for you. Updates every Monday.', curator: 'SONORA', mood: 'chill', languages: ['English', 'Hindi', 'Tamil', 'Telugu'] },
  { id: 'on-repeat', name: 'On Repeat', description: 'The songs you have been playing on repeat lately.', curator: 'SONORA', mood: 'chill', languages: ['Telugu', 'Hindi', 'English', 'Tamil'] },
  { id: 'time-capsule', name: 'Time Capsule', description: 'A musical snapshot of a year you almost forgot.', curator: 'SONORA', mood: 'nostalgic', languages: ['Hindi', 'Tamil', 'Telugu', 'English'] },
]

/* ------------------------------------------------------------------ */
/* Podcasts                                                            */
/* ------------------------------------------------------------------ */
const PODCAST_DEFS = [
  { id: 'vinyl-attic', title: 'The Vinyl Attic', host: 'Nikhil Menon', genre: 'Music History', episodes: 5, description: 'Dust off the crates. Every week we dig into one album that changed everything — the outtakes, the arguments in the studio and the moment it finally clicked.' },
  { id: 'late-night-frequencies', title: 'Late Night Frequencies', host: 'Ananya Iyer', genre: 'Producer Interviews', episodes: 5, description: 'Long, unhurried conversations with the people who make the sounds you love. Recorded after midnight, obviously.' },
  { id: 'raag-rhythm', title: 'Raag & Rhythm', host: 'Ilaiya Krishnan', genre: 'Indian Classical', episodes: 4, description: 'A listener’s guide to the grammar of Indian classical music, from the first note of the morning raga to the last thillana of the night.' },
  { id: 'demo-tapes', title: 'Demo Tapes', host: 'Rohan Kishore', genre: 'Indie Spotlight', episodes: 5, description: 'Unreleased songs, bedroom recordings and the stories behind them. Three new artists every week, no gatekeepers.' },
  { id: 'the-mixdown', title: 'The Mixdown', host: 'Vivaan Shah', genre: 'Production', episodes: 4, description: 'Practical, occasionally nerdy advice on writing, recording and finishing music when nobody is paying you to.' },
  { id: 'cinema-sound', title: 'Cinema Sound', host: 'Dev Nandan', genre: 'Film Scores', episodes: 4, description: 'How a film score actually gets made — from the first temp track to the final mix, with the composers who did it.' },
]

const EPISODE_TITLES = [
  'The Room Where It Happened', 'Side A, Track One', 'Everything Is a Reference',
  'The Art of the Fade-Out', 'Recording in Red', 'A Conversation in Twelve Bars',
  'Silence, on Purpose', 'The Second Take', 'Notes from the Cutting Room',
  'What the Microphone Heard', 'Anatomy of a Hook', 'The Last Session',
]

const ALBUM_BLURBS = {
  vennello: 'A record about the year everything changed. Aarav Rao turns monsoon light, long bus rides and a broken heart into ten songs that feel like they were written in your own handwriting.',
  'nee-kosam': 'The debut EP that started it all — six songs recorded in a single room in Hyderabad, on borrowed microphones and very little sleep.',
  meghamala: 'An instrumental score for a film about grief that was never made. Dev Nandan builds entire weather systems out of strings, tape hiss and silence.',
  chinnari: 'A return to melody. Nandan strips his arrangements back to piano, voice and a single sustained synth line, and the result is the most direct music of his career.',
  snehamera: 'Sreeja Valli at full power — ten playback-sized songs that balance classical discipline with pop ambition.',
  'kanula-thotalo': 'A three-track love letter to the songs her grandmother sang, reimagined for a modern arrangement.',
  bujji: 'Six songs about being twenty-two, broke and completely in love with the wrong person.',
  'naa-hrudayam': 'Rohan Kishore’s most personal record yet — a diary set to fingerpicked guitar and recorded almost entirely live.',
  noor: 'A blockbuster in the old sense: eleven songs, three languages of longing, and at least four choruses you will be singing for the rest of the year.',
  suroor: 'The breakthrough record that turned Kabir Malhotra from a songwriter-for-hire into a household name.',
  aarzoo: 'Qawwali, modular synthesisers and a voice that can move from whisper to wail in a breath. Zoya Ansari’s masterpiece.',
  rangreza: 'A six-track exploration of colour, faith and frequency.',
  yaadein: 'Ten songs about ordinary people in extraordinary detail, recorded in a single room in Kolkata.',
  mausam: 'An EP about weather — literal and otherwise.',
  'neon-rang': 'Vivaan Shah’s love letter to the dancefloor: Bollywood samples, UK bass and pure synth noise, held together by an obsessive ear for a bassline.',
  'basanti-bass': 'Five remixes that shouldn’t work and absolutely do.',
  'midnight-drive': 'The hour when the city goes quiet and the streetlights take over. Eleven slow-burning, cinematic synth pieces.',
  'chrome-hearts': 'A six-track EP of analog synth workouts, recorded live to tape.',
  afterglow: 'Pop songs that feel like a secret told at full volume. Nova Reyes at her most enormous and her most intimate.',
  'static-bloom': 'The EP that caught everyone’s attention — six songs of industrial drums and unshakeable melody.',
  'paper-moon': 'Written in a rented cabin in the Pacific Northwest. Patient, weathered and full of the specific sadness of a place you have left.',
  'tin-roof': 'The earlier record — rougher, quieter, and the reason anyone started paying attention.',
  'honey-glass': 'Warm, unhurried R&B built on live bass, tape saturation and lyrics that treat tenderness as a form of courage.',
  'velvet-hours': 'Six songs for the last hour of the night.',
  kanmani: 'Meera Nair at her most luminous — ten songs that balance classical discipline with pop melody.',
  mazhai: 'An album about rain, in every sense of the word.',
  laya: 'Recorded live to two-inch tape in a single continuous take. A masterclass in rhythm.',
  thaal: 'Thirty years of practice distilled into nine tracks.',
  'blue-hour': 'Dream pop made out of monsoon air and borrowed memory. You can hear the rain in nearly every song.',
  nizhal: 'Six songs of hazy guitars and soft focus.',
  vaanam: 'The first independent Tamil hip-hop record to cross a hundred million streams.',
  kathir: 'The underground mixtape that started it all — eight songs about Chennai, its autorickshaws and its stubborn tenderness.',
}

/* ------------------------------------------------------------------ */
/* Build                                                               */
/* ------------------------------------------------------------------ */
const artists = []
const albums = []
const tracks = []
const genresMap = new Map()

const artDir = join(root, 'public', 'art')
mkdirSync(join(artDir, 'gen'), { recursive: true })

function writeSvg(slug, svg) {
  writeFileSync(join(artDir, 'gen', `${slug}.svg`), svg)
  return `/art/gen/${slug}.svg`
}

/* Assign genres */
for (const a of ARTIST_DEFS) {
  const g = GENRE_DEFS.find((x) => a.genres.some((t) => t.toLowerCase().includes(x.tag.toLowerCase()) || x.tag.toLowerCase().includes(t.toLowerCase())))
  a.genreId = g ? g.id : (a.genre === 'Playback' ? 'playback' : 'indie')
}
// explicit fixes
const GENRE_FIX = {
  'aarav-rao': 'indie', 'dev-nandan': 'soundtrack', 'sreeja-valli': 'playback', 'rohan-kishore': 'folk',
  'kabir-malhotra': 'pop', 'zoya-ansari': 'sufi', 'ritika-sen': 'folk', 'vivaan-shah': 'electronic',
  'elias-vance': 'synthwave', 'nova-reyes': 'pop', 'cassian-blake': 'folk', 'ivy-laurent': 'rnb',
  'meera-nair': 'playback', 'ilaiya-krishnan': 'fusion', 'ananya-iyer': 'dream-pop', 'vetri-maaran': 'hip-hop',
}
for (const a of ARTIST_DEFS) a.genreId = GENRE_FIX[a.id]

/* lyric builder */
function buildLyrics(rnd, language, duration, instrumental) {
  if (instrumental) return []
  const suite = pick(rnd, LYRICS[language])
  const verse = suite.slice(0, 4)
  const chorus = suite.slice(4, 5)[0]
  const bridge = pick(rnd, [
    'Hmm, hmm, hmm',
    'Oh, oh, oh, oh',
    'La la la, la la la',
    'Oh oh oh, yeah',
  ])
  const lines = [
    ...verse,
    chorus,
    ...verse.slice(0, 3).reverse(),
    chorus,
    bridge,
    bridge,
    chorus,
    chorus,
    ...verse.slice(1, 3),
  ]
  const lead = 4 + rnd() * 4
  const usable = Math.max(20, duration - lead - 6)
  const step = usable / lines.length
  return lines.map((text, i) => ({
    t: Math.round((lead + i * step) * 10) / 10,
    text,
  }))
}

/* Build artists + albums + tracks */
const titleCursor = { Telugu: 0, Hindi: 0, English: 0, Tamil: 0 }
const usedAudioByAlbum = new Map()

for (const a of ARTIST_DEFS) {
  const rnd = mulberry(hashStr(a.id))
  const portrait = join(artDir, `artist-${a.id}.jpg`)
  const image = existsSync(portrait) ? `/art/artist-${a.id}.jpg` : writeSvg(a.id, avatarSvg(a.id, a.name))

  const artistAlbumIds = []
  const artistTrackIds = []

  for (const al of a.albums) {
    const alRnd = mulberry(hashStr(al.id))
    const cover = writeSvg(`cover-${al.id}`, coverSvg(`${al.id}:${a.id}:${al.year}`))
    const pool = TITLES[a.language]
    const trackIds = []
    const used = new Set()
    for (let i = 0; i < al.tracks; i++) {
      const title = pool[titleCursor[a.language] % pool.length]
      titleCursor[a.language]++
      const trackId = `${al.id}-${String(i + 1).padStart(2, '0')}`
      // pick audio, avoiding repeats within the album
      let offset = Math.floor(alRnd() * AUDIO.length)
      let guard = 0
      let chosen = AUDIO[offset]
      while (used.has(chosen.name) && guard < AUDIO.length) {
        offset = (offset + 1) % AUDIO.length
        chosen = AUDIO[offset]
        guard++
      }
      used.add(chosen.name)
      const duration = chosen.duration
      const instrumental = alRnd() < 0.12
      const explicit = alRnd() < 0.06
      const plays = Math.floor(alRnd() * 42000000) + 120000
      const track = {
        id: trackId,
        title,
        artistId: a.id,
        artistName: a.name,
        albumId: al.id,
        albumTitle: al.title,
        coverArt: cover,
        duration,
        audioUrl: chosen.url,
        trackNumber: i + 1,
        disc: 1,
        year: al.year,
        language: a.language,
        genre: a.genreId,
        plays,
        explicit,
        hiRes: alRnd() < 0.35,
        instrumental,
        lyrics: buildLyrics(alRnd, a.language, duration, instrumental),
      }
      tracks.push(track)
      trackIds.push(trackId)
      artistTrackIds.push(trackId)
    }
    const album = {
      id: al.id,
      title: al.title,
      artistId: a.id,
      artistName: a.name,
      coverArt: cover,
      year: al.year,
      type: al.type,
      trackIds,
      trackCount: trackIds.length,
      duration: tracks.filter((t) => t.albumId === al.id).reduce((s, t) => s + t.duration, 0),
      genre: a.genreId,
      language: a.language,
      plays: trackIds.reduce((s, id) => s + (tracks.find((t) => t.id === id)?.plays || 0), 0),
      description: ALBUM_BLURBS[al.id] || `${al.title} is the ${al.type} from ${a.name}, released in ${al.year}.`,
    }
    albums.push(album)
    artistAlbumIds.push(al.id)
  }

  artists.push({
    id: a.id,
    name: a.name,
    image,
    bio: a.bio,
    language: a.language,
    genre: a.genreId,
    genres: a.genres,
    hometown: a.hometown,
    monthlyListeners: a.listeners,
    followers: a.followers,
    debutYear: a.debut,
    verified: true,
    albumIds: artistAlbumIds,
    trackIds: artistTrackIds,
    relatedIds: [],
  })
}


/* Related artists: same language first, then same genre */
for (const a of artists) {
  const sameLang = artists.filter((x) => x.id !== a.id && x.language === a.language)
  const sameGenre = artists.filter((x) => x.id !== a.id && x.genre === a.genre && x.language !== a.language)
  a.relatedIds = [...sameLang, ...sameGenre].slice(0, 6).map((x) => x.id)
  if (a.relatedIds.length < 4) {
    a.relatedIds.push(...artists.filter((x) => x.id !== a.id && !a.relatedIds.includes(x.id)).slice(0, 4 - a.relatedIds.length).map((x) => x.id))
  }
}

/* Playlists */
const playlists = []
const allTracks = tracks

function pickTracks(seed, count, filter) {
  const rnd = mulberry(hashStr(seed))
  const pool = allTracks.filter(filter)
  const out = []
  const used = new Set()
  let guard = 0
  while (out.length < Math.min(count, pool.length) && guard < pool.length * 3) {
    const t = pool[Math.floor(rnd() * pool.length)]
    guard++
    if (!t || used.has(t.id)) continue
    used.add(t.id)
    out.push(t.id)
  }
  return out
}

for (const p of [...PLAYLIST_DEFS, ...MADE_FOR_YOU]) {
  const trackIds = pickTracks(p.id, 28, (t) => p.languages.includes(t.language))
  playlists.push({
    id: p.id,
    name: p.name,
    description: p.description,
    curator: p.curator,
    mood: p.mood,
    system: true,
    coverArt: writeSvg(`pl-${p.id}`, coverSvg(`pl:${p.id}`)),
    trackIds,
    followers: 12000 + Math.floor(mulberry(hashStr(p.id))() * 890000),
    gradient: GENRE_DEFS.find((g) => g.tag.toLowerCase().includes(p.mood))?.gradient || 'from-violet-500/40 to-fuchsia-500/10',
  })
}

/* Podcasts */
const podcasts = PODCAST_DEFS.map((p, pi) => {
  const rnd = mulberry(hashStr(p.id))
  const cover = writeSvg(`pod-${p.id}`, coverSvg(`pod:${p.id}`, { motif: 'halftone' }))
  const episodes = Array.from({ length: p.episodes }, (_, ei) => {
    const audio = AUDIO[Math.floor(rnd() * AUDIO.length)]
    const date = new Date(Date.UTC(2026, 10 - ei, 3 + pi))
    return {
      id: `${p.id}-ep-${ei + 1}`,
      title: EPISODE_TITLES[(pi * 3 + ei) % EPISODE_TITLES.length],
      description: `${p.host} on ${p.genre.toLowerCase()} — episode ${ei + 1}. A conversation about craft, chance and the songs that never left us.`,
      duration: audio.duration,
      audioUrl: audio.url,
      date: date.toISOString().slice(0, 10),
      episodeNumber: p.episodes - ei,
    }
  })
  return { ...p, coverArt: cover, episodes, followers: 8000 + Math.floor(rnd() * 420000) }
})

/* Genres */
const genres = GENRE_DEFS.map((g) => {
  const trackIds = allTracks.filter((t) => t.genre === g.id).map((t) => t.id)
  return {
    ...g,
    coverArt: writeSvg(`genre-${g.id}`, coverSvg(`genre:${g.id}`, { motif: 'rings' })),
    trackIds,
    artistIds: artists.filter((a) => a.genre === g.id).map((a) => a.id),
    albumIds: albums.filter((a) => a.genre === g.id).map((a) => a.id),
  }
})

/* Sort */
const byPopularity = (a, b) => b.plays - a.plays
tracks.sort(byPopularity)

/* ------------------------------------------------------------------ */
/* Emit                                                                */
/* ------------------------------------------------------------------ */
const header = `/* eslint-disable */
// AUTO-GENERATED by scripts/build-catalog.mjs — do not edit by hand.
// Audio: royalty-free recordings (Kevin MacLeod / incompetech.com, CC-BY 4.0;
// SoundHelix). Metadata, lyrics and artwork are original SONORA demo content.
import type { Catalog } from '@/lib/types'

export const catalog: Catalog = `

const body = JSON.stringify(
  {
    artists,
    albums,
    tracks,
    playlists,
    podcasts,
    genres,
    generatedAt: new Date().toISOString(),
  },
  null,
  0
)

// `--art-only` regenerates the SVG artwork without touching the catalogue module.
if (!process.argv.includes('--art-only')) {
  writeFileSync(join(root, 'src', 'data', 'catalog.ts'), header + body + '\n')
}

console.log(
  `catalog: ${artists.length} artists, ${albums.length} albums, ${tracks.length} tracks, ${playlists.length} playlists, ${podcasts.length} podcasts, ${genres.length} genres`
)
