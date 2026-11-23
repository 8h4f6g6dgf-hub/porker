"""Build CC0 Quaternius male into a texture-free skinned dealer GLB.
Usage: python3 scripts/build-dealer.py /path/to/Godot-UE
No Blender/additional Python packages required. Original topology/weights retained.
"""
import sys,json,struct,pathlib,copy,hashlib,math
source=pathlib.Path(sys.argv[1]);g=json.loads((source/'Superhero_Male_FullBody.gltf').read_text());raw=(source/'Superhero_Male_FullBody.bin').read_bytes()
print('source sha256',hashlib.sha256(raw).hexdigest())
def read(i):
 a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];n={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']];f={5126:'f',5123:'H',5121:'B'}[a['componentType']];stride=v.get('byteStride',struct.calcsize(f)*n);start=v.get('byteOffset',0)+a.get('byteOffset',0)
 return [struct.unpack_from('<'+f*n,raw,start+j*stride) for j in range(a['count'])]
blob=bytearray();views=[];access=[]
def put(data,kind,component=5126):
 while len(blob)%4:blob.append(0)
 start=len(blob);f={5126:'f',5123:'H',5121:'B'}[component]
 for row in data:blob.extend(struct.pack('<'+f*len(row),*row))
 views.append({'buffer':0,'byteOffset':start,'byteLength':len(blob)-start});a={'bufferView':len(views)-1,'componentType':component,'count':len(data),'type':kind}
 if kind=='VEC3':a.update(min=[min(r[i] for r in data) for i in range(3)],max=[max(r[i] for r in data) for i in range(3)])
 access.append(a);return len(access)-1
p=read(23);normal=read(24);joints=read(29);weights=read(30);indices=read(31)
def linear(c):return ((c+.055)/1.055)**2.4 if c>.04045 else c/12.92
colors=[];newp=[]
for (x,y,z),n in zip(p,normal):
 if y<1.00:c=(.055,.06,.065)
 elif y>1.54:c=(.07,.065,.06)
 elif abs(x)>.68:c=(.58,.40,.29)
 elif y>1.51:c=(.20,.14,.105)
 else:c=(.88,.88,.84)
 # Slight cloth ease removes skin-tight muscle highlights while retaining sewn continuity.
 ease=.008 if c[0]>.8 else .004 if y>1.0 and abs(x)<.235 and y<1.47 else 0
 newp.append((x+n[0]*ease,y+n[1]*ease,z+n[2]*ease));colors.append(tuple(linear(v) for v in c))
attrs={'POSITION':put(newp,'VEC3'),'NORMAL':put(normal,'VEC3'),'COLOR_0':put(colors,'VEC3'),'JOINTS_0':put(joints,'VEC4',5121),'WEIGHTS_0':put(weights,'VEC4')}
prim={'attributes':attrs,'indices':put(indices,'SCALAR',5123),'material':0}
nodes=copy.deepcopy(g['nodes']);nodes[68]['children']=[67,64];nodes[67]['mesh']=0
for i in [65,66]:nodes[i].pop('mesh',None);nodes[i].pop('skin',None)
skin=copy.deepcopy(g['skins'][0]);skin['inverseBindMatrices']=put(read(skin['inverseBindMatrices']),'MAT4')
# Fitted waistcoat shell: continuous curved panels with a real V opening.
# Garment weights are sampled from the nearest source body vertex.
vp=[];vn=[];vc=[];vj=[];vw=[];vi=[]
def vertex(pos,color,normal=(0,0,-1)):
 nearest=min(range(len(p)),key=lambda i:sum((p[i][k]-pos[k])**2 for k in range(3)))
 vp.append(pos);vn.append(normal);vc.append(tuple(linear(v) for v in color));vj.append(joints[nearest]);vw.append(weights[nearest]);return len(vp)-1
def patch(rows,color):
 ids=[[vertex(pos,color) for pos in row] for row in rows]
 for i in range(len(ids)-1):
  for j in range(len(ids[0])-1):
   a,b,c,d=ids[i][j],ids[i][j+1],ids[i+1][j],ids[i+1][j+1];vi.extend([a,c,b,b,c,d])
black=(.065,.07,.075)
# Clip the actual torso surface at garment seams instead of intersecting a
# generic shell with the body. Interpolated skin weights preserve every seam.
def mix(a,b,t):return [[x+(y-x)*t for x,y in zip(av,bv)] for av,bv in zip(a,b)]
def clip(poly,plane):
 result=[]
 for a,b in zip(poly,poly[1:]+poly[:1]):
  da=plane(a[0]);db=plane(b[0])
  if da>=0:result.append(a)
  if (da>=0)!=(db>=0):result.append(mix(a,b,da/(da-db)))
 return result
# Dense weight vectors allow exact interpolation along newly cut edges.
dense=[]
for js,ws in zip(joints,weights):
 row=[0.0]*65
 for j,w in zip(js,ws):row[j]+=w
 dense.append(row)
for side in [-1,1]:
 for front in [True,False]:
  planes=[lambda q:q[1]-.96,lambda q:1.525-q[1],lambda q:.20-abs(q[0]),lambda q,side=side:side*q[0],lambda q,front=front:(-.025-q[2]) if front else q[2]+.025]
  if front:planes.append(lambda q,side=side:side*q[0]-(q[1]-1.245)*.48)
  for tri in range(0,len(indices),3):
   poly=[[list(p[i]),list(normal[i]),dense[i]] for (i,) in indices[tri:tri+3]]
   for plane in planes:
    if not poly:break
    poly=clip(poly,plane)
   if len(poly)<3:continue
   ids=[]
   for pos,n,w in poly:
    ids.append(len(vp));vp.append(tuple(pos[k]+n[k]*.018 for k in range(3)));vn.append(n);vc.append(tuple(linear(v) for v in black))
    top=sorted(range(65),key=lambda j:w[j],reverse=True)[:4];total=sum(w[j] for j in top);vj.append(top);vw.append([w[j]/total for j in top])
   for i in range(1,len(ids)-1):vi.extend([ids[0],ids[i],ids[i+1]])
# Tailored shirt collar and tie lie in front of the chest (-Z in source coordinates).
patch([[(-.016,1.49,-.197),(.016,1.49,-.197)],[(-.022,1.455,-.197),(.022,1.455,-.197)],[(-.026,1.31,-.191),(.026,1.31,-.191)],[(0,1.28,-.19),(0,1.28,-.19)]],(.025,.028,.03))
for sign in [-1,1]:
 patch([[(sign*.025,1.50,-.185),(sign*.09,1.52,-.175)],[(sign*.058,1.435,-.19),(sign*.132,1.485,-.19)]],(.93,.93,.89))
cloth={'attributes':{'POSITION':put(vp,'VEC3'),'NORMAL':put(vn,'VEC3'),'COLOR_0':put(vc,'VEC3'),'JOINTS_0':put(vj,'VEC4',5121),'WEIGHTS_0':put(vw,'VEC4')},'indices':put([(i,) for i in vi],'SCALAR',5123),'material':0}
out={'asset':{'version':'2.0','generator':'Poker Academy CC0 dealer adaptation'},'scene':0,'scenes':[{'nodes':[68]}],'nodes':nodes,'skins':[skin],'meshes':[{'name':'Dealer_Skinned','primitives':[prim,cloth]}],'materials':[{'name':'Dealer_matte','pbrMetallicRoughness':{'baseColorFactor':[1,1,1,1],'metallicFactor':0,'roughnessFactor':.9},'doubleSided':True}],'buffers':[{'byteLength':len(blob)}],'bufferViews':views,'accessors':access}
js=json.dumps(out,separators=(',',':')).encode();js+=b' '*((-len(js))%4);blob+=b'\0'*((-len(blob))%4)
data=struct.pack('<III',0x46546c67,2,12+8+len(js)+8+len(blob))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(blob),0x004e4942)+blob
path=pathlib.Path('public/assets/dealer/dealer.glb');path.write_bytes(data);print(path,len(data),'bytes',len(indices)//3,'body triangles',len(skin['joints']),'bones')
