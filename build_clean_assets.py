from PIL import Image
import numpy as np, json, os

SRC='/mnt/data/user-0XbBiW95hFvOeR2XR8qJs38m/30f01158c51f4470ae1ac41703f06f85/mnt/data/original.png'
OUT='/mnt/data/v16fix/public/assets'
os.makedirs(OUT, exist_ok=True)

src=Image.open(SRC).convert('RGBA')
arr=np.array(src)
alpha=arr[:,:,3]

# Exact 20 color centers from the user's original sheet; the extra 21st magenta column is ignored.
xcent=[171.3816,239.8135,308.7020,375.5121,442.0774,509.2461,576.3592,642.8045,708.9172,774.9465,841.8747,908.1780,974.5636,1040.8509,1107.2226,1173.6152,1239.9705,1305.4416,1371.0128,1436.1071]
ycent=[88.1,169.9,254.0,342.1,430.5,525.0,616.4,709.8,796.7,879.6,966.7]

def mids(vals, lo, hi):
    out=[lo]
    for a,b in zip(vals[:-1], vals[1:]):
        out.append(int(round((a+b)/2)))
    out.append(hi)
    return [int(v) for v in out]

xb=mids(xcent,135,1469)
yb=mids(ycent,45,1024)
cell_w, cell_h = 96, 100
atlas=Image.new('RGBA',(11*cell_w,20*cell_h),(0,0,0,0))
sprites=[]

for skin in range(11):
    for color in range(20):
        x1,x2=xb[color],xb[color+1]
        y1,y2=yb[skin],yb[skin+1]
        # Hard cell clipping first: this is what prevents pixels from neighboring sprites
        # ever entering the extracted image.
        crop=src.crop((x1,y1,x2,y2))
        ca=np.array(crop)
        a=ca[:,:,3]
        ys,xs=np.where(a>8)
        if len(xs)==0:
            continue
        xa, xb2 = int(xs.min()), int(xs.max()+1)
        ya, yb2 = int(ys.min()), int(ys.max()+1)
        cut=crop.crop((xa,ya,xb2,yb2))

        # Preserve the original artwork pixels; only resize/center the isolated cutout.
        pad=2
        padded=Image.new('RGBA',(cut.width+pad*2,cut.height+pad*2),(0,0,0,0))
        padded.alpha_composite(cut,(pad,pad))
        scale=min((cell_w-8)/padded.width,(cell_h-8)/padded.height,1.0)
        nw=max(1,round(padded.width*scale)); nh=max(1,round(padded.height*scale))
        sprite=padded.resize((nw,nh),Image.Resampling.LANCZOS)
        dx=(cell_w-nw)//2; dy=(cell_h-nh)//2
        atlas.alpha_composite(sprite,(skin*cell_w+dx,color*cell_h+dy))
        sprites.append({
            'skin':skin,'color':color,
            'source_bbox':[x1+xa,y1+ya,x1+xb2,y1+yb2],
            'atlas_cell':[skin*cell_w,color*cell_h,cell_w,cell_h],
            'dest_in_cell':[dx,dy,nw,nh]
        })

atlas.save(os.path.join(OUT,'characters_clean_20x11.png'), optimize=True)
with open(os.path.join(OUT,'characters_clean_20x11.json'),'w',encoding='utf-8') as f:
    json.dump({'cellWidth':cell_w,'cellHeight':cell_h,'skins':11,'colors':20,'sprites':sprites},f,ensure_ascii=False,indent=2)
print(f'created {len(sprites)} sprites in {atlas.size}')
