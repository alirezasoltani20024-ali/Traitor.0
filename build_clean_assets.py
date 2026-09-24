import cv2, numpy as np, os, json
from PIL import Image
src_path='/mnt/data/a_clean_png_sprite_sheet_style_image_on_a_transpar.png'
out='/mnt/data/v15build'
os.makedirs(out+'/public/assets',exist_ok=True)
src=np.array(Image.open(src_path).convert('RGB'))
# First 20 color columns from the supplied sheet; ignore the extra 21st column.
xb=[135,204,272,341,408,476,544,612,680,747,815,882,949,1016,1083,1150,1217,1284,1350,1417,1483]
yb=[45,130,214,299,384,474,566,655,750,828,914,1024]
cell_w,cell_h=96,104
sheet=Image.new('RGBA',(11*cell_w,20*cell_h),(0,0,0,0))
meta=[]
for skin in range(11):
    for color in range(20):
        x1,x2=xb[color],xb[color+1]
        y1,y2=yb[skin],yb[skin+1]
        crop=src[y1:y2,x1:x2].copy()
        bgr=cv2.cvtColor(crop,cv2.COLOR_RGB2BGR)
        h,w=bgr.shape[:2]
        mask=np.zeros((h+2,w+2),np.uint8)
        tol=10
        # Flood-fill only the outer background. This preserves enclosed white parts (e.g. white bodies).
        for x in range(w):
            for y in (0,h-1):
                cv2.floodFill(bgr,mask,(x,y),(0,0,0),loDiff=(tol,tol,tol),upDiff=(tol,tol,tol),flags=4|cv2.FLOODFILL_MASK_ONLY|(255<<8))
        for y in range(h):
            for x in (0,w-1):
                cv2.floodFill(bgr,mask,(x,y),(0,0,0),loDiff=(tol,tol,tol),upDiff=(tol,tol,tol),flags=4|cv2.FLOODFILL_MASK_ONLY|(255<<8))
        alpha=np.where(mask[1:-1,1:-1]==255,0,255).astype(np.uint8)
        ys,xs=np.where(alpha>0)
        if len(xs)==0:
            continue
        pad=2
        xa=max(0,xs.min()-pad); xb2=min(w,xs.max()+1+pad)
        ya=max(0,ys.min()-pad); yb2=min(h,ys.max()+1+pad)
        cut=np.dstack([crop[ya:yb2,xa:xb2],alpha[ya:yb2,xa:xb2]])
        ch,cw=cut.shape[:2]
        scale=min((cell_w-10)/cw,(cell_h-10)/ch,1.0)
        nw=max(1,round(cw*scale)); nh=max(1,round(ch*scale))
        rgba=Image.fromarray(cut).resize((nw,nh),Image.Resampling.LANCZOS)
        dx=(cell_w-nw)//2; dy=(cell_h-nh)//2
        sheet.alpha_composite(rgba,(skin*cell_w+dx,color*cell_h+dy))
        meta.append({'skin':skin,'color':color,'source_bbox':[int(x1+xa),int(y1+ya),int(x1+xb2),int(y1+yb2)],'dest':[skin*cell_w+dx,color*cell_h+dy,nw,nh]})
sheet.save(out+'/public/assets/characters_clean_20x11.png',optimize=True)
with open(out+'/public/assets/characters_clean_20x11.json','w',encoding='utf-8') as f: json.dump({'cellWidth':cell_w,'cellHeight':cell_h,'skins':11,'colors':20,'sprites':meta},f,ensure_ascii=False,indent=2)
print(sheet.size, len(meta))
