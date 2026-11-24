import urllib.parse, urllib.request, concurrent.futures, json, struct

INCOMPETECH = "https://incompetech.com/music/royalty-free/mp3-royaltyfree/"
NAMES = """Carefree|Wholesome|Sneaky Snitch|Fluffing a Duck|Wallpaper|Life of Riley|Comfortable Mystery|Local Forecast - Elevator|Daily Beetle|Investigations|Peaceful Desolation|Chill Wave|Digital Lemonade|Bit Shift|Highlight Reel|Lobby Time|Loopster|Poppers and Prosecco|Salty Ditty|Silver Flame|Thinking Music|Backbay Lounge|Bossa Antigua|Easy Jam|Funk Game Loop|Funkorama|Hidden Agenda|I Knew a Guy|Moorland|Parisian|Porch Blues|Slow Burn|Supernatural|The Complex|Water Lily|Whiskey on the Mississippi|Wish Background|Your Call|As I Figure|Beach Bum|Bittersweet|Chee Zee Beach|Comparsa|Crossing the Chasm|Deliberate Thought|Dream Culture|Faster Does It|Heartbreaking|Hep Cats|Hustle|In Your Arms|Minima""".split("|")

BITRATES = [0,32,40,48,56,64,80,96,112,128,160,192,224,256,320,0]
BITRATES2 = [0,8,16,24,32,40,48,56,64,80,96,112,128,144,160,0]
SAMPLERATES = {3:{0:44100,1:48000,2:32000}, 2:{0:22050,1:24000,2:16000}, 0:{0:11025,1:12000,2:8000}}
SAMPLES_PER_FRAME = {3:1152, 2:576, 0:576}

def id3_size(b):
    if b[:3] != b'ID3': return 0
    size = (b[6]<<21)|(b[7]<<14)|(b[8]<<7)|b[9]
    return 10 + size + (10 if (b[5] & 0x10) else 0)

def parse_frame(b, i):
    if i+4 > len(b) or b[i] != 0xFF or (b[i+1] & 0xE0) != 0xE0: return None
    ver = (b[i+1] >> 3) & 0x03      # 3=MPEG1, 2=MPEG2, 0=MPEG2.5
    layer = (b[i+1] >> 1) & 0x03    # 1 = Layer III
    if layer != 1: return None
    br_idx = (b[i+2] >> 4) & 0x0F
    sr_idx = (b[i+2] >> 2) & 0x03
    if br_idx in (0,15) or sr_idx == 3: return None
    sr = SAMPLERATES.get(ver,{}).get(sr_idx)
    if not sr: return None
    br = (BITRATES if ver==3 else BITRATES2)[br_idx]
    ch = (b[i+3] >> 6) & 0x03   # 3=mono, else stereo
    return dict(ver=ver, sr=sr, br=br, mono=(ch==3), spf=SAMPLES_PER_FRAME.get(ver,1152))

def measure(name, url, is_sh=False):
    try:
        req = urllib.request.Request(url, headers={"Range":"bytes=0-262143"})
        with urllib.request.urlopen(req, timeout=25) as r:
            b = r.read(262144)
            total = r.headers.get("Content-Range","").split("/")[-1]
        total = int(total) if total.isdigit() else len(b)
        i = id3_size(b)
        # find first frame
        frame = None
        for off in range(i, min(len(b)-4, i+200000)):
            f = parse_frame(b, off)
            if f:
                f2 = parse_frame(b, off+1)  # sanity
                frame = f; i = off; break
        if not frame: return {"name":name,"dur":0,"bytes":total}
        # locate Xing/Info
        if frame['ver']==3: side = 17 if frame['mono'] else 32
        else: side = 9 if frame['mono'] else 17
        xoff = i + 4 + side
        tag = b[xoff:xoff+4]
        dur = 0
        if tag in (b'Xing', b'Info'):
            flags = struct.unpack('>I', b[xoff+4:xoff+8])[0]
            p = xoff+8
            frames = None
            if flags & 1:
                frames = struct.unpack('>I', b[p:p+4])[0]; p += 4
            if frames and frame['sr']:
                dur = frames * frame['spf'] / frame['sr']
        if dur <= 0:
            dur = (total*8) / (frame['br']*1000) if frame['br'] else 0
        return {"name":name,"dur":round(dur,1),"bytes":total,"br":frame['br']}
    except Exception as e:
        return {"name":name,"dur":0,"bytes":0,"err":str(e)[:60]}

jobs=[]
for n in NAMES:
    jobs.append((n, INCOMPETECH+urllib.parse.quote(n)+".mp3"))
for i in range(1,18):
    jobs.append((f"SoundHelix-Song-{i}", f"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-{i}.mp3"))

with concurrent.futures.ThreadPoolExecutor(10) as ex:
    res = list(ex.map(lambda j: measure(*j), jobs))

ok=[r for r in res if r.get("dur",0)>0]
print(f"measured {len(ok)}/{len(res)}")
for r in res[:5]: print(r)
print("total duration sec:", round(sum(r.get('dur',0) for r in ok)))
json.dump(res, open("audio-meta.json","w"), indent=1)
